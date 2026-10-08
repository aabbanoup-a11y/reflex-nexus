import { createFileRoute } from "@tanstack/react-router";
import { Network } from "./network";

export const Route = createFileRoute("/")({
  component: Network,
  head: () => ({
    meta: [
      { title: "AbanoupAi — الشات الذكي" },
      { name: "description", content: "شات AbanoupAi لتنفيذ طلباتك على الهاتف والويب والخدمات المرتبطة." },
      { property: "og:title", content: "AbanoupAi — الشات الذكي" },
      { property: "og:description", content: "اطلب أي مهمة من AbanoupAi ودعه يفهمها وينفذها." },
    ],
  }),
});
