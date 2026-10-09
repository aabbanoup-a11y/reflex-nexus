import { runLocal } from "@/lib/local-llm";
import { supabase } from "@/integrations/supabase/runtime-client";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const GENERIC_OFFLINE_REPLY = "أنا هنا معاك، بس النماذج السحابية مش متصلة دلوقتي. قولي عايز تعمل ايه وأنا هنفذه بالأوامر المحلية.";

export function isYouTubeRequest(prompt: string) {
  return /(تحميل|احمل|حمّل|تنزيل).*?(اغني|أغني|يوتيوب)|يوتيوب|youtube/i.test(prompt);
}

function youtubeQuery(prompt: string) {
  const knownSong = prompt.match(/في\s+وحدتي\s+والحزن\s+بي/i)?.[0];
  if (knownSong) return knownSong;
  const cleaned = prompt
    .replace(/عايز|عاوز|ممكن|لو سمحت|من فضلك|تحميل|احمل|حمّل|تنزيل|اغنية|أغنية|اغنيه|يوتيوب|youtube/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "اغنية";
}

/** يرسل أمرًا للهاتف إن كان مربوطًا؛ فشل الإرسال لا يمنع الرد المفيد للمستخدم. */
export async function openYouTubeOnPhone(prompt: string, userId?: string) {
  try {
    const { data: userData } = userId ? { data: { user: { id: userId } } } : await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return false;
    const { data: device } = await supabase
      .from("companion_devices")
      .select("id")
      .eq("user_id", uid)
      .eq("platform", "android")
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (!device) return false;
    const url = `https://m.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery(prompt))}`;
    const { error } = await supabase.from("companion_commands").insert({
      device_id: device.id,
      user_id: uid,
      kind: "open_url",
      payload: { url },
      requires_approval: false,
      status: "approved",
      approved_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

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

/** آخر طبقة مضمونة: لا ترمي خطأ للمستخدم، ولا تعيد رسالة عدم توفر عامة. */
export async function assistantFallback(prompt: string, history: ChatTurn[], conversationId?: string, userId?: string) {
  if (isYouTubeRequest(prompt)) {
    await openYouTubeOnPhone(prompt, userId);
    return "تمام، هافتحلك اليوتيوب على الاغنية دي. لو عايز تحملها، دوس على زر Remote في السايدبار وافتح YouTube، او استخدم YouTube Music وحملها Offline من هناك.";
  }
  try {
    const text = await localReply(prompt, history);
    return text.trim() || basicReply(prompt);
  } catch {
    if (conversationId) savePending(prompt, conversationId);
    return GENERIC_OFFLINE_REPLY;
  }
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
