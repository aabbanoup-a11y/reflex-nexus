import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Sparkles, Users, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { askAssistant } from "@/lib/chat.functions";
import { chainFor } from "@/lib/assistants";
import { logRun, notifyDone, requestNotifyPermission } from "@/lib/activity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  email: string;
  phone: string;
  hired_at: string;
  status: string;
  ai_model: string | null;
};

type Task = {
  id: string;
  employee_id: string | null;
  title: string;
  details: string | null;
  priority: string;
  status: string;
};

function Home() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState<string | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("code", { ascending: true });
      if (error) throw error;
      return data as Employee[];
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const employees = employeesQuery.data ?? [];
  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))),
    [employees],
  );

  const filtered = employees.filter((e) => {
    const matchDept = !dept || e.department === dept;
    const q = search.trim();
    const matchSearch =
      !q ||
      e.full_name.includes(q) ||
      e.job_title.includes(q) ||
      e.code.toLowerCase().includes(q.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-10">
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
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">منصة إدارة الموظفين</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            دليل كامل لفريق العمل مع مساعد ذكاء اصطناعي يكتب مهام جاهزة لكل موظف ويحفظها فوراً.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<Users className="size-4" />} label="إجمالي الموظفين" value={employees.length} />
            <Stat icon={<Building2 className="size-4" />} label="الأقسام" value={departments.length} />
            <Stat
              icon={<Users className="size-4" />}
              label="على رأس العمل"
              value={employees.filter((e) => e.status === "active").length}
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

        <div className="mt-4 flex flex-wrap gap-2">
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
            <Badge variant={employee.status === "active" ? "secondary" : "outline"}>
              {employee.status === "active" ? "نشط" : "إجازة"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {employee.job_title} — {employee.department}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {employee.code} · 🤖 {employee.ai_model?.split("/")[1]}
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
    const model = employee.ai_model || "google/gemini-3.8-flash";
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
        details: r.text,
        priority: "medium",
        status: "done",
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
          {employee?.job_title} · النموذج: {employee?.ai_model}
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
