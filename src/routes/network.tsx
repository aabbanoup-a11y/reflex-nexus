import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { networkTurn, type ToolEvent } from "@/lib/network.functions";
import { MANAGER_ID, MANAGER_LABEL, isLocal, netLabel } from "@/lib/models30";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/runtime-client";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "شبكة الـ51 نموذج | Abanoup" },
      { name: "description", content: "50 نموذجًا ومدير في محادثة واحدة: يفهموا الطلب، يستخدموا الهاتف والمتصفح، ويعدّلوا مستودعات GitHub." },
      { property: "og:title", content: "شبكة الـ51 نموذج | Abanoup" },
      { property: "og:description", content: "محادثة مشتركة، متصفح سحابي، وتعديل GitHub في فرع تجريبي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Network,
});

type Entry = { id: string; who: string; text: string; tools?: ToolEvent[]; err?: boolean };
type PhoneDevice = { id: string; device_name: string; status: string; last_seen_at: string | null };
const KEY = "network-thread-v1";
type SpeechCtor = new () => { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: any) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
declare global { interface Window { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor; AbanoubAI?: { savePairing?: (deviceId: string, accessToken: string) => void; startVoiceRecognition?: () => void; stopVoiceRecognition?: () => void }; __abanoupaiVoiceResult?: (text: string) => void; __abanoupaiVoiceError?: (text: string) => void } }

export function Network() {
  const turn = useServerFn(networkTurn);
  const [thread, setThread] = useState<Entry[]>([]);
  const picked = [MANAGER_ID];
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

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUid(id);
      if (!id) return;
      const loadPhone = async () => {
        const [{ data: device }] = await Promise.all([
          supabase.from("companion_devices").select("id,device_name,status,last_seen_at").eq("user_id", id).eq("platform", "android").order("last_seen_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
        ]);
        setPhone(device as PhoneDevice | null);
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

  return (
    <main dir="rtl" className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><p className="text-sm font-semibold text-primary">AbanoupAi</p><h1 className="text-2xl font-bold">شات AbanoupAi</h1></div>
        <Button variant="outline" size="sm" onClick={() => { if (confirm("مسح المحادثة؟")) { ref.current = []; setThread([]); localStorage.removeItem(KEY); if (uid) void supabase.from("network_messages").delete().eq("user_id", uid).then(() => undefined); } }}>مسح المحادثة</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        اكتب طلبك بشكل طبيعي. AbanoupAi يفهم الطلب، يستخدم النماذج المتاحة، وينفذ أوامر الهاتف والمتصفح وGitHub وSupabase وCloudflare عند الحاجة.
      </p>

      {phone && <section className="rounded-lg border bg-card p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span><b>هاتف Oppo:</b> {phone.status === "online" ? "متصل" : "غير متصل"} · {phone.last_seen_at ? new Date(phone.last_seen_at).toLocaleTimeString("ar-EG") : "لا يوجد اتصال سابق"}</span>
          <Link to="/companion" className="text-primary underline">تفاصيل التحكم</Link>
        </div>
      </section>}

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
                <p className="whitespace-pre-wrap">{t.text.slice(0, 1500)}</p>
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
          {busy && <Button variant="destructive" onClick={() => (stop.current = true)}>إيقاف</Button>}
        </div>
      </div>
    </main>
  );
}
