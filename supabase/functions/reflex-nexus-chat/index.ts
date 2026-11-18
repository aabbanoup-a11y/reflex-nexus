import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { aiRoutingAllowed, loadFeatureFlags } from "../_shared/feature-policy.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: cors });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "POST required" });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_ANON_KEY") ||
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const ai = Deno.env.get("LOVABLE_API_KEY") ?? "";
  const auth = req.headers.get("Authorization") || "";

  if (!auth.startsWith("Bearer ")) return json(401, { error: "Sign in required" });
  if (!url || !key) return json(503, { error: "Server auth is not configured" });

  const checked = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: auth },
    signal: AbortSignal.timeout(8_000),
  });
  if (!checked.ok) return json(401, { error: "Session is invalid or expired" });

  // Model calls are disabled unless both the emergency switch and the explicit
  // AI-routing feature flag permit them. Missing settings fail closed.
  let flags;
  try {
    flags = await loadFeatureFlags({ supabaseUrl: url, serviceRoleKey });
  } catch {
    return json(503, { error: "AI_ROUTING_POLICY_UNAVAILABLE" });
  }
  if (!aiRoutingAllowed(flags)) return json(503, { error: "AI_ROUTING_DISABLED" });

  let input: any;
  try {
    input = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!message || message.length > 12_000) {
    return json(400, { error: "Message must be 1–12000 characters" });
  }
  if (!ai) return json(503, { error: "AI provider key is not configured" });

  const history = Array.isArray(input.history)
    ? input.history.slice(-12)
      .filter((m: any) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 6_000) }))
    : [];
  const endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const headers = { Authorization: `Bearer ${ai}`, "Content-Type": "application/json" };
  const models = [
    "google/gemini-2.5-flash",
    "openai/gpt-4.1-mini",
    "anthropic/claude-sonnet-4",
  ];

  const answers = await Promise.all(models.map(async (model) => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [...history, { role: "user", content: message }],
          max_tokens: 900,
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) return { model, ok: false, error: `provider returned ${response.status}` };
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      return typeof content === "string" && content.trim()
        ? { model, ok: true, content: content.trim() }
        : { model, ok: false, error: "empty response" };
    } catch (error) {
      return {
        model,
        ok: false,
        error: error instanceof Error ? error.message : "request failed",
      };
    }
  }));

  const good = answers.filter((answer: any) => answer.ok);
  if (!good.length) return json(502, { error: "All model requests failed", models: answers });

  let answer = good.length === 1 ? good[0].content : "";
  let synthesized = false;
  if (good.length > 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Synthesize the model responses into one accurate answer to the original question. Reconcile disagreements, avoid repetition, express uncertainty honestly, and respond in the user's language.",
            },
            {
              role: "user",
              content: JSON.stringify({
                question: message,
                responses: good.map((item: any) => ({ model: item.model, answer: item.content })),
              }),
            },
          ],
          max_tokens: 1_200,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) {
          answer = content.trim();
          synthesized = true;
        }
      }
    } catch {
      // Fall back to the successful individual model answers.
    }
  }

  if (!answer) {
    answer = good.map((item: any) => `[${item.model}]\n${item.content}`).join("\n\n");
  }
  return json(200, {
    answer,
    synthesized,
    models: answers.map((item: any) => ({
      model: item.model,
      ok: item.ok,
      ...(!item.ok ? { error: item.error } : {}),
    })),
    successfulModels: good.length,
  });
});
