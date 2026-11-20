import { modelRoute, normalizeHistory } from "./model-routing.ts";

Deno.test("general requests use fast default and one fallback", () => {
  const route = modelRoute("general");
  if (route[0] !== "google/gemini-2.5-flash" || route.length !== 2) throw new Error("Unexpected general route");
});

Deno.test("coding requests prioritize coding model", () => {
  if (modelRoute("coding")[0] !== "openai/gpt-4.1-mini") throw new Error("Unexpected coding route");
});

Deno.test("deep reasoning requests prioritize Claude", () => {
  if (modelRoute("research")[0] !== "anthropic/claude-sonnet-4") throw new Error("Unexpected deep route");
});

Deno.test("history is bounded and only accepts user/assistant text", () => {
  const history = normalizeHistory([
    { role: "system", content: "discard" },
    { role: "user", content: "  hello  " },
    ...Array.from({ length: 15 }, (_, i) => ({ role: "assistant", content: String(i) })),
  ]);
  if (history.length !== 12 || history[0].content !== "4" || history[11].content !== "14") {
    throw new Error("History was not bounded to the latest 12 valid messages");
  }
});
