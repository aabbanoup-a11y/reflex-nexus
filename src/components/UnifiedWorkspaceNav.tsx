import { Link } from "@tanstack/react-router";

export function UnifiedWorkspaceNav() {
  return (
    <nav aria-label="مساحة العمل الموحدة" className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/80 p-2 shadow-sm">
      <Link to="/" className="px-2 text-sm font-bold text-primary">AbanoupAi</Link>
    </nav>
  );
}
