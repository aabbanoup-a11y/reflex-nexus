// Browser + server safe: detects urgent self-harm signals (not a diagnosis).
const normalize = (s: string) =>
  s.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/\s+/g, " ");

const PATTERNS = [
  "انتحار", "انتحر", "اموت نفسي", "اقتل نفسي", "اذي نفسي", "اؤذي نفسي", "اجرح نفسي",
  "مش عايز اعيش", "مش عاوز اعيش", "مش عايزه اعيش", "نفسي اموت", "عايز اموت", "انهي حياتي",
  "اخلص من حياتي", "هموت نفسي", "suicide", "kill myself", "self harm", "end my life",
];

export function hasCrisisSignal(text: string): boolean {
  const t = normalize(text);
  return PATTERNS.some((p) => t.includes(normalize(p)));
}

export const EMERGENCY_CONTACTS = [
  { label: "الإسعاف", number: "123" },
  { label: "خط نجدة الطفل", number: "16000" },
  { label: "الخط الساخن للصحة النفسية", number: "08008880700" },
  { label: "النجدة", number: "122" },
];
