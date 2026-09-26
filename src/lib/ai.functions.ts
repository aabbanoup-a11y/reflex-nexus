import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  employeeName: z.string().min(1),
  department: z.string().min(1),
  jobTitle: z.string().min(1),
  goal: z.string().min(1),
});

export type GeneratedTask = {
  title: string;
  details: string;
  priority: "low" | "medium" | "high";
};

export const generateTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<GeneratedTask[]> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("خدمة الذكاء الاصطناعي غير متاحة حالياً");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "أنت مدير عمليات. اكتب مهام عملية قصيرة بالعربية فقط.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `الموظف: ${data.employeeName}\nالقسم: ${data.department}\nالوظيفة: ${data.jobTitle}\nالهدف: ${data.goal}\nاكتب من 3 إلى 5 مهام.`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "tasks",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["tasks"],
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["title", "details", "priority"],
                    properties: {
                      title: { type: "string" },
                      details: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("الطلبات كتير دلوقتي، جرّب بعد شوية.");
      if (res.status === 402) throw new Error("رصيد الذكاء الاصطناعي خلص.");
      throw new Error(`فشل توليد المهام (${res.status}) ${body.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && evt.response?.output_text) {
            if (!text) text = String(evt.response.output_text);
          }
        } catch {
          // ignore partial frames
        }
      }
    }

    if (!text.trim()) throw new Error("لم يتم إنتاج مهام، جرّب صياغة الهدف بشكل أوضح.");

    const parsed = JSON.parse(text) as { tasks?: GeneratedTask[] };
    return (parsed.tasks ?? []).slice(0, 5);
  });
