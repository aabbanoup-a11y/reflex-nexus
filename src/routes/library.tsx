import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePlaceholder } from "@/components/WorkspacePlaceholder";
export const Route = createFileRoute("/library")({ component: () => <WorkspacePlaceholder title="Library" description="مكتبة الملفات والمخرجات الخاصة بك." /> });
