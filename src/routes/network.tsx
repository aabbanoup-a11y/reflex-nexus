import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { networkTurn, type ToolEvent } from "@/lib/network.functions";
import { askAssistant } from "@/lib/chat.functions";
import { MANAGER_ID, MANAGER_LABEL, NET_MODELS, isLocal, netLabel } from "@/lib/models30";
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

type AttachmentView = { name: string; type: string; size: number };
type Entry = { id: string; who: string; text: string; tools?: ToolEvent[]; err?: boolean; attachments?: AttachmentView[] };
type PhoneDevice = { id: string; device_name: string; status: string; last_seen_at: string | null };
const KEY = "network-thread-v1";
type SpeechCtor = new () => { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: any) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
declare global { interface Window { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor; AbanoubAI?: { savePairing?: (deviceId: string, accessToken: string) => void; startVoiceRecognition?: () => void; stopVoiceRecognition?: () => void }; __abanoupaiVoiceResult?: (text: string) => void; __abanoupaiVoiceError?: (text: string) => void } }

export function Network() {
  const turn = useServerFn(networkTurn);
  const askWithFiles = useServerFn(askAssistant);
  const [thread, setThread] = useState<Entry[]>([]);
  const [chatMode, setChatMode] = useState<"manager" | "all">("manager");
  const picked = chatMode === "all" ? [MANAGER_ID, ...NET_MODELS.map((m) => m.id)] : [MANAGER_ID];
  const [input, setInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
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
    const effective = chatMode === "all" ? models : networkMode === "economic" ? models.slice(0, 1) : models.slice(0, 3);
    if (chatMode === "all") {
      const opinions: string[] = [];
      for (const m of effective) {
        if (stop.current) break;
        setBusy(`رأي ${netLabel(m)}`);
        try {
          if (isLocal(m)) {
            const { runLocal } = await import("@/lib/local-llm");
            opinions.push(`${netLabel(m)}: ${await runLocal(m, "حلل الطلب كرأي داخلي مختصر، لا تصدر أوامر.", ref.current.map((e) => ({ who: e.who, text: e.text })), () => undefined)}`);
          } else {
            const r = await turn({ data: { model: m, mode: "opinion", thread: ref.current.map((e) => ({ who: e.who === "me" ? "me" : netLabel(e.who), text: e.text.slice(0, 6000) })) } });
            opinions.push(`${netLabel(m)}: ${r.text}`);
          }
        } catch (e) { opinions.push(`${netLabel(m)}: تعذر الرأي (${(e as Error).message})`); }
      }
      setBusy("تجميع الآراء وتنفيذ المطلوب مرة واحدة");
      try {
        const request = ref.current[ref.current.length - 1]?.text ?? "";
        const synthesis = await askWithFiles({ data: { system: "إنت AbanoupAi — المجمّع النهائي. اجمع آراء النماذج في رسالة عربية مصرية واحدة بسيطة ومفيدة، بدون تكرار أسماء النماذج أو عرض رسائل منفصلة. لو المهمة دراسية قدم إجابة منظمة. لا تصدر أوامر هاتف أو GitHub في هذا الرد.", messages: [{ role: "user", content: `الطلب: ${request}\n\nآراء داخلية:\n${opinions.join("\n\n").slice(0, 60000)}` }], model: "google/gemini-3.1-pro-preview", fallbacks: ["anthropic/claude-opus-5-5", "openai/gpt-5.5-pro"], attachments: [], memories: [] } });
        let unified = synthesis.text;
        let tools: ToolEvent[] = [];
        if (/(افتح|شغل|نفذ|نزّل|نزل|تحميل|عدّل|عدل|اكتب|اضغط|انشر|اقرأ|حلل|ابحث|افحص|نفّذ)/i.test(request)) {
          const execution = await turn({ data: { model: MANAGER_ID, mode: "execute", thread: [...ref.current.map((e) => ({ who: e.who === "me" ? "me" : netLabel(e.who), text: e.text })), { who: "الفريق", text: synthesis.text }, { who: "me", text: request }] } });
          unified += `\n\nنتيجة التنفيذ: ${execution.text}`;
          tools = execution.tools;
        }
        push({ id: crypto.randomUUID(), who: "الفريق الموحد", text: unified, tools });
      } catch (e) { push({ id: crypto.randomUUID(), who: MANAGER_ID, text: (e as Error).message, err: true }); }
      setBusy("");
      return;
    }
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
        const r = await turn({ data: { model: m, mode: "execute", thread: ref.current.map((e) => ({ who: e.who === "me" ? "me" : netLabel(e.who), text: e.text + (e.tools?.length ? "\n" + e.tools.map((t) => `${t.tool}: ${t.text.slice(0, 1500)}`).join("\n") : "") })) } });
        push({ id: crypto.randomUUID(), who: m, text: r.usedModel !== m ? `${r.text}\n(اتحوّل لـ ${netLabel(r.usedModel)} عشان الأصلي فشل)` : r.text, tools: r.tools });
      } catch (e) {
        push({ id: crypto.randomUUID(), who: m, text: (e as Error).message, err: true });
      }
    }
    setBusy("");
  }

  async function sendWithFiles(value: string, files: File[]) {
    const t = value.trim() || "حلل المرفقات دي واذكر محتواها وأهم النتائج بالتفصيل.";
    if (!uid) { push({ id: crypto.randomUUID(), who: MANAGER_ID, text: "لازم تسجل دخول قبل رفع الملفات.", err: true }); return; }
    setInput("");
    setPendingFiles([]);
    const views = files.map((f) => ({ name: f.name, type: f.type, size: f.size }));
    push({ id: crypto.randomUUID(), who: "me", text: t, attachments: views });
    setBusy("رفع وتحليل المرفقات");
    try {
      const uploaded: { path: string; mime: string; name: string }[] = [];
      for (const file of files.slice(0, 10)) {
        const safe = file.name.replace(/[^\w.\-ء-ي]+/g, "_").slice(0, 100);
        const path = `u/${uid}/${crypto.randomUUID()}-${safe}`;
        const { error } = await supabase.storage.from("chat-uploads").upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
        if (error) throw new Error(`رفع ${file.name} فشل: ${error.message}`);
        uploaded.push({ path, mime: file.type || "application/octet-stream", name: file.name });
      }
      const history = ref.current.slice(-20).map((e) => ({ role: (e.who === "me" ? "user" : "assistant") as "user" | "assistant", content: e.text.slice(0, 8000) }));
      const r = await askWithFiles({ data: { system: "إنت AbanoupAi محلل ملفات ومساعد مذاكرة. افهم الصور والفيديوهات والمستندات، رد بالعربية المصرية، ولو الملف متعلق بالثانوية العامة اشرحه كمدرس متخصص مع أمثلة وأسئلة مراجعة.", messages: [...history, { role: "user", content: t }], model: "openai/chat-latest", fallbacks: ["google/gemini-3.8-flash", "anthropic/claude-sonnet-5"], attachments: uploaded, memories: [] } });
      push({ id: crypto.randomUUID(), who: r.model, text: r.text });
    } catch (e) {
      push({ id: crypto.randomUUID(), who: MANAGER_ID, text: (e as Error).message, err: true });
    } finally { setBusy(""); }
  }

  async function sendText(value: string, files: File[] = pendingFiles) {
    if (files.length) { await sendWithFiles(value, files); return; }
    const fileContext = files.length ? `\n\n[مرفقات المستخدم]\n${(await Promise.all(files.map(async (file) => {
      const meta = `${file.name} — ${file.type || "نوع غير معروف"} — ${Math.ceil(file.size / 1024)}KB`;
      if (file.size <= 20000 && (file.type.startsWith("text/") || /\.(txt|csv|md|json|xml)$/i.test(file.name))) {
        return `${meta}\nمحتوى الملف:\n${(await file.text()).slice(0, 18000)}`;
      }
      return meta;
    }))).join("\n\n")}` : "";
    const t = `${value.trim()}${fileContext}`.trim();
    if (!t || busy) return;
    setInput("");
    setPendingFiles([]);
    push({ id: crypto.randomUUID(), who: "me", text: t, attachments: files.map((f) => ({ name: f.name, type: f.type, size: f.size })) });
    await round(picked);
  }
  async function send() { await sendText(input, pendingFiles); }

  function studyPrompt(kind: string) {
    const prompts: Record<string, string> = {
      explain: "اشرحلي الدرس ده كمدرس ثانوية عامة، ببساطة وبأمثلة وأسئلة متوقعة: ",
      solve: "حل السؤال ده خطوة خطوة وراجع الإجابة كمدرس ثانوية عامة: ",
      quiz: "اعمل لي اختبار ثانوية عامة من 10 أسئلة في الموضوع ده، وبعد إجابتي صححلي: ",
      summary: "لخص الملف أو الدرس ده للمراجعة النهائية مع أهم القوانين والنقاط: ",
      plan: "اعمل لي خطة مذاكرة أسبوعية للثانوية العامة حسب المواد والوقت المتاح: ",
    };
    setInput(prompts[kind] ?? "");
  }

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
        شات واحد مع AbanoupAi أو مع كل النماذج. ارفع أي ملف، واطلب تنفيذ مهمة أو شرحًا أو مذاكرة؛ والردود والنتائج تظهر في نفس المحادثة.
      </p>

      <section className="rounded-lg border bg-card p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">وضع المحادثة:</span>
          <Button size="sm" variant={chatMode === "manager" ? "default" : "outline"} onClick={() => setChatMode("manager")}>AbanoupAi فقط</Button>
          <Button size="sm" variant={chatMode === "all" ? "default" : "outline"} onClick={() => setChatMode("all")}>اسأل الكل ({NET_MODELS.length + 1})</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-semibold">أدوات الثانوية العامة:</span>
          {([["explain", "شرح درس"], ["solve", "حل سؤال"], ["quiz", "اختبار"], ["summary", "ملخص"], ["plan", "خطة مذاكرة"]] as [string, string][]).map(([key, label]) => <Button key={key} size="sm" variant="outline" onClick={() => studyPrompt(key)}>{label}</Button>)}
        </div>
      </section>

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
            {e.attachments?.length ? <div className="mt-2 flex flex-wrap gap-2">{e.attachments.map((a) => <span key={a.name} className="rounded border bg-background px-2 py-1 text-xs">مرفق: {a.name}</span>)}</div> : null}
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
          <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm hover:bg-muted">
            إرفاق صورة/فيديو/مستند
            <input type="file" multiple className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.md,.json" onChange={(e) => setPendingFiles((old) => [...old, ...Array.from(e.target.files ?? [])])} />
          </label>
          <Button onClick={send} disabled={!!busy || picked.length === 0}>ابعت ({picked.length})</Button>
          <Button variant={voiceOn ? "destructive" : "outline"} onClick={toggleVoice}>{voiceOn ? "إيقاف استدعاء AbanoupAi" : "استدعاء AbanoupAi صوتيًا"}</Button>
          {busy && <Button variant="destructive" onClick={() => (stop.current = true)}>إيقاف</Button>}
        </div>
        {pendingFiles.length > 0 && <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">{pendingFiles.map((f) => <span key={`${f.name}-${f.size}`} className="rounded border px-2 py-1">{f.name} <button type="button" className="mr-1 text-destructive" onClick={() => setPendingFiles((old) => old.filter((x) => x !== f))}>×</button></span>)}</div>}
      </div>
    </main>
  );
}
