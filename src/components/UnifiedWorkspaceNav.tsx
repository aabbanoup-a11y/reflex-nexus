import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getAIRoutingStatus, type AIRoutingStatus } from "@/lib/ai-routing.functions";

const items = [
  { to: "/", label: "وضع العمل · 162" },
  { to: "/assistant", label: "AbanoupAi الشخصي" },
  { to: "/network", label: "الشبكة" },
  { to: "/agent", label: "الوكيل" },
  { to: "/companion", label: "الهاتف" },
] as const;

export function UnifiedWorkspaceNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const getStatus = useServerFn(getAIRoutingStatus);
  const [status, setStatus] = useState<AIRoutingStatus | null>(null);
  useEffect(() => { void getStatus().then(setStatus).catch(() => setStatus(null)); }, [getStatus]);
  return (
    <nav aria-label="مساحة العمل الموحدة" className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/80 p-2 shadow-sm">
      <span className="px-2 text-sm font-bold text-primary">AbanoupAi</span>
      {items.map((item) => (
        <Button key={item.to} asChild size="sm" variant={pathname === item.to ? "default" : "outline"}>
          <Link to={item.to}>{item.label}</Link>
        </Button>
      ))}
      <span title={status?.message ?? "جارِ فحص مسار الذكاء الاصطناعي"} className="mr-auto flex items-center gap-1 px-2 text-xs text-muted-foreground">
        <span className={`size-2 rounded-full ${status?.gateway === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
        AI Router · Gateway {status?.gatewayId ?? "…"}
      </span>
    </nav>
  );
}
