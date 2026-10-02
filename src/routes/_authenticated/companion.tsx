import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/runtime-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/companion")({
  head: () => ({
    meta: [
      { title: "التحكم في Chrome — AbanoubAI Companion" },
      { name: "description", content: "اربط متصفح Chrome وتحكم فيه بموافقتك مع سجل وزر إيقاف." },
      { property: "og:title", content: "AbanoubAI Companion" },
      { property: "og:description", content: "تحكم آمن في Chrome من لوحة AbanoubAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanionPage,
});

type Device = { id: string; device_name: string; platform: string; status: string };
type Cmd = { id: string; kind: string; status: string; requires_approval: boolean; payload: any; created_at: string; error: string | null };
type Ev = { id: string; event_type: string; message: string | null; created_at: string };
const SENSITIVE = new Set(["open_url", "open_app", "open_settings", "open_camera", "download_file", "speak", "listen", "tap_text", "tap_coordinates", "long_press", "type_text", "swipe", "screenshot", "device_inventory", "app_inventory", "notification_inventory"]);
declare const chrome: any;
declare global {
  interface Window { AbanoubAI?: { savePairing: (deviceId: string, accessToken: string) => void } }
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
  const [msg, setMsg] = useState("");
  const [androidInitStarted, setAndroidInitStarted] = useState(false);

  async function loadDevices() {
    const { data } = await supabase.from("companion_devices").select("id,device_name,platform,status").order("created_at", { ascending: false });
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
    const needs = SENSITIVE.has(kind);
    const { error } = await supabase.from("companion_commands").insert({
      device_id: dev, user_id: uid, kind, payload: payload as any,
      requires_approval: needs, status: needs ? "queued" : "approved", approved_at: needs ? null : new Date().toISOString(),
    });
    setMsg(error ? error.message : needs ? "الأمر حساس — وافق عليه من السجل" : "اتبعت");
  }
  async function approve(id: string, ok: boolean) {
    await supabase.from("companion_commands").update(ok ? { status: "approved", approved_at: new Date().toISOString() } : { status: "rejected" }).eq("id", id);
  }

  return (
    <main dir="rtl" className="mx-auto max-w-3xl space-y-5 p-5">
      <header>
        <h1 className="text-2xl font-bold">التحكم في Chrome</h1>
        <p className="text-sm text-muted-foreground">
          ثبّت إضافة AbanoubAI Companion في Chrome، ثم اربطها هنا. الأوامر الحساسة لا تُنفَّذ إلا بموافقتك.
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
          <b>2) الأوامر</b>
          <select className="w-full rounded border bg-background p-2" value={dev} onChange={(e) => setDev(e.target.value)}>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.device_name} · {d.platform} · {d.status === "online" ? "متصل" : "غير متصل"}</option>
            ))}
          </select>
          <Input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Input dir="ltr" value={appPackage} onChange={(e) => setAppPackage(e.target.value.trim())} placeholder="اسم حزمة التطبيق مثل com.google.android.youtube" />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="نص للنقر عليه أو كتابته" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void send("open_url", { url })}>فتح الرابط</Button>
            <Button onClick={() => void send("open_app", { package: appPackage })}>فتح أي تطبيق</Button>
            <Button onClick={() => void send("open_camera")}>فتح الكاميرا</Button>
            <Button onClick={() => void send("download_file", { url })}>تنزيل الرابط</Button>
            <Button onClick={() => void send("speak", { text })}>نطق النص</Button>
            <Button onClick={() => void send("listen")}>استمع من الميكروفون</Button>
            <Button variant="outline" onClick={() => void send("open_settings", { setting: "accessibility" })}>إعدادات Accessibility</Button>
            <Button variant="outline" onClick={() => void send("back")}>رجوع</Button>
            <Button variant="outline" onClick={() => void send("home")}>الرئيسية</Button>
            <Button variant="outline" onClick={() => void send("recents")}>التطبيقات الأخيرة</Button>
            <Button variant="outline" onClick={() => void send("tap_text", { text })}>انقر على النص</Button>
            <Button variant="outline" onClick={() => void send("type_text", { text })}>اكتب النص</Button>
            <Button variant="outline" onClick={() => void send("screenshot")}>لقطة شاشة</Button>
            <Button variant="outline" onClick={() => void send("device_inventory")}>معلومات الجهاز</Button>
            <Button variant="outline" onClick={() => void send("app_inventory")}>قائمة التطبيقات</Button>
            <Button variant="outline" onClick={() => void send("notification_inventory")}>قراءة الإشعارات</Button>
            <Button variant="destructive" onClick={() => void send("stop")}>إيقاف طارئ</Button>
          </div>
        </section>
      )}

      {dev && (
        <section className="space-y-2 rounded-lg border bg-card p-4">
          <b>سجل التدقيق</b>
          {cmds.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 border-b py-1 text-sm">
              <span>{c.kind} {c.payload?.url ?? c.payload?.text ?? ""} — {c.status}{c.error ? ` (${c.error})` : ""}</span>
              {c.status === "queued" && (
                <span className="flex gap-1">
                  <Button size="sm" onClick={() => void approve(c.id, true)}>موافقة</Button>
                  <Button size="sm" variant="outline" onClick={() => void approve(c.id, false)}>رفض</Button>
                </span>
              )}
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
