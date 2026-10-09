import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePlaceholder } from "@/components/WorkspacePlaceholder";
export const Route = createFileRoute("/remote")({ component: () => <WorkspacePlaceholder title="Remote" description="مساحة التحكم والاتصال بالأجهزة عن بعد." /> });
