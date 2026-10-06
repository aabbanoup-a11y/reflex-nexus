import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/runtime-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnifiedWorkspaceNav } from "@/components/UnifiedWorkspaceNav";

export const Route = createFileRoute("/_authenticated/companion")({
  head: () => ({
    meta: [
      { title: "التحكم في Chrome — AbanoubAI Companion" },
      { name: "description", content: "اربط متصفح Chrome وتحكم فيه تلقائيًا مع سجل وزر إيقاف." },
      { property: "og:title", content: "AbanoubAI Companion" },
      { property: "og:description", content: "تحكم آمن في Chrome من لوحة AbanoubAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanionPage,
});

type Device = { id: string; device_name: string; platform: string; status: string; last_seen_at?: string | null };
type Cmd = { id: string; kind: string; status: string; requires_approval: boolean; payload: any; created_at: string; error: string | null };
type Ev = { id: string; event_type: string; message: string | null; created_at: string };
declare const chrome: any;
declare global {
  interface Window { AbanoubAI?: { savePairing?: (deviceId: string, accessToken: string) => void; startVoiceRecognition?: () => void; stopVoiceRecognition?: () => void } }
}

function CompanionPage() {
  const [uid, setUid] = useState<string>("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [dev, setDev] = useState<string>("");
  const [cmds, setCmds] = useState<Cmd[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [extId, setExtId] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [url, setUrl] = useState("https://example.com");
  const [appPackage, setAppPackage] = useState("");
  const [text, setText] = useState("");
  const [action, setAction] = useState("open_url");
  const [mode, setMode] = useState(() => localStorage.getItem("companion-mode") ?? "balanced");
  const [msg, setMsg] = useState("");
  const [androidInitStarted, setAndroidInitStarted] = useState(false);

  async function loadDevices() {
    const { data } = await supabase.from("companion_devices").select("id,device_name,platform,status,last_seen_at").order("created_at", { ascending: false });
    setDevices(data ?? []);
    if (!dev && data?.[0]) setDev(data[0].id);
  }
  async function loadLog(d: string) {
    const [c, e] = await Promise.all([
      supabase.from("companion_commands").select("id,kind,status,requires_approval,payload,created_at,error").eq("device_id", d).order("created_at", { ascending: false }).limit(30),
      supabase.from("companion_events").select("id,event_type,message,created_at").eq("device_id", d).order("created_at", { ascending: false }).limit(30),
    ]);
    setCmds((c.data as Cmd[]) ?? []);
    setEvents(e.data ?? []);
  }

  useEffect(() => {
    setExtId(localStorage.getItem("companion-ext-id") ?? "");
    supabase.auth.getSession().then(({ data }) => {
      setUid(data.session?.user.id ?? "");
      setSessionToken(data.session?.access_token ?? "");
      if (data.session?.user.id) void (supabase as any).from("companion_settings").select("mode,emergency_stopped").eq("user_id", data.session.user.id).maybeSingle().then(({ data: settings }: any) => {
        if (settings?.mode) { setMode(settings.mode); localStorage.setItem("companion-mode", settings.mode); }
      });
    });
    void loadDevices();
  }, []);

  useEffect(() => {
    if (!uid || androidInitStarted || !window.AbanoubAI?.savePairing || devices.some((item) => item.platform === "android")) return;
    setAndroidInitStarted(true);
    void createAndroidDevice();
  }, [uid, devices, androidInitStarted]);

  useEffect(() => {
    if (!dev) return;
    void loadLog(dev);
    const ch = supabase
      .channel(`panel-${dev}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "companion_commands", filter: `device_id=eq.${dev}` }, () => loadLog(dev))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "companion_events", filter: `device_id=eq.${dev}` }, () => loadLog(dev))
      .on("postgres_changes", { event: "*", schema: "public", table: "companion_devices" }, () => loadDevices())
      .subscribe();
    return () => void supabase.removeChannel(ch);
  }, [dev]);

  async function pair() {
    if (!extId) return setMsg("اكتب رقم الإضافة (Extension ID) الأول");
    localStorage.setItem("companion-ext-id", extId);
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return setMsg("سجّل الدخول الأول");
    const { data: d, error } = await supabase.from("companion_devices").insert({ user_id: uid, device_name: "Chrome", platform: "chrome" }).select("id").single();
    if (error) return setMsg(error.message);
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return setMsg("افتح الصفحة من Chrome والإضافة مثبتة");
    chrome.runtime.sendMessage(extId, {
      type: "pair", deviceId: d.id,
      session: { access_token: s.session.access_token, refresh_token: s.session.refresh_token, expires_at: s.session.expires_at, user_id: uid },
    }, (r: any) => {
      setMsg(r?.ok ? "تم الربط ✓" : "الإضافة ما ردتش — اتأكد من الرقم");
      setDev(d.id); void loadDevices();
    });
  }

  async function createAndroidDevice() {
    if (!uid) return setMsg("سجّل الدخول الأول");
    const { data: s } = await supabase.auth.getSession();
    const { data: d, error } = await supabase
      .from("companion_devices")
      .insert({ user_id: uid, device_name: "Oppo", platform: "android" })
      .select("id")
      .single();
    if (error) return setMsg(error.message);
    setDev(d.id);
    if (window.AbanoubAI?.savePairing && s.session) {
      window.AbanoubAI.savePairing(d.id, s.session.access_token);
      setMsg("تم إنشاء جهاز Oppo وإرسال بيانات الربط إلى التطبيق تلقائيًا ✓");
    } else {
      setMsg(`تم إنشاء جهاز Oppo. Device ID: ${d.id}`);
    }
    await loadDevices();
  }

  async function sendPairingToAndroid() {
    const { data: s } = await supabase.auth.getSession();
    const selected = devices.find((d) => d.id === dev);
    if (!selected || selected.platform !== "android") return setMsg("اختر جهاز Oppo أولًا");
    if (!s.session) return setMsg("سجّل الدخول الأول");
    if (!window.AbanoubAI?.savePairing) return setMsg("افتح لوحة التحكم من داخل تطبيق Oppo لإرسال الربط تلقائيًا");
    window.AbanoubAI.savePairing(selected.id, s.session.access_token);
    setMsg("تم إرسال Device ID وAccess token إلى تطبيق Oppo تلقائيًا ✓");
  }

  async function send(kind: string, payload: Record<string, unknown> = {}) {
    if (!dev) return;
    const command = {
      device_id: dev, user_id: uid, kind, payload: { ...payload, run_mode: mode } as any,
      requires_approval: false, status: "approved", approved_at: new Date().toISOString(),
    };
    let { error } = await supabase.from("companion_commands").insert(command);
    if (error && /kind_check|check constraint/i.test(error.message) && kind !== "tap_text") {
      ({ error } = await supabase.from("companion_commands").insert({ ...command, kind: "tap_text", payload: { ...payload, run_mode: mode, agent_action: kind } as any }));
    }
    if (!error && kind === "stop") await (supabase as any).from("companion_settings").upsert({ user_id: uid, emergency_stopped: true, updated_at: new Date().toISOString() });
    setMsg(error ? error.message : "اتنفذ تلقائيًا");
  }
  async function resumeSystem() {
    await (supabase as any).from("companion_settings").upsert({ user_id: uid, emergency_stopped: false, updated_at: new Date().toISOString() });
    setMsg("تم رفع حالة الطوارئ. افتح تطبيق Oppo إذا كان الاتصال قد أوقف يدويًا.");
  }
  async function sendSelected() {
    const value = text.trim();
    const payload = action === "open_url" || action === "download_file" ? { url: url.trim() } :
      action === "open_app" ? { package: appPackage.trim() } :
      action === "open_settings" ? { setting: value || "accessibility" } :
      action === "speak" ? { text: value } :
      action === "tap_text" || action === "type_text" ? { text: value } : {};
    await send(action, payload);
  }
  async function runScan() {
    await send("device_inventory");
    await send("app_inventory");
    await send("notification_inventory");
    setMsg("تم إرسال الفحص الشامل تلقائيًا؛ راجع سجل التنفيذ");
  }

  return (
    <main dir="rtl" className="mx-auto max-w-3xl space-y-5 p-5">
      <UnifiedWorkspaceNav />
      <header>
        <h1 className="text-2xl font-bold">التحكم في Chrome</h1>
        <p className="text-sm text-muted-foreground">
          ثبّت إضافة AbanoubAI Companion في Chrome، ثم اربطها هنا. النماذج تنفذ الأوامر المسموحة تلقائيًا مع سجل تنفيذ وزر إيقاف طارئ.
        </p>
      </header>

      <section className="space-y-2 rounded-lg border bg-card p-4">
        <b>1) الربط</b>
        <Input dir="ltr" value={extId} onChange={(e) => setExtId(e.target.value.trim())} placeholder="Extension ID من chrome://extensions" />
        <Button onClick={() => void pair()}>ربط هذا المتصفح</Button>
        <Button variant="outline" onClick={() => void createAndroidDevice()}>إنشاء جهاز Android لـ Oppo</Button>
        <Button
          variant="outline"
          disabled={!sessionToken}
          onClick={() => void navigator.clipboard.writeText(sessionToken).then(() => setMsg("تم نسخ Access token المؤقت؛ الصقه في تطبيق Oppo ثم احذفه من الحافظة بعد الربط."))}
        >
          نسخ Access token لتطبيق Oppo
        </Button>
        {dev && devices.find((d) => d.id === dev)?.platform === "android" && (
          <Button
            variant="outline"
            onClick={() => void sendPairingToAndroid()}
          >
            إرسال الربط تلقائيًا إلى تطبيق Oppo
          </Button>
        )}
        {dev && devices.find((d) => d.id === dev)?.platform === "android" && (
          <Button
            variant="outline"
            onClick={() => void navigator.clipboard.writeText(dev).then(() => setMsg("تم نسخ Device ID؛ الصقه في تطبيق Oppo."))}
          >
            نسخ Device ID لتطبيق Oppo
          </Button>
        )}
        {msg && <p className="text-sm">{msg}</p>}
      </section>

      {devices.length > 0 && (
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <b>2) نظام الهاتف الموحد</b>
          <select className="w-full rounded border bg-background p-2" value={dev} onChange={(e) => setDev(e.target.value)}>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.device_name} · {d.platform} · {d.status === "online" ? "متصل" : "غير متصل"}</option>
            ))}
          </select>
          {(() => { const selected = devices.find((d) => d.id === dev); return <div className="rounded border bg-muted p-3 text-sm">
            <b>الحالة: {selected?.status === "online" ? "متصل" : "غير متصل"}</b>
            <span className="mx-2">·</span>
            آخر اتصال: {selected?.last_seen_at ? new Date(selected.last_seen_at).toLocaleString("ar-EG") : "غير معروف"}
            <div className="mt-1 text-xs text-muted-foreground">الوضع: {mode === "economic" ? "اقتصادي" : mode === "smart" ? "أقصى قدرات" : "متوازن"}</div>
          </div>; })()}
          <select className="w-full rounded border bg-background p-2" value={mode} onChange={(e) => { const next = e.target.value; setMode(next); localStorage.setItem("companion-mode", next); void (supabase as any).from("companion_settings").upsert({ user_id: uid, mode: next, updated_at: new Date().toISOString() }); }}>
            <option value="economic">الوضع الاقتصادي — أقل شبكة</option>
            <option value="balanced">الوضع المتوازن</option>
            <option value="smart">أقصى قدرات — نماذج وأدوات أكثر</option>
          </select>
          <select className="w-full rounded border bg-background p-2" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="open_url">فتح رابط</option><option value="open_app">فتح تطبيق</option><option value="open_settings">فتح إعدادات</option>
            <option value="open_camera">فتح الكاميرا</option><option value="download_file">تنزيل رابط</option><option value="speak">نطق نص</option><option value="listen">استماع من الميكروفون</option>
            <option value="back">رجوع</option><option value="home">الرئيسية</option><option value="recents">التطبيقات الأخيرة</option><option value="tap_text">ضغط نص</option><option value="type_text">كتابة نص</option>
            <option value="screenshot">لقطة شاشة</option><option value="screen_text">قراءة النص الظاهر</option><option value="device_inventory">معلومات الجهاز</option><option value="app_inventory">قائمة التطبيقات</option><option value="notification_inventory">قراءة الإشعارات</option>
          </select>
          {(action === "open_url" || action === "download_file") && <Input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />}
          {action === "open_app" && <Input dir="ltr" value={appPackage} onChange={(e) => setAppPackage(e.target.value.trim())} placeholder="com.google.android.youtube" />}
          {["open_settings", "speak", "tap_text", "type_text"].includes(action) && <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="القيمة أو النص" />}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void sendSelected()}>تنفيذ الأمر</Button>
            <Button variant="outline" onClick={() => void runScan()}>فحص شامل</Button>
            <Button variant="destructive" onClick={() => void send("stop")}>إيقاف طارئ</Button>
            <Button variant="outline" onClick={() => void resumeSystem()}>رفع الطوارئ</Button>
          </div>
        </section>
      )}

      {dev && (
        <section className="space-y-2 rounded-lg border bg-card p-4">
          <b>سجل التدقيق</b>
          {cmds.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 border-b py-1 text-sm">
              <span>{c.kind} {c.payload?.url ?? c.payload?.text ?? ""} — {c.status}{c.error ? ` (${c.error})` : ""}</span>
            </div>
          ))}
          {events.map((e) => (
            <div key={e.id} className="text-xs text-muted-foreground">
              {new Date(e.created_at).toLocaleTimeString()} · {e.event_type}
              {e.event_type === "screenshot" && e.message?.startsWith("data:") ? (
                <img src={e.message} alt="لقطة من المتصفح" className="mt-1 rounded border" />
              ) : ` · ${e.message ?? ""}`}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
