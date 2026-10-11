import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePlaceholder } from "@/components/WorkspacePlaceholder";
export const Route = createFileRoute("/images")({ component: () => <WorkspacePlaceholder title="Images" description="مساحة الصور هتتصل بمكتبة الصور قريبًا." /> });
