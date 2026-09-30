import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { networkTurn, mergeRepo, type ToolEvent } from "@/lib/network.functions";
import { NET_MODELS, netLabel, REPOS, WORK_BRANCH } from "@/lib/models30";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/runtime-client";

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
const KEY = "network-thread-v1";

function Network() {
  const turn = useServerFn(networkTurn);
  const merge = useServerFn(mergeRepo);
  const [thread, setThread] = useState<Entry[]>([]);
  const [picked, setPicked] = useState<string[]>([NET_MODELS[0]!.id, "google/gemini-3.8-flash", NET_MODELS[6]!.id]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState("");
  const stop = useRef(false);
  const ref = useRef<Entry[]>([]);

  const [uid, setUid] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUid(id);
      if (!id) return;
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
    })();
  }, []);

  const push = (e: Entry) => {
    ref.current = [...ref.current, e];
    setThread(ref.current);
    if (uid) {
      const tools = (e.tools ?? []).map(({ shot: _s, ...t }) => t);
      void supabase.from("network_messages").insert({ user_id: uid, who: e.who, content: e.text.slice(0, 50000), tools: tools as never, is_error: !!e.err }).then(({ error }) => { if (error) console.error("save failed", error.message); });
    }
  };

  async function round(models: string[]) {
    stop.current = false;
    for (const m of models) {
      if (stop.current) break;
      setBusy(netLabel(m));
      try {
        const r = await turn({ data: { model: m, thread: ref.current.map((e) => ({ who: e.who === "me" ? "me" : netLabel(e.who), text: e.text + (e.tools?.length ? "\n" + e.tools.map((t) => `${t.tool}: ${t.text.slice(0, 1500)}`).join("\n") : "") })) } });
        push({ id: crypto.randomUUID(), who: m, text: r.usedModel !== m ? `${r.text}\n(اتحوّل لـ ${netLabel(r.usedModel)} عشان الأصلي فشل)` : r.text, tools: r.tools });
      } catch (e) {
        push({ id: crypto.randomUUID(), who: m, text: (e as Error).message, err: true });
      }
    }
    setBusy("");
  }

  async function send() {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    push({ id: crypto.randomUUID(), who: "me", text: t });
    await round(picked);
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">شبكة الـ30 نموذج</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/">الرئيسية</Link></Button>
          <Button variant="outline" size="sm" onClick={() => { if (confirm("مسح المحادثة المشتركة؟")) { ref.current = []; setThread([]); localStorage.removeItem(KEY); if (uid) void supabase.from("network_messages").delete().eq("user_id", uid).then(() => undefined); } }}>مسح</Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        اختار النماذج اللي ترد. كلهم شايفين نفس المحادثة. 12 نموذج بيشتغلوا على Cloudflare بتاعك، و18 من Lovable AI. 🌐 = نموذج متصفح.
      </p>

      <section className="flex flex-wrap gap-2">
        {NET_MODELS.map((m) => (
          <button key={m.id} onClick={() => toggle(m.id)}
            className={`rounded-full border px-3 py-1 text-xs ${picked.includes(m.id) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
            {m.browser ? "🌐 " : m.provider === "cloudflare" ? "☁️ " : ""}{m.label}
          </button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setPicked(NET_MODELS.map((m) => m.id))}>الكل</Button>
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
