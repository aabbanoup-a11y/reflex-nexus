import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePlaceholder } from "@/components/WorkspacePlaceholder";
export const Route = createFileRoute("/projects")({ component: () => <WorkspacePlaceholder title="Projects" description="إدارة مشروعاتك ومساحات العمل من هنا." /> });
