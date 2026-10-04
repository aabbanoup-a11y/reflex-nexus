import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/", label: "162 موظف" },
  { to: "/assistant", label: "المساعدين" },
  { to: "/network", label: "شبكة النماذج" },
  { to: "/companion", label: "الهاتف" },
] as const;

export function UnifiedWorkspaceNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav aria-label="مساحة العمل الموحدة" className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/80 p-2 shadow-sm">
      <span className="px-2 text-sm font-bold text-primary">AbanoupAi</span>
      {items.map((item) => (
        <Button key={item.to} asChild size="sm" variant={pathname === item.to ? "default" : "outline"}>
          <Link to={item.to}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  );
}
