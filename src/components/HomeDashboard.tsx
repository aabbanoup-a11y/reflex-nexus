import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowUpLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/runtime-client";
import { useAuth } from "@/hooks/useAuth";

type RecentRun = {
  id: string;
  agent_name: string;
  status: string;
  model: string | null;
  created_at: string;
};

function statusLabel(status: string) {
  const value = status.toLowerCase();
  if (value === "done" || value === "completed" || value === "success") return "اكتملت";
  if (value === "running" || value === "planning" || value === "queued") return "قيد التنفيذ";
  return "لم تكتمل";
}

function statusIcon(status: string) {
  const value = status.toLowerCase();
  if (value === "done" || value === "completed" || value === "success") {
    return <CheckCircle2 className="size-4 text-emerald-500" />;
  }
  if (value === "running" || value === "planning" || value === "queued") {
    return <Clock3 className="size-4 text-primary" />;
  }
  return <CircleAlert className="size-4 text-destructive" />;
}

export function HomeDashboard() {
  const { user } = useAuth();
  const recentRuns = useQuery({
    queryKey: ["home-dashboard", "recent-runs", user?.id],
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ai_runs")
        .select("id,agent_name,status,model,created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data ?? []) as RecentRun[];
    },
  });

  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "بك";

  return (
    <main dir="rtl" className="min-h-screen px-4 pb-10 pt-20 sm:px-6 lg:px-9 lg:pt-8">
      <div className="mx-auto max-w-[1480px]">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-primary">
              ABANOUBAI / PERSONAL WORKSPACE
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">الرئيسية</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              كل ما تحتاجه للفهم والتخطيط والتنفيذ في مساحة واحدة.
            </p>
          </div>
          <div className="hidden items-center rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex">
            مساحة عملك الشخصية
          </div>
        </header>

        <section className="relative isolate overflow-hidden rounded-[28px] border border-primary/25 bg-card px-6 py-8 shadow-2xl shadow-black/10 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 -z-10 size-80 rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 right-1/3 -z-10 size-72 rounded-full bg-accent/35 blur-3xl"
          />
          <img
            src="/abanoubai-mark.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-6 top-1/2 hidden size-56 -translate-y-1/2 opacity-[0.075] lg:block"
          />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-primary">
              <Sparkles className="size-3.5" />
              PERSONAL INTELLIGENCE & EXECUTION
            </span>
            <h2 className="mt-5 max-w-2xl text-3xl font-bold leading-[1.35] tracking-tight sm:text-4xl lg:text-[42px]">
              أهلاً {name}.
              <span className="mt-1 block text-primary">حوّل أفكارك إلى خطوات قابلة للإنجاز.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              ابدأ بهدفك، وسيكون المساعد مساحة واحدة لفهمه وتقسيمه ومتابعة تنفيذه. ستظهر حالة كل خطوة ونتيجتها بدل الاكتفاء بوعدٍ من الذكاء الاصطناعي.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/assistant"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-black/15 transition hover:brightness-105"
              >
                <Sparkles className="size-4" />
                ابدأ مهمة جديدة
                <ArrowUpLeft className="size-4" />
              </Link>
              <Link
                to="/agent"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background/55 px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-accent/35"
              >
                <Bot className="size-4 text-primary" />
                استكشف الوكلاء
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Activity className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold">آخر نشاط</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    سجل حقيقي من المهام المسجلة في حسابك
                  </p>
                </div>
              </div>
              <Link
                to="/history"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
              >
                عرض السجل <ArrowLeft className="size-3.5" />
              </Link>
            </div>

            {!user ? (
              <div className="rounded-2xl border border-dashed border-border bg-background/50 px-4 py-8 text-center">
                <p className="text-sm font-semibold">سجّل الدخول لمشاهدة نشاطك</p>
                <p className="mt-2 text-xs text-muted-foreground">سيظهر هنا سجل المهام المرتبط بحسابك.</p>
                <Link to="/auth" className="mt-4 inline-flex text-sm font-bold text-primary hover:underline">
                  تسجيل الدخول
                </Link>
              </div>
            ) : recentRuns.isLoading ? (
              <div className="space-y-3" aria-label="تحميل النشاط">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-[58px] animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : recentRuns.isError ? (
              <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-7 text-center">
                <p className="text-sm font-semibold">تعذر تحميل النشاط الآن</p>
                <p className="mt-2 text-xs text-muted-foreground">يمكنك فتح سجل التنفيذ والمحاولة مرة أخرى.</p>
                <Link to="/history" className="mt-4 inline-flex text-sm font-bold text-primary hover:underline">
                  فتح سجل التنفيذ
                </Link>
              </div>
            ) : recentRuns.data?.length ? (
              <div className="divide-y divide-border">
                {recentRuns.data.map((run) => (
                  <div key={run.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background">
                      {statusIcon(run.status)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{run.agent_name || "مهمة AbanoubAI"}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {statusLabel(run.status)} · {new Date(run.created_at).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <span className="hidden max-w-28 truncate text-[10px] text-muted-foreground sm:block">
                      {run.model || ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background/50 px-4 py-8 text-center">
                <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <p className="mt-3 text-sm font-semibold">لا توجد مهام مسجلة بعد</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  ابدأ أول مهمة من المساعد الذكي، وستظهر نتائجها هنا بعد تسجيلها.
                </p>
                <Link to="/assistant" className="mt-4 inline-flex text-sm font-bold text-primary hover:underline">
                  ابدأ الآن
                </Link>
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Sparkles className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-bold">ابدأ من هدفك</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                صف ما تريد إنجازه بلغتك الطبيعية. سيعرض النظام خطة واضحة، ثم يوضح ما نُفّذ وما يحتاج إلى مراجعة.
              </p>
              <Link
                to="/assistant"
                className="mt-5 flex min-h-11 items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/15"
              >
                افتح المساعد الذكي <ArrowUpLeft className="size-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
              <h2 className="font-bold">مساحة عملك</h2>
              <p className="mt-1 text-xs text-muted-foreground">اختصارات إلى الأقسام المتصلة.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link to="/scheduled" className="flex min-h-14 items-center gap-2 rounded-xl border border-border bg-background/65 px-3 py-2 text-xs font-semibold transition hover:border-primary/40">
                  <CalendarDays className="size-4 shrink-0 text-primary" /> التخطيط
                </Link>
                <Link to="/history" className="flex min-h-14 items-center gap-2 rounded-xl border border-border bg-background/65 px-3 py-2 text-xs font-semibold transition hover:border-primary/40">
                  <Activity className="size-4 shrink-0 text-primary" /> النشاط
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
