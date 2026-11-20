export type ModelTask = "general" | "coding" | "deep-reasoning";

const ROUTES: Record<ModelTask, readonly string[]> = {
  general: ["google/gemini-2.5-flash", "openai/gpt-4.1-mini"],
  coding: ["openai/gpt-4.1-mini", "google/gemini-2.5-flash"],
  "deep-reasoning": ["anthropic/claude-sonnet-4", "google/gemini-2.5-flash"],
};

/** One primary model per request; the second is used only when the first fails. */
export function modelRoute(task: unknown): readonly string[] {
  const normalized = typeof task === "string" ? task.trim().toLowerCase() : "";
  if (normalized === "coding" || normalized === "code") return ROUTES.coding;
  if (normalized === "deep-reasoning" || normalized === "research" || normalized === "complex") {
    return ROUTES["deep-reasoning"];
  }
  return ROUTES.general;
}

export function normalizeHistory(value: unknown): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(value)) return [];
  return value.slice(-12).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const role = (item as Record<string, unknown>).role;
    const content = (item as Record<string, unknown>).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return [];
    const trimmed = content.trim().slice(0, 6_000);
    return trimmed ? [{ role, content: trimmed }] : [];
  });
}
