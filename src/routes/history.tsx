import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "سجل التنفيذ — كل مهام المساعدين والموظفين" },
      { name: "description", content: "كل طلب ورد نفّذه المساعدين الستة والـ 162 موظف ذكي محفوظ هنا بالترتيب." },
      { property: "og:title", content: "سجل التنفيذ" },
      { property: "og:description", content: "سجل كامل لكل المهام اللي نفّذها الذكاء الاصطناعي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Run = {
  id: string;
  agent_kind: string;
  agent_name: string;
  model: string | null;
  prompt: string;
  reply: string | null;
  status: string;
  created_at: string;
};

const kindLabel: Record<string, string> = { assistant: "مساعد", employee: "موظف ذكي", team: "وضع الفريق" };

function HistoryPage() {
  const q = useQuery({
    queryKey: ["ai_runs"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ai_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Run[];
    },
  });

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-6">
          <h1 className="text-2xl font-bold">سجل التنفيذ</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/assistant">المساعدين</Link></Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">الموظفين <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-3 px-4 py-6">
        {q.isLoading && <Loader2 className="mx-auto size-5 animate-spin" />}
        {q.data?.length === 0 && <p className="text-center text-muted-foreground">لسه مفيش مهام متنفذة.</p>}
        {q.data?.map((r) => (
          <details key={r.id} className="rounded-xl border border-border bg-card p-4">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={r.status === "done" ? "secondary" : "destructive"}>
                  {r.status === "done" ? "خلصت" : "فشلت"}
                </Badge>
                <span className="font-semibold">{r.agent_name}</span>
                <span className="text-xs text-muted-foreground">
                  {kindLabel[r.agent_kind] ?? r.agent_kind} · {r.model} · {new Date(r.created_at).toLocaleString("ar-EG")}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm">{r.prompt}</p>
            </summary>
            <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm leading-7 text-muted-foreground">
              {r.reply}
            </p>
          </details>
        ))}
      </main>
    </div>
  );
}
