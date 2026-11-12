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
    const network = await import("./network.server");
    const prompt = `الموظف: ${data.employeeName}
القسم: ${data.department}
الوظيفة: ${data.jobTitle}
الهدف: ${data.goal}

اكتب من 3 إلى 5 مهام عملية قصيرة بالعربية فقط. أخرج JSON صالحًا فقط بهذا الشكل:
{"tasks":[{"title":"...","details":"...","priority":"low|medium|high"}]}
لا تضف Markdown أو أي نص خارج JSON.`;
    let text = "";
    let lastError = "";
    for (const model of ["cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast", "google/gemini-3.8-flash", "openai/chat-latest"]) {
      try {
        text = await network.callModel(model, "أنت مدير عمليات. أنشئ مهام عملية دقيقة. أخرج JSON صالحًا فقط.", [{ role: "user", content: prompt }]);
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
    if (!text.trim()) throw new Error(`تعذر توليد المهام من مزودي النماذج المتصلين: ${lastError.slice(0, 240)}`);
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let parsed: { tasks?: GeneratedTask[] };
    try { parsed = JSON.parse(cleaned) as { tasks?: GeneratedTask[] }; }
    catch { throw new Error("النموذج لم يرجع JSON صالحًا للمهام؛ حاول مرة أخرى."); }
    const tasks = z.array(z.object({
      title: z.string().min(1),
      details: z.string().min(1),
      priority: z.enum(["low", "medium", "high"]),
    })).max(5).parse(parsed.tasks ?? []);
    return tasks.slice(0, 5);
  });
