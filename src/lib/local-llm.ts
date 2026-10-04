// Browser-only: runs offline models on the device GPU via WebLLM.
// First use downloads the model once (cached by the browser); after that it works without internet.
type Engine = { chat: { completions: { create: (r: unknown) => Promise<{ choices: { message: { content: string | null } }[] }> } } };
const engines = new Map<string, Promise<Engine>>();

export const localSupported = () => typeof navigator !== "undefined" && "gpu" in navigator;

export async function runLocal(
  id: string,
  system: string,
  thread: { who: string; text: string }[],
  onProgress?: (msg: string) => void,
): Promise<string> {
  if (!localSupported()) throw new Error("الجهاز ده مش بيدعم تشغيل النماذج أوفلاين (WebGPU). جرّب Chrome حديث.");
  const model = id.replace(/^local\//, "");
  let eng = engines.get(model);
  if (!eng) {
    eng = import("@mlc-ai/web-llm").then((w) =>
      w.CreateMLCEngine(model, { initProgressCallback: (p) => onProgress?.(p.text) }) as unknown as Promise<Engine>,
    );
    engines.set(model, eng);
    eng.catch(() => engines.delete(model));
  }
  const e = await eng;
  const messages = [
    { role: "system", content: system },
    ...thread.slice(-12).map((m) => ({ role: m.who === "me" ? "user" : "assistant", content: m.who === "me" ? m.text : `[${m.who}] ${m.text}` }).valueOf()),
  ];
  // Many small models require the last message to be from the user.
  if (messages[messages.length - 1]!.role !== "user") messages.push({ role: "user", content: "كمّل ورد على آخر رسالة." });
  const r = await e.chat.completions.create({ messages, max_tokens: 600 });
  return r.choices[0]?.message.content?.trim() || "(مفيش رد)";
}
