import { createFileRoute } from "@tanstack/react-router";
import { HomeDashboard } from "@/components/HomeDashboard";

export const Route = createFileRoute("/")({
  component: HomeDashboard,
  head: () => ({
    meta: [
      { title: "AbanoubAI — مساحة العمل الشخصية" },
      { name: "description", content: "مركز واحد لفهم أهدافك وتخطيطها وتنفيذها ومراجعة النتائج." },
      { property: "og:title", content: "AbanoubAI — مساحة العمل الشخصية" },
      { property: "og:description", content: "Personal Intelligence & Execution OS" },
    ],
  }),
});
