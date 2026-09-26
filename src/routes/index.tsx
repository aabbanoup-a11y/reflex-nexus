import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { planRun, runStep, type AgentStep } from "@/lib/agent.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "وكيل المتصفح السحابي | Abanoup" },
      { name: "description", content: "وكيل ذكي يفتح المواقع في متصفح سحابي، يخطط، يصوّر الشاشة، ويطلب موافقتك قبل أي خطوة حساسة." },
      { property: "og:title", content: "وكيل المتصفح السحابي | Abanoup" },
      { property: "og:description", content: "خطة تنفيذ، لقطات شاشة، سجل حي، موافقة، وزر إيقاف." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Agent,
});

type Log = { t: string; msg: string; kind: "info" | "ok" | "warn" | "err" };
type Status = "idle" | "planning" | "ready" | "running" | "awaiting" | "done" | "stopped";

function Agent() {
  const plan = useServerFn(planRun);
  const step = useServerFn(runStep);
  const [url, setUrl] = useState("https://example.com");
  const [goal, setGoal] = useState("افتح رابط Learn more واقرأ عنوان الصفحة الجديدة");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [summary, setSummary] = useState("");
  const [done, setDone] = useState(0);
  const [shots, setShots] = useState<{ img: string; caption: string }[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const stopRef = useRef(false);

  const log = (msg: string, kind: Log["kind"] = "info") =>
    setLogs((l) => [...l, { t: new Date().toLocaleTimeString(), msg, kind }]);

  async function makePlan() {
    stopRef.current = false;
    setStatus("planning");
    setSteps([]); setShots([]); setLogs([]); setDone(0);
    log(`فتح ${url} في متصفح Cloudflare السحابي…`);
    try {
      const r = await plan({ data: { url, goal } });
      if (stopRef.current) return;
      setShots([{ img: r.screenshot, caption: "الصفحة الأولى" }]);
      setSteps(r.steps); setSummary(r.summary);
      log(`تمت قراءة الشاشة وإعداد خطة من ${r.steps.length} خطوات`, "ok");
      setStatus("ready");
    } catch (e) {
      log((e as Error).message, "err"); setStatus("idle");
    }
  }

  async function execute(from: number, approved = false) {
    setStatus("running");
    for (let i = from; i < steps.length; i++) {
      if (stopRef.current) { log("تم الإيقاف بواسطتك", "warn"); setStatus("stopped"); return; }
      const s = steps[i]!;
      if (s.sensitive && !(approved && i === from)) {
        log(`الخطوة ${i + 1} حساسة: "${s.title}" — في انتظار موافقتك`, "warn");
        setDone(i); setStatus("awaiting"); return;
      }
      log(`تنفيذ الخطوة ${i + 1}: ${s.title}`);
      try {
        const r = await step({ data: { url, goal, scripts: steps.slice(0, i + 1).map((x) => x.script) } });
        if (stopRef.current) { log("تم الإيقاف بواسطتك", "warn"); setStatus("stopped"); return; }
        setShots((p) => [...p, { img: r.screenshot, caption: `بعد: ${s.title}` }]);
        log(r.observation, "ok");
        setDone(i + 1);
      } catch (e) {
        log((e as Error).message, "err"); setStatus("stopped"); return;
      }
    }
    log("انتهت كل الخطوات", "ok"); setStatus("done");
  }

  function stop() { stopRef.current = true; setStatus("stopped"); log("زر الإيقاف الطارئ: تم إيقاف الوكيل", "warn"); }

  const busy = status === "planning" || status === "running";
  const color = { info: "text-muted-foreground", ok: "text-primary", warn: "text-accent-foreground", err: "text-destructive" };

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">وكيل المتصفح السحابي</h1>
            <p className="text-sm text-muted-foreground">يعمل على متصفح Cloudflare الحقيقي • يطلب موافقتك قبل الخطوات الحساسة</p>
          </div>
          <Button variant="destructive" size="lg" onClick={stop} disabled={status === "idle" || status === "done" || status === "stopped"}>
            ■ إيقاف طارئ
          </Button>
        </header>

        <section className="mb-6 grid gap-3 rounded-lg border bg-card p-4">
          <Input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" aria-label="رابط الصفحة" />
          <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="المطلوب من الوكيل" aria-label="المهمة" />
          <Button onClick={makePlan} disabled={busy}>{status === "planning" ? "جارٍ التخطيط…" : "اعمل خطة"}</Button>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-2 font-semibold">خطة التنفيذ</h2>
            {summary && <p className="mb-3 text-sm text-muted-foreground">{summary}</p>}
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={i} className={`rounded-md border p-2 text-sm ${i < done ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span>{i < done ? "✓" : i + 1}. {s.title}</span>
                    {s.sensitive && <span className="rounded bg-secondary px-2 py-0.5 text-xs">حساسة</span>}
                  </div>
                </li>
              ))}
            </ol>
            {status === "ready" && <Button className="mt-3 w-full" onClick={() => execute(0)}>ابدأ التنفيذ</Button>}
            {status === "awaiting" && (
              <div className="mt-3 flex gap-2">
                <Button className="flex-1" onClick={() => execute(done, true)}>موافق على الخطوة {done + 1}</Button>
                <Button variant="outline" className="flex-1" onClick={stop}>رفض وإيقاف</Button>
              </div>
            )}
            <h2 className="mb-2 mt-6 font-semibold">السجل الحي</h2>
            <div className="max-h-72 overflow-auto rounded-md bg-muted p-2 font-mono text-xs" aria-label="السجل">
              {logs.map((l, i) => <div key={i} className={color[l.kind]}>[{l.t}] {l.msg}</div>)}
              {!logs.length && <div className="text-muted-foreground">لا يوجد نشاط بعد</div>}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <h2 className="mb-2 font-semibold">لقطات الشاشة ({shots.length})</h2>
            <div className="space-y-3">
              {[...shots].reverse().map((s, i) => (
                <figure key={i}>
                  <img src={s.img} alt={s.caption} className="w-full rounded-md border" />
                  <figcaption className="mt-1 text-xs text-muted-foreground">{s.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
