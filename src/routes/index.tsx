import { DeviceStatusCard } from "@/components/DeviceLink";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Sparkles, Users, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/runtime-client";
import { askAssistant } from "@/lib/chat.functions";
import { chainFor, modelForKey } from "@/lib/assistants";
import { logRun, notifyDone, requestNotifyPermission } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UnifiedWorkspaceNav } from "@/components/UnifiedWorkspaceNav";
import { networkTurn } from "@/lib/network.functions";
import { MANAGER_ID, NET_MODELS, netLabel } from "@/lib/models30";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "منصة الموظفين — 162 موظف ومساعد ذكي للمهام" },
      {
        name: "description",
        content:
          "دليل كامل لـ 162 موظف بكل الأقسام مع بحث فوري ومساعد ذكاء اصطناعي يكتب مهام العمل وينفذها فوراً.",
      },
      { property: "og:title", content: "منصة الموظفين — 162 موظف ومساعد ذكي للمهام" },
      {
        property: "og:description",
        content: "ابحث في 162 موظف وولّد مهام عمل جاهزة بالذكاء الاصطناعي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

type Employee = {
  id: string;
  code: string;
  full_name: string;
  department: string;
  job_title: string;
  primary_model: string | null;
  lifecycle_status: string;
  risk_level: string;
  quality_score: number | null;
  task_class: string | null;
  manager: string | null;
  reviewer: string | null;
  data_sensitivity: string | null;
};

type Task = {
  id: string;
  employee_id: string | null;
  title: string;
  details: string | null;
  priority: number;
  status: string;
};

function Home() {
  const [mode, setMode] = useState<"work" | "personal">("work");
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<string | null>(null);
  const [lifecycle, setLifecycle] = useState<string>("");
  const [risk, setRisk] = useState<string>("");
  const [primaryModel, setPrimaryModel] = useState<string>("");
  const [taskStatus, setTaskStatus] = useState<string>("");
  const [selected, setSelected] = useState<Employee | null>(null);

  if (mode === "personal") return <PersonalWorkspace onModeChange={setMode} />;

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id,code,name,department_name,role_description,primary_model,lifecycle_status,risk_level,quality_score,task_class,manager,reviewer,data_sensitivity")
        .order("code", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((e: any) => ({
        id: e.id,
        code: e.code ?? "",
        full_name: e.name ?? "بدون اسم",
        department: e.department_name ?? "بدون قسم",
        job_title: e.role_description ?? "بدون وصف وظيفي",
        primary_model: e.primary_model ?? null,
        lifecycle_status: e.lifecycle_status ?? "PROPOSED",
        risk_level: e.risk_level ?? "R0",
        quality_score: e.quality_score == null ? null : Number(e.quality_score),
        task_class: e.task_class ?? null,
        manager: e.manager ?? null,
        reviewer: e.reviewer ?? null,
        data_sensitivity: e.data_sensitivity ?? null,
      })) as Employee[];
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id,employee_id,title,description,priority,status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((t: any) => ({ ...t, details: t.description ?? null, priority: Number(t.priority ?? 3) })) as Task[];
    },
  });

  const employees = employeesQuery.data ?? [];
  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))),
    [employees],
  );

  const filtered = employees.filter((e) => {
    const matchDept = !dept || e.department === dept;
    const matchLifecycle = !lifecycle || e.lifecycle_status === lifecycle;
    const matchRisk = !risk || e.risk_level === risk;
    const matchModel = !primaryModel || e.primary_model === primaryModel;
    const employeeTasks = (tasksQuery.data ?? []).filter((t) => t.employee_id === e.id);
    const matchTaskStatus = !taskStatus || employeeTasks.some((t) => t.status === taskStatus);
    const q = search.trim();
    const matchSearch =
      !q ||
      e.full_name.toLowerCase().includes(q.toLowerCase()) ||
      e.job_title.toLowerCase().includes(q.toLowerCase()) ||
      e.department.toLowerCase().includes(q.toLowerCase()) ||
      e.code.toLowerCase().includes(q.toLowerCase());
    return matchDept && matchLifecycle && matchRisk && matchModel && matchTaskStatus && matchSearch;
  });

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <UnifiedWorkspaceNav />
          <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-border bg-background/70 p-2">
            <Button size="sm">وضع العمل · 162 موظف</Button>
            <Button size="sm" variant="outline" onClick={() => setMode("personal")}>الوضع الشخصي · AbanoupAi</Button>
          </div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <Badge>مزامنة مباشرة مع قاعدة البيانات</Badge>
            <Button asChild size="sm">
              <Link to="/assistant">
                <Sparkles className="size-4" />
                فريق المساعدين الأذكياء
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/history">السجل</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/agent">وكيل المتصفح</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/network">شبكة الـ30 نموذج</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/companion">التحكم في Chrome</Link>
            </Button>
          </div>
          <DeviceStatusCard />
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">منصة إدارة الموظفين</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            دليل كامل لفريق العمل مع مساعد ذكاء اصطناعي يكتب مهام جاهزة لكل موظف ويحفظها فوراً.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<Users className="size-4" />} label="إجمالي الموظفين" value={employees.length} />
            <Stat icon={<Building2 className="size-4" />} label="الأقسام" value={departments.length} />
            <Stat
              icon={<Users className="size-4" />}
              label="على رأس العمل"
              value={employees.filter((e) => e.lifecycle_status === "ACTIVE").length}
            />
            <Stat
              icon={<Sparkles className="size-4" />}
              label="المهام المولّدة"
              value={tasksQuery.data?.length ?? 0}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الوظيفة أو الكود..."
            className="pr-10"
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select value={lifecycle} onChange={(e) => setLifecycle(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">كل حالات الدورة</option>
            {['PROPOSED', 'EVALUATING', 'SANDBOX', 'APPROVED', 'ACTIVE', 'PAUSED', 'RETIRED'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={risk} onChange={(e) => setRisk(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">كل مستويات المخاطر</option>
            {['R0', 'R1', 'R2', 'R3'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={primaryModel} onChange={(e) => setPrimaryModel(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">كل النماذج الأساسية</option>
            {Array.from(new Set(employees.map((e) => e.primary_model).filter(Boolean))).map((value) => <option key={value} value={value ?? ""}>{value}</option>)}
          </select>
          <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">كل حالات المهام</option>
            {['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE', 'CANCELLED'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={dept === null ? "default" : "outline"}
            onClick={() => setDept(null)}
          >
            كل الأقسام
          </Button>
          {departments.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={dept === d ? "default" : "outline"}
              onClick={() => setDept(d)}
            >
              {d}
            </Button>
          ))}
        </div>

        {employeesQuery.isLoading ? (
          <p className="mt-10 text-center text-muted-foreground">جارِ تحميل الموظفين...</p>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              عرض {filtered.length} من {employees.length} موظف
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((e) => (
                <EmployeeCard
                  key={e.id}
                  employee={e}
                  tasks={(tasksQuery.data ?? []).filter((t) => t.employee_id === e.id)}
                  onOpen={() => setSelected(e)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <TaskDialog employee={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}

function PersonalWorkspace({ onModeChange }: { onModeChange: (mode: "work" | "personal") => void }) {
  const turn = useServerFn(networkTurn);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<{ who: string; text: string }[]>([]);
  const personalModels = [MANAGER_ID, ...NET_MODELS.filter((m) => m.provider === "cloudflare").slice(0, 4).map((m) => m.id)];

  async function ask() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...messages, { who: "me", text }];
    setMessages(next);
    setBusy(true);
    try {
      for (const model of personalModels) {
        const reply = await turn({ data: { model, thread: next } });
        setMessages((current) => [...current, { who: netLabel(model), text: reply.text }]);
      }
    } catch (e) {
      setMessages((current) => [...current, { who: "AbanoupAi", text: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <UnifiedWorkspaceNav />
          <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-border bg-background/70 p-2">
            <Button size="sm" variant="outline" onClick={() => onModeChange("work")}>وضع العمل · 162 موظف</Button>
            <Button size="sm">الوضع الشخصي · AbanoupAi</Button>
          </div>
          <h1 className="mt-6 text-3xl font-bold">مساحة AbanoupAi الشخصية</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">الشبكة والمساعدين والوكيل والهاتف والذاكرة في محادثة واحدة. Cloudflare هو المسار الأساسي، مع قراءة آمنة وكتابة في الفرع التجريبي وتسجيل التغييرات.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {([
              ["شبكة النماذج", "/network", "المحادثة المشتركة وCloudflare"],
              ["المساعدين", "/assistant", "الدراسة والكاراتيه والصحة"],
              ["الوكيل", "/agent", "قراءة صفحات الويب وتنفيذ الخطوات"],
              ["هاتف Oppo", "/companion", "الأوامر والسجل وزر الطوارئ"],
              ["الذاكرة والسجل", "/history", "النتائج والتقارير اليومية"],
            ] as const).map(([label, href, desc]) => (
              <Link key={href} to={href} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"><p className="font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{desc}</p></Link>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-bold">المحادثة الموحدة</h2><span className="text-xs text-muted-foreground">{busy ? "النماذج بترد..." : "جاهز"}</span></div>
          <div className="mb-4 min-h-48 space-y-2 rounded-lg border border-border bg-background p-3">
            {!messages.length && <p className="text-sm text-muted-foreground">اكتب هدفك بصيغة طبيعية، مثل: اقرأ هذا الرابط، عدّل الملف، أو افتح التطبيق على الهاتف.</p>}
            {messages.map((m, i) => <div key={i} className={`rounded-md p-2 text-sm ${m.who === "me" ? "bg-primary/10" : "bg-muted"}`}><b>{m.who === "me" ? "أنت" : m.who}:</b> {m.text}</div>)}
          </div>
          <div className="flex gap-2"><Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void ask(); }} placeholder="اكتب هدفك لـ AbanoupAi..." /><Button onClick={() => void ask()} disabled={busy}>إرسال</Button></div>
        </section>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function EmployeeCard({
  employee,
  tasks,
  onOpen,
}: {
  employee: Employee;
  tasks: Task[];
  onOpen: () => void;
}) {
  const initials = employee.full_name.slice(0, 2);
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{employee.full_name}</h3>
            <Badge variant={employee.lifecycle_status === "ACTIVE" ? "secondary" : "outline"}>
              {employee.lifecycle_status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {employee.job_title} — {employee.department}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {employee.code} · {employee.risk_level} · 🤖 {(employee.primary_model || modelForKey(employee.code)).split("/").pop()}
          </p>
        </div>
      </div>

      {tasks.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-border pt-3">
          {tasks.slice(0, 3).map((t) => (
            <li key={t.id} className="truncate text-xs text-muted-foreground">
              • {t.title}
            </li>
          ))}
        </ul>
      )}

      <Button size="sm" variant="outline" className="mt-3 w-full" onClick={onOpen}>
        <Sparkles className="size-4" />
        كلّفه بمهمة
      </Button>
    </div>
  );
}

function TaskDialog({
  employee,
  onOpenChange,
}: {
  employee: Employee | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<{ text: string; model: string } | null>(null);
  const ask = useServerFn(askAssistant);
  const queryClient = useQueryClient();

  // كل موظف = نموذج ذكاء اصطناعي بياخد دوره الوظيفي.
  const handleRun = async () => {
    if (!employee) return;
    requestNotifyPermission();
    const task = goal.trim() || "اكتب خطة عمل لهذا الأسبوع ونفّذ أول خطوة";
    const model = modelForKey(employee.code);
    setLoading(true);
    setReply(null);
    try {
      const r = await ask({
        data: {
          system: `أنت ${employee.full_name}، تعمل ${employee.job_title} في قسم ${employee.department}. نفّذ المهمة المطلوبة بنفسك كخبير في وظيفتك: اكتب الناتج النهائي الفعلي (مش مجرد نصائح)، ثم في آخر سطر اكتب "الخطوة التالية:" باقتراح واحد. رد بالعربية باختصار.`,
          model,
          fallbacks: chainFor(model),
          messages: [{ role: "user", content: task }],
        },
      });
      setReply({ text: r.text, model: r.model });
      await supabase.from("tasks").insert({
        employee_id: employee.id,
        title: task.slice(0, 200),
        description: r.text,
        priority: 3,
        status: "DONE",
      });
      void logRun({ agent_kind: "employee", agent_key: employee.code, agent_name: employee.full_name, model: r.model, prompt: task, reply: r.text, status: "done" });
      notifyDone(`${employee.full_name} خلّص المهمة`, r.text);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "حصل خطأ غير متوقع";
      void logRun({ agent_kind: "employee", agent_key: employee.code, agent_name: employee.full_name, model, prompt: task, reply: msg, status: "error" });
      notifyDone(`${employee.full_name} ما قدرش يكمّل`, msg, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!employee} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">
            كلّف {employee?.full_name ?? ""} بمهمة
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          {employee?.job_title} · النموذج: {employee ? modelForKey(employee.code) : ""}
        </p>

        <Input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="اكتب المهمة (مثال: اكتب تقرير مبيعات الأسبوع)"
        />

        <Button onClick={handleRun} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "بينفّذ المهمة..." : "نفّذ المهمة"}
        </Button>

        {reply && (
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border p-3">
            <p className="mb-1 text-xs font-semibold text-primary">{reply.model}</p>
            <p className="whitespace-pre-wrap text-sm leading-7">{reply.text}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
