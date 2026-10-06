import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { networkTurn, mergeRepo, type ToolEvent } from "@/lib/network.functions";
import { MANAGER_ID, MANAGER_LABEL, NET_MODELS, isLocal, netLabel, REPOS, WORK_BRANCH } from "@/lib/models30";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/runtime-client";
import { UnifiedWorkspaceNav } from "@/components/UnifiedWorkspaceNav";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "شبكة الـ30 نموذج | Abanoup" },
      { name: "description", content: "30 نموذج ذكاء اصطناعي في محادثة واحدة: بيكلموا بعض، بيستخدموا المتصفح، وبيعدّلوا مستودعات GitHub." },
      { property: "og:title", content: "شبكة الـ30 نموذج | Abanoup" },
      { property: "og:description", content: "محادثة مشتركة، متصفح سحابي، وتعديل GitHub في فرع تجريبي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Network,
});

type Entry = { id: string; who: string; text: string; tools?: ToolEvent[]; err?: boolean };
type PhoneDevice = { id: string; device_name: string; status: string; last_seen_at: string | null };
type PendingPhoneCommand = { id: string; kind: string; payload: { url?: string; package?: string; text?: string } };
const KEY = "network-thread-v1";
type SpeechCtor = new () => { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: any) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
declare global { interface Window { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor; AbanoubAI?: { savePairing?: (deviceId: string, accessToken: string) => void; startVoiceRecognition?: () => void; stopVoiceRecognition?: () => void }; __abanoupaiVoiceResult?: (text: string) => void; __abanoupaiVoiceError?: (text: string) => void } }

function Network() {
  const turn = useServerFn(networkTurn);
  const merge = useServerFn(mergeRepo);
  const [thread, setThread] = useState<Entry[]>([]);
  const [picked, setPicked] = useState<string[]>([MANAGER_ID, ...NET_MODELS.filter((m) => m.provider === "cloudflare").slice(0, 5).map((m) => m.id)]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState("");
  const [voiceOn, setVoiceOn] = useState(false);
  const voice = useRef<{ stop: () => void } | null>(null);
  const [networkMode] = useState(() => localStorage.getItem("companion-mode") ?? "balanced");
  const stop = useRef(false);
  const ref = useRef<Entry[]>([]);

  useEffect(() => {
    window.__abanoupaiVoiceResult = (text) => { setVoiceOn(false); if (text.trim()) void sendText(text); };
    window.__abanoupaiVoiceError = (text) => { setVoiceOn(false); setInput(text); };
    return () => { delete window.__abanoupaiVoiceResult; delete window.__abanoupaiVoiceError; };
  });

  const [uid, setUid] = useState<string | null | undefined>(undefined);
  const [phone, setPhone] = useState<PhoneDevice | null>(null);
  const [pendingPhone, setPendingPhone] = useState<PendingPhoneCommand[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUid(id);
      if (!id) return;
      const loadPhone = async () => {
        const [{ data: device }, { data: pending }] = await Promise.all([
          supabase.from("companion_devices").select("id,device_name,status,last_seen_at").eq("user_id", id).eq("platform", "android").order("last_seen_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
          supabase.from("companion_commands").select("id,kind,payload").eq("user_id", id).eq("status", "queued").order("created_at", { ascending: false }).limit(5),
        ]);
        setPhone(device as PhoneDevice | null);
        setPendingPhone((pending ?? []) as PendingPhoneCommand[]);
      };
      void loadPhone();
      const phoneChannel = supabase.channel(`network-phone-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "companion_devices", filter: `user_id=eq.${id}` }, () => void loadPhone())
        .on("postgres_changes", { event: "*", schema: "public", table: "companion_commands", filter: `user_id=eq.${id}` }, () => void loadPhone())
        .subscribe();
      const { data: rows } = await supabase
        .from("network_messages")
        .select("id,who,content,tools,is_error")
        .order("created_at", { ascending: true })
        .limit(300);
      let s: Entry[] = (rows ?? []).map((r) => ({ id: r.id, who: r.who, text: r.content, tools: (r.tools as unknown as ToolEvent[]) ?? [], err: r.is_error }));
      // one-time move of old browser-only conversation into the account
      if (!s.length) {
        try {
          const old = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Entry[];
          if (old.length) {
            await supabase.from("network_messages").insert(old.slice(-200).map((e) => ({ user_id: id, who: e.who, content: e.text, tools: (e.tools ?? []) as never, is_error: !!e.err })));
            s = old;
            localStorage.removeItem(KEY);
          }
        } catch { /* ignore */ }
      }
      ref.current = s;
      setThread(s);
      return () => { void supabase.removeChannel(phoneChannel); };
    })();
  }, []);

  async function approvePhone(id: string, approve: boolean) {
    await supabase.from("companion_commands").update(approve ? { status: "approved", approved_at: new Date().toISOString() } : { status: "rejected" }).eq("id", id);
    setPendingPhone((items) => items.filter((item) => item.id !== id));
  }

  const push = (e: Entry) => {
    ref.current = [...ref.current, e];
    setThread(ref.current);
    const tools = (e.tools ?? []).map(({ shot: _s, ...t }) => t);
    void supabase.auth.getSession().then(async ({ data }) => {
      const id = data.session?.user.id;
      if (!id) return;
      const { error } = await supabase.from("network_messages").insert({ user_id: id, who: e.who, content: e.text.slice(0, 50000), tools: tools as never, is_error: !!e.err });
      if (error) console.error("save failed", error.message);
    });
  };

  async function round(models: string[]) {
    stop.current = false;
    const effective = networkMode === "economic" ? models.slice(0, 1) : networkMode === "balanced" ? models.slice(0, 3) : models;
    for (const m of effective) {
      if (stop.current) break;
      setBusy(netLabel(m));
      try {
        if (isLocal(m)) {
          const { runLocal } = await import("@/lib/local-llm");
          const text = await runLocal(m, "أنت نموذج ذكاء اصطناعي شغال أوفلاين على جهاز المستخدم ضمن فريق نماذج. رد بالعربية المصرية باختصار.", ref.current.map((e) => ({ who: e.who === "me" ? "me" : netLabel(e.who), text: e.text })), (p) => setBusy(`${netLabel(m)} — ${p.slice(0, 60)}`));
          push({ id: crypto.randomUUID(), who: m, text });
          continue;
        }
        const r = await turn({ data: { model: m, thread: ref.current.map((e) => ({ who: e.who === "me" ? "me" : netLabel(e.who), text: e.text + (e.tools?.length ? "\n" + e.tools.map((t) => `${t.tool}: ${t.text.slice(0, 1500)}`).join("\n") : "") })) } });
        push({ id: crypto.randomUUID(), who: m, text: r.usedModel !== m ? `${r.text}\n(اتحوّل لـ ${netLabel(r.usedModel)} عشان الأصلي فشل)` : r.text, tools: r.tools });
      } catch (e) {
        push({ id: crypto.randomUUID(), who: m, text: (e as Error).message, err: true });
      }
    }
    setBusy("");
  }

  async function sendText(value: string) {
    const t = value.trim();
    if (!t || busy) return;
    setInput("");
    push({ id: crypto.randomUUID(), who: "me", text: t });
    await round(picked);
  }
  async function send() { await sendText(input); }

  function toggleVoice() {
    if (voiceOn) { if (window.AbanoubAI?.stopVoiceRecognition) window.AbanoubAI.stopVoiceRecognition(); else voice.current?.stop(); voice.current = null; setVoiceOn(false); return; }
    if (window.AbanoubAI?.startVoiceRecognition) {
      setVoiceOn(true);
      window.AbanoubAI.startVoiceRecognition();
      return;
    }
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return setInput("التعرف الصوتي غير مدعوم في هذا WebView");
    const r = new Ctor();
    r.lang = "ar-EG"; r.continuous = true; r.interimResults = false;
    r.onresult = (e: any) => {
      const last = e.results?.[e.results.length - 1]?.[0]?.transcript?.trim() ?? "";
      if (!last) return;
      const normalized = last.toLowerCase();
      const wake = normalized.includes("abanoupai") || last.includes("أبانوباي") || last.includes("أبانوب اي") || last.includes("ابانوباي");
      if (wake) {
        const command = last.replace(/abanoupai|أبانوباي|أبانوب اي|ابانوباي/gi, "").trim();
        if (command) void sendText(command);
      }
    };
    r.onend = () => { if (voiceOn) { try { r.start(); } catch { /* already listening */ } } };
    voice.current = r; setVoiceOn(true); r.start();
  }

  async function doMerge(repo: string) {
    if (!confirm(`دمج فرع ${WORK_BRANCH} في النسخة الأصلية من ${repo}؟`)) return;
    try {
      const r = await merge({ data: { repo: repo as (typeof REPOS)[number] } });
      push({ id: crypto.randomUUID(), who: "me", text: `✅ اتدمج ${repo}: ${r.url}` });
    } catch (e) {
      push({ id: crypto.randomUUID(), who: "me", text: `الدمج فشل: ${(e as Error).message} (لازم تكون مسجّل دخول)`, err: true });
    }
  }

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <main dir="rtl" className="mx-auto max-w-5xl space-y-4 p-4">
      <UnifiedWorkspaceNav />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">شبكة الـ30 نموذج</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/">الرئيسية</Link></Button>
          <Button variant="outline" size="sm" onClick={() => { if (confirm("مسح المحادثة المشتركة؟")) { ref.current = []; setThread([]); localStorage.removeItem(KEY); if (uid) void supabase.from("network_messages").delete().eq("user_id", uid).then(() => undefined); } }}>مسح</Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        التشغيل الافتراضي Cloudflare-first لتقليل الاعتماد على مزود واحد، مع fallback تلقائي عند فشل نموذج. كلهم يشوفوا نفس المحادثة والذاكرة المصرح بها. اكتب طلبك الطبيعي أو استدعِ AbanoupAi صوتيًا. 🌐 = نموذج متصفح.
      </p>

      {phone && <section className="rounded-lg border bg-card p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span><b>هاتف Oppo:</b> {phone.status === "online" ? "متصل" : "غير متصل"} · {phone.last_seen_at ? new Date(phone.last_seen_at).toLocaleTimeString("ar-EG") : "لا يوجد اتصال سابق"}</span>
          <Link to="/companion" className="text-primary underline">تفاصيل التحكم</Link>
        </div>
        {pendingPhone.length > 0 && <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">أوامر هاتف تنتظر موافقتك:</p>
          {pendingPhone.map((cmd) => <div key={cmd.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2">
            <span dir="ltr" className="text-xs">{cmd.kind} {cmd.payload?.url ?? cmd.payload?.package ?? cmd.payload?.text ?? ""}</span>
            <span className="flex gap-1"><Button size="sm" onClick={() => void approvePhone(cmd.id, true)}>موافقة</Button><Button size="sm" variant="outline" onClick={() => void approvePhone(cmd.id, false)}>رفض</Button></span>
          </div>)}
        </div>}
      </section>}

      <section className="flex flex-wrap gap-2">
        <button onClick={() => toggle(MANAGER_ID)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${picked.includes(MANAGER_ID) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
          {MANAGER_LABEL}
        </button>
        {NET_MODELS.map((m) => (
          <button key={m.id} onClick={() => toggle(m.id)}
            className={`rounded-full border px-3 py-1 text-xs ${picked.includes(m.id) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
            {m.browser ? "🌐 " : m.provider === "cloudflare" ? "☁️ " : ""}{m.label}
          </button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setPicked([MANAGER_ID, ...NET_MODELS.map((m) => m.id)])}>الكل</Button>
        <Button size="sm" variant="ghost" onClick={() => setPicked([])}>ولا واحد</Button>
      </section>

      {uid === null && (
        <section className="rounded-lg border bg-card p-4 text-sm">
          لازم تسجّل دخول عشان الـ30 نموذج يشتغلوا على حسابك وتتحفظ المحادثة عندك.{" "}
          <Link to="/auth" className="font-semibold text-primary underline">تسجيل الدخول</Link>
        </section>
      )}
      <section className="space-y-3 rounded-lg border bg-card p-3">
        {thread.length === 0 && <p className="text-sm text-muted-foreground">ابدأ برسالة. مثال: "افتحوا https://example.com وقولولي فيها إيه، وكل واحد يعلّق على رد اللي قبله".</p>}
        {thread.map((e) => (
          <div key={e.id} className={`rounded-md p-3 text-sm ${e.who === "me" ? "bg-primary/10" : e.err ? "bg-destructive/10" : "bg-muted"}`}>
            <p className="mb-1 text-xs font-semibold text-primary">{e.who === "me" ? "أنت" : netLabel(e.who)}</p>
            <p className="whitespace-pre-wrap">{e.text}</p>
            {e.tools?.map((t, i) => (
              <div key={i} className="mt-2 rounded border bg-background p-2 text-xs">
                <p className="font-semibold">{t.tool} {t.ok ? "" : "❌"}</p>
                {t.text.startsWith("MERGE_REQUEST:") ? (
                  <Button size="sm" className="mt-1" onClick={() => doMerge(t.text.slice(14))}>وافق على الدمج</Button>
                ) : (
                  <p className="whitespace-pre-wrap">{t.text.slice(0, 1500)}</p>
                )}
                {t.link && <a href={t.link} target="_blank" rel="noreferrer" className="text-primary underline">فتح</a>}
                {t.shot && <img src={t.shot} alt="لقطة من المتصفح" className="mt-1 max-h-72 rounded border" />}
              </div>
            ))}
          </div>
        ))}
        {busy && <p className="text-sm text-muted-foreground">⏳ {busy} بيكتب…</p>}
      </section>

      <div className="space-y-2">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="اكتب رسالتك للنماذج…" rows={3} />
        <div className="flex flex-wrap gap-2">
          <Button onClick={send} disabled={!!busy || picked.length === 0}>ابعت ({picked.length})</Button>
          <Button variant={voiceOn ? "destructive" : "outline"} onClick={toggleVoice}>{voiceOn ? "إيقاف استدعاء AbanoupAi" : "استدعاء AbanoupAi صوتيًا"}</Button>
          <Button variant="outline" disabled={!!busy || thread.length === 0 || picked.length === 0} onClick={() => round(picked)}>خليهم يردوا على بعض</Button>
          {busy && <Button variant="destructive" onClick={() => (stop.current = true)}>إيقاف</Button>}
          {REPOS.map((r) => (
            <Button key={r} variant="secondary" size="sm" onClick={() => doMerge(r)}>دمج {r.split("/")[1]}</Button>
          ))}
        </div>
      </div>
    </main>
  );
}
