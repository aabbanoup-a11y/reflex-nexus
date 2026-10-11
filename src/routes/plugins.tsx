import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePlaceholder } from "@/components/WorkspacePlaceholder";
export const Route = createFileRoute("/plugins")({ component: () => <WorkspacePlaceholder title="Plugins" description="الإضافات والتكاملات المتاحة للنظام." /> });
