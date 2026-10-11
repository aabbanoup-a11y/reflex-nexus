import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePlaceholder } from "@/components/WorkspacePlaceholder";
export const Route = createFileRoute("/scheduled")({ component: () => <WorkspacePlaceholder title="Scheduled" description="المهام المجدولة والتنبيهات الخاصة بك." /> });
