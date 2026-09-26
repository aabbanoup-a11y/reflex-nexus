import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Send, Users2, Sparkles, ArrowRight, Trash2, Paperclip, X, FileText, Brain } from "lucide-react";
import { askAssistant } from "@/lib/chat.functions";
import { getMemoryState, saveMemory, suggestMemories } from "@/lib/memory.functions";
import { logRun, notifyDone, requestNotifyPermission } from "@/lib/activity";
import { hasCrisisSignal, EMERGENCY_CONTACTS } from "@/lib/safety";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ASSISTANTS, MODELS, QUICK_LINKS, chainFor, getAssistant, type AssistantKey } from "@/lib/assistants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BreathingExercise } from "@/components/BreathingExercise";

export const Route = createFileRoute("/assistant")({
  component: AssistantPage,
  head: () => ({
    meta: [
      { title: "فريق المساعدين الأذكياء — دراسة وكاراتيه وصحة" },
      { name: "description", content: "سبعة مساعدين ذكاء اصطناعي مع رفع صور وفيديوهات وملفات، ذاكرة شخصية بموافقتك، ومساعد للمزاج والراحة." },
      { property: "og:title", content: "فريق المساعدين الأذكياء" },
      { property: "og:description", content: "مساعدين للدراسة والكاراتيه والصحة يفهموا الصور والفيديوهات والملفات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Att = { path: string; mime: string; name: string; preview?: string };
type Msg = { role: "user" | "assistant"; content: string; author?: string; model?: string; atts?: Att[] };
type Suggestion = { category: "preference" | "trait" | "goal" | "habit"; content: string; pick: boolean };

function AssistantPage() {
  const [active, setActive] = useState<AssistantKey>("manager");
  const [model, setModel] = useState<string>("auto");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [teamMode, setTeamMode] = useState(false);
  const [threads, setThreads] = useState<Record<string, Msg[]>>({});
  const [pending, setPending] = useState<Att[]>([]);
  const [crisis, setCrisis] = useState(false);
  const [memories, setMemories] = useState<string[]>([]);
  const [memOn, setMemOn] = useState<{ consent: boolean; enabled: boolean } | null>(null);
  const [suggest, setSuggest] = useState<Suggestion[] | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const ask = useServerFn(askAssistant);
  const getMem = useServerFn(getMemoryState);
  const saveMem = useServerFn(saveMemory);
  const suggestMem = useServerFn(suggestMemories);
  const assistant = getAssistant(active);
  const key = teamMode ? "team" : active;
  const messages = threads[key] ?? [];

  useEffect(() => {
    if (!user) return setMemOn(null);
    getMem()
      .then((s) => {
        setMemOn({ consent: s.consent, enabled: s.enabled });
        setMemories(s.enabled ? s.memories.map((m) => m.content) : []);
      })
      .catch(() => setMemOn(null));
  }, [user, getMem]);

  const push = (k: string, msg: Msg) => setThreads((t) => ({ ...t, [k]: [...(t[k] ?? []), msg] }));
  const modelFor = (a: { model: string }) => (model === "auto" ? a.model : model);
  const scroll = () => requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    for (const f of Array.from(files)) {
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name} أكبر من 50 ميجا`);
        continue;
      }
      const ext = f.name.split(".").pop() || "bin";
      const path = `u/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("chat-uploads").upload(path, f, { contentType: f.type || "application/octet-stream" });
      if (error) {
        toast.error(`فشل رفع ${f.name}`);
        continue;
      }
      const preview = f.type.startsWith("image/") || f.type.startsWith("video/") ? URL.createObjectURL(f) : undefined;
      setPending((p) => [...p, { path, mime: f.type || "application/octet-stream", name: f.name, preview }]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const runOne = async (
    a: ReturnType<typeof getAssistant>,
    thread: string,
    msgs: { role: "user" | "assistant"; content: string }[],
    prompt: string,
    atts: Att[] = [],
  ) => {
    const m = modelFor(a);
    try {
      const reply = await ask({
        data: { system: a.system, model: m, fallbacks: chainFor(m), messages: msgs, attachments: atts.map(({ path, mime, name }) => ({ path, mime, name })), memories },
      });
      if (reply.crisis) {
        setCrisis(true);
        return null;
      }
      push(thread, { role: "assistant", content: reply.text, author: `${a.emoji} ${a.name}`, model: reply.model });
      notifyDone(`${a.emoji} ${a.name} خلّص المهمة`, reply.text);
      void logRun({ agent_kind: thread === "team" ? "team" : "assistant", agent_key: a.key, agent_name: a.name, model: reply.model, prompt, reply: reply.text, status: "done" });
      scroll();
      return reply;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حصل خطأ";
      push(thread, { role: "assistant", content: `⚠️ ${msg}`, author: `${a.emoji} ${a.name}` });
      notifyDone(`${a.name} ما قدرش يكمّل`, msg, false);
      void logRun({ agent_kind: thread === "team" ? "team" : "assistant", agent_key: a.key, agent_name: a.name, model: m, prompt, reply: msg, status: "error" });
      scroll();
      return null;
    }
  };

  const send = async (text: string) => {
    const q = text.trim() || (pending.length ? "اشرحلي الملفات دي" : "");
    if (!q || loading || uploading) return;
    // فحص الأمان قبل أي أتمتة.
    if (hasCrisisSignal(q)) {
      setCrisis(true);
      return;
    }
    requestNotifyPermission();
    const atts = pending;
    setPending([]);
    setInput("");
    push(key, { role: "user", content: q, atts });
    setLoading(true);

    try {
      if (teamMode) {
        const manager = getAssistant("manager");
        const history = (threads["team"] ?? []).slice(-4).map(strip);
        const plan = await runOne(manager, "team", [...history, { role: "user", content: q }], q, atts);
        if (!plan) return;
        const crew = ASSISTANTS.filter((a) => a.key !== "manager");
        const results = await Promise.all(
          crew.map((a) =>
            runOne(a, "team", [{ role: "user", content: `طلب المستخدم: ${q}\n\nخطة المدير:\n${plan.text}\n\nنفّذ الجزء الخاص بتخصصك فقط في 5 نقاط عملية قصيرة.` }], q, atts),
          ),
        );
        const shared = crew
          .map((a, i) => (results[i] ? `${a.name}:\n${results[i]!.text}` : ""))
          .filter(Boolean)
          .join("\n\n");
        if (shared) {
          await runOne(
            { ...manager, name: "المدير — الخلاصة النهائية" },
            "team",
            [{ role: "user", content: `طلب المستخدم: ${q}\n\nنتايج الفريق:\n${shared}\n\nاجمع النتايج في خطة نهائية واحدة مترتبة بجدول زمني، واحذف التكرار.` }],
            q,
          );
        }
        notifyDone("الفريق خلّص كل المهام", q);
      } else {
        const history = (threads[key] ?? []).slice(-6).map(strip);
        await runOne(assistant, key, [...history, { role: "user", content: q }], q, atts);
      }
    } finally {
      setLoading(false);
      scroll();
    }
  };

  const openSuggestions = async () => {
    const text = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n").slice(0, 8000);
    if (!text) return toast.info("اكتب شوية في المحادثة الأول");
    try {
      const items = await suggestMem({ data: { text } });
      if (!items.length) return toast.info("مفيش حاجة واضحة أفتكرها");
      setSuggest(items.map((i) => ({ ...i, pick: true })));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ");
    }
  };

  const approveSuggestions = async () => {
    const picked = (suggest ?? []).filter((s) => s.pick);
    for (const s of picked) await saveMem({ data: { id: null, category: s.category, content: s.content } });
    setMemories((m) => [...picked.map((p) => p.content), ...m]);
    setSuggest(null);
    toast.success(`اتحفظ ${picked.length}`);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge className="mb-2">صور وفيديو وملفات + ذاكرة + بدائل تلقائية</Badge>
              <h1 className="text-2xl font-bold sm:text-3xl">فريق المساعدين الأذكياء</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><Link to="/">الموظفين <ArrowRight className="size-4" /></Link></Button>
              <Button asChild variant="outline" size="sm"><Link to="/history">السجل</Link></Button>
              <Button asChild variant="outline" size="sm">
                {user ? <Link to="/memory"><Brain className="size-4" /> ذاكرتي</Link> : <Link to="/auth"><Brain className="size-4" /> فعّل الذاكرة</Link>}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant={model === "auto" ? "default" : "outline"} onClick={() => setModel("auto")}>تلقائي: نموذج لكل مساعد</Button>
            {MODELS.map((m) => (
              <Button key={m.id} size="sm" variant={model === m.id ? "default" : "outline"} onClick={() => setModel(m.id)} title={m.note}>{m.label}</Button>
            ))}
          </div>
          {memOn?.enabled && <p className="mt-2 text-xs text-muted-foreground">🧠 الذاكرة شغّالة ({memories.length})</p>}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={teamMode ? "default" : "outline"} onClick={() => setTeamMode(true)}><Users2 className="size-4" /> وضع الفريق</Button>
          {ASSISTANTS.map((a) => (
            <Button key={a.key} size="sm" variant={!teamMode && active === a.key ? "default" : "outline"} onClick={() => { setTeamMode(false); setActive(a.key); }}>
              <span>{a.emoji}</span>{a.name}
            </Button>
          ))}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {teamMode ? "المدير يقسّم طلبك، كل مساعد ينفّذ جزءه بالتوازي، وبعدين المدير يجمع النتايج في خطة واحدة." : assistant.tagline}
        </p>

        {!teamMode && active === "wellness" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <BreathingExercise />
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">🌿 متابعة المزاج</p>
              <p className="mt-2 text-muted-foreground">سجّل مزاجك كل يوم وشوف التحسن برسم بسيط، من غير ضغط.</p>
              <Button asChild size="sm" className="mt-3">{user ? <Link to="/memory">افتح المتابعة</Link> : <Link to="/auth">سجّل دخول للمتابعة</Link>}</Button>
              <p className="mt-3 text-xs text-muted-foreground">ده دعم عام مش تشخيص ولا علاج. لو محتاج مساعدة عاجلة كلّم 123.</p>
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-primary" /> جرّب تبدأ بـ</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(teamMode ? ["اعملي خطة أطلع الأول في الدراسة والكاراتيه", "نظّم أسبوعي بالكامل"] : assistant.starters).map((s) => (
                <Button key={s} size="sm" variant="secondary" onClick={() => send(s)}>{s}</Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">📎 تقدر ترفع صور، فيديوهات، PDF، أو صوت — لحد 50 ميجا للملف وعدد مفتوح.</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "ms-auto max-w-[85%] rounded-xl bg-primary px-4 py-3 text-primary-foreground" : "max-w-[92%] rounded-xl border border-border bg-card px-4 py-3"}>
              {m.author && <p className="mb-1 text-xs font-semibold text-primary">{m.author}{m.model ? ` · ${m.model}` : ""}</p>}
              {m.atts && m.atts.length > 0 && <AttList atts={m.atts} />}
              <p className="whitespace-pre-wrap text-sm leading-7">{m.content}</p>
            </div>
          ))}
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> بيشتغل على طلبك...</div>}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-0 mt-6 bg-background/95 py-3">
          {pending.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pending.map((a) => (
                <div key={a.path} className="relative">
                  <AttList atts={[a]} />
                  <button aria-label="إزالة" className="absolute -top-2 -start-2 rounded-full bg-destructive p-0.5 text-destructive-foreground" onClick={() => setPending((p) => p.filter((x) => x.path !== a.path))}>
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input ref={fileRef} type="file" multiple hidden accept="image/*,video/*,audio/*,application/pdf,text/plain" onChange={(e) => upload(e.target.files)} />
            <Button variant="outline" aria-label="إرفاق ملفات" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
            </Button>
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="اكتب طلبك أو ارفع ملف..." />
            <Button onClick={() => send(input)} disabled={loading || uploading} aria-label="إرسال">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
            {messages.length > 0 && (
              <Button variant="outline" onClick={() => setThreads((t) => ({ ...t, [key]: [] }))} aria-label="مسح المحادثة"><Trash2 className="size-4" /></Button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {memOn?.enabled && messages.length > 0 && (
              <button onClick={openSuggestions} className="rounded-full border border-primary px-3 py-1 text-xs text-primary">🧠 اقترح حاجات أفتكرها</button>
            )}
            {QUICK_LINKS.map((l) => (
              <a key={l.label} href={l.url(input.trim() || "منهج أولى ثانوي")} target="_blank" rel="noreferrer" className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                {l.emoji} {l.label}
              </a>
            ))}
          </div>
        </div>
      </main>

      <Dialog open={crisis} onOpenChange={() => {}}>
        <DialogContent dir="rtl" className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle>إنت مهم، ومش لوحدك 💚</DialogTitle>
            <DialogDescription>
              اللي كتبته بيقول إنك ممكن تكون بتمر بوقت صعب جداً. وقفت كل المساعدين عشان الأهم دلوقتي هو سلامتك. كلّم حد تثق فيه دلوقتي (أهلك، صاحب، مدرس)، أو اتصل بالطوارئ:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <a key={c.number} href={`tel:${c.number}`} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>{c.label}</span><span className="font-bold">{c.number}</span>
              </a>
            ))}
          </div>
          <Button onClick={() => { setCrisis(false); toast.success("خلّي بالك من نفسك. أنا هنا لو احتجت تتكلم."); }}>
            أنا بأمان دلوقتي وكلّمت حد أثق فيه
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!suggest} onOpenChange={(o) => !o && setSuggest(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تحب أفتكر الحاجات دي؟</DialogTitle>
            <DialogDescription>مش هيتحفظ غير اللي تختاره، وتقدر تمسحه بعدين من "ذاكرتي".</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {suggest?.map((s, i) => (
              <label key={i} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                <Checkbox checked={s.pick} onCheckedChange={(v) => setSuggest((arr) => arr!.map((x, j) => (j === i ? { ...x, pick: !!v } : x)))} />
                {s.content}
              </label>
            ))}
          </div>
          <Button onClick={approveSuggestions}>احفظ المختار</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttList({ atts }: { atts: Att[] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {atts.map((a) =>
        a.preview && a.mime.startsWith("image/") ? (
          <img key={a.path} src={a.preview} alt={a.name} className="size-20 rounded-md object-cover" />
        ) : a.preview && a.mime.startsWith("video/") ? (
          <video key={a.path} src={a.preview} className="h-20 rounded-md" muted />
        ) : (
          <span key={a.path} className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground">
            <FileText className="size-3" /> {a.name}
          </span>
        ),
      )}
    </div>
  );
}

function strip(m: Msg) {
  return { role: m.role, content: m.content };
}
