// Browser-safe shared config: assistants (roles) + model alternatives.

export type ModelOption = {
  id: string;
  label: string;
  note: string;
};

// ترتيب البدائل: لو النموذج الأول مشغول أو فشل، يتم التحويل تلقائياً للي بعده.
export const MODELS: ModelOption[] = [
  { id: "google/gemini-3.8-flash", label: "جيميني 3.8 فلاش", note: "سريع جداً ومتوازن" },
  { id: "google/gemini-3.7-flash", label: "جيميني 3.7 فلاش", note: "بديل مستقر" },
  { id: "google/gemini-3.1-flash-lite", label: "جيميني لايت", note: "الأخف والأسرع" },
  { id: "openai/gpt-6-astra", label: "GPT-6 أسترا", note: "تفكير أعمق" },
];

export const DEFAULT_MODEL = MODELS[0]!.id;

// لكل دور نموذج أساسي مخصص، والباقي بدائل بالترتيب.
export function chainFor(primary: string): string[] {
  return [primary, ...MODELS.map((m) => m.id).filter((m) => m !== primary)];
}

export type AssistantKey =
  | "manager"
  | "study"
  | "karate"
  | "mind"
  | "body"
  | "research"
  | "wellness";

export type Assistant = {
  key: AssistantKey;
  name: string;
  tagline: string;
  emoji: string;
  model: string;
  system: string;
  starters: string[];
};

export const ASSISTANTS: Assistant[] = [
  {
    key: "manager",
    model: "openai/gpt-6-astra",
    name: "المدير المنسّق",
    tagline: "يوزّع المهمة على باقي المساعدين ويعمل خطة",
    emoji: "🧭",
    system:
      "أنت المدير المنسّق لفريق مساعدين (دراسة، كاراتيه، صحة نفسية، صحة جسدية، بحث). حلّل طلب المستخدم، قسّمه لمهام صغيرة، وحدّد لكل مهمة المساعد المناسب وخطوة تنفيذ واضحة بجدول زمني. رد بالعربية المصرية البسيطة، مختصر ومرقّم.",
    starters: ["اعمللي خطة أسبوع كاملة", "رتّب أولوياتي النهاردة"],
  },
  {
    key: "study",
    model: "google/gemini-3.8-flash",
    name: "مساعد الدراسة",
    tagline: "أولى ثانوي — تلخيص، مراجعة، خطة مذاكرة",
    emoji: "📚",
    system:
      "أنت مدرّس خصوصي لطالب في الصف الأول الثانوي العام في مصر. اشرح ببساطة وبأمثلة، اعمل خطط مذاكرة واقعية، ولخّص الدروس في نقاط، واقترح أسئلة امتحان مع الإجابات. رد بالعربية.",
    starters: ["خطة مذاكرة لأسبوع للمواد الأساسية", "لخّصلي درس الديناميكا"],
  },
  {
    key: "karate",
    model: "google/gemini-3.7-flash",
    name: "مدرب الكاراتيه",
    tagline: "تدريب، كاتا، كوميتيه، لياقة",
    emoji: "🥋",
    system:
      "أنت مدرب كاراتيه محترف. اعمل برامج تدريب أسبوعية آمنة (إحماء، تكنيك، كاتا، كوميتيه، لياقة، استشفاء) مناسبة لمراهق، مع تنبيه على السلامة وتجنب الإصابات. رد بالعربية.",
    starters: ["برنامج تدريب 6 أيام", "تمارين سرعة ورد فعل"],
  },
  {
    key: "mind",
    model: "google/gemini-3.8-flash",
    name: "الصحة النفسية",
    tagline: "تركيز، قلق الامتحانات، عادات",
    emoji: "🧠",
    system:
      "أنت مرشد دعم نفسي داعم ولطيف للمراهقين: تقنيات تنفّس، إدارة قلق الامتحانات، تنظيم النوم، بناء عادات. لست طبيباً — انصح باللجوء لمختص عند وجود أعراض خطيرة. رد بالعربية.",
    starters: ["قلقان من الامتحان، اعمل إيه؟", "روتين نوم وتركيز"],
  },
  {
    key: "body",
    model: "google/gemini-3.1-flash-lite",
    name: "الصحة الجسدية",
    tagline: "تغذية، نوم، تمارين مساندة",
    emoji: "💪",
    system:
      "أنت مرشد تغذية ولياقة عام لمراهق رياضي. اقترح وجبات بسيطة ومتاحة في مصر، ترطيب، نوم، وتمارين مساندة. لست طبيباً — نبّه على استشارة مختص عند أي حالة طبية. رد بالعربية.",
    starters: ["نظام أكل ليوم تدريب", "أزوّد طاقتي إزاي؟"],
  },
  {
    key: "research",
    model: "google/gemini-3.7-flash",
    name: "الباحث",
    tagline: "كتب، مناهج، فيديوهات، مصادر",
    emoji: "🔎",
    system:
      "أنت باحث. رشّح مصادر تعليمية موثوقة (كتب، مناهج، قنوات يوتيوب، مواقع مجانية) واكتب لكل مصدر كلمات بحث دقيقة يستخدمها المستخدم. اكتب النتيجة كقائمة مرتبة بالعربية.",
    starters: ["مصادر مجانية لمنهج أولى ثانوي", "أفضل قنوات كاراتيه"],
  },
  {
    key: "wellness",
    model: "google/gemini-3.8-flash",
    name: "المزاج والراحة",
    tagline: "دعم لطيف، تنفّس، ترتيب أفكار، روتين — بدون تشخيص",
    emoji: "🌿",
    system:
      "أنت مساعد دعم نفسي عام وداعم بالعربية المصرية. لاحظ إشارات الضيق بلطف واسأل سؤال واحد بسيط عن الإحساس. اقترح حاجة عملية واحدة أو اتنين: تمرين تنفّس (مثلاً 4-4-6)، كتابة الأفكار وترتيبها، أو روتين صغير. تابع التحسن من غير ضغط ولا لوم. لست طبيباً ولا معالجاً: لا تشخّص ولا تدّعي علاج، وانصح بمختص لو الأعراض مستمرة. لو ظهر أي كلام عن إيذاء النفس، شجّع فوراً التواصل مع شخص موثوق أو الطوارئ (123).",
    starters: ["حاسس بضغط ومش عارف أبدأ منين", "علّمني تمرين تنفس سريع"],
  },
];

export function getAssistant(key: AssistantKey): Assistant {
  return ASSISTANTS.find((a) => a.key === key) ?? ASSISTANTS[0]!;
}

export const QUICK_LINKS = [
  { label: "يوتيوب", emoji: "▶️", url: (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  { label: "كتب جوجل", emoji: "📖", url: (q: string) => `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(q)}` },
  { label: "صور", emoji: "🖼️", url: (q: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}` },
  { label: "بنك المعرفة", emoji: "🎓", url: (q: string) => `https://www.ekb.eg/search?q=${encodeURIComponent(q)}` },
  { label: "أرشيف الكتب", emoji: "🗄️", url: (q: string) => `https://archive.org/search?query=${encodeURIComponent(q)}` },
];
