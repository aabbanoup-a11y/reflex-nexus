import { runLocal } from "@/lib/local-llm";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export function basicReply(prompt: string): string {
  const normalized = prompt.trim().toLowerCase();
  if (/^(سلام|اهلا|أهلا|hello|hi)/.test(normalized)) return "أهلاً بيك! أقدر أساعدك في أي سؤال أو مهمة. قولّي نبدأ بإيه؟";
  if (/شكرا|شكرًا|thanks/.test(normalized)) return "العفو! أنا موجود لو احتجت أي حاجة تانية.";
  return `فهمت طلبك: «${prompt.trim()}»\n\nهجهّز لك إجابة مفيدة خطوة بخطوة. لو محتاج نتيجة محددة، اكتب التفاصيل أو الملف المطلوب.`;
}

export async function localReply(prompt: string, history: ChatTurn[]): Promise<string> {
  return runLocal(
    "local/Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    "أنت مساعد عربي ودود. أجب بالعربية المصرية ببساطة واختصار، وكن عمليًا.",
    [...history, { role: "user", content: prompt }].map((message) => ({
      who: message.role === "user" ? "me" : "assistant",
      text: message.content,
    })),
  );
}

export function savePending(prompt: string, conversationId: string) {
  const key = "abanoupai:pending-chat-messages";
  try {
    const current = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
    localStorage.setItem(key, JSON.stringify([...current, { prompt, conversationId, createdAt: new Date().toISOString() }].slice(-50)));
  } catch {
    // التخزين المحلي اختياري؛ الرسالة الأساسية محفوظة في Supabase بالفعل.
  }
}
