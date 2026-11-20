import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { modelRoute, normalizeHistory } from "../_shared/model-routing.ts";
import { resolvePublishableKey } from "../_shared/agent-permissions.ts";

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
  if (req.method !== "POST") return json(405, { error: "POST_REQUIRED" });

  const url = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
  const publishable = resolvePublishableKey((name) => Deno.env.get(name));
  const providerKey = Deno.env.get("LOVABLE_API_KEY")?.trim() ?? "";
  const authorization = req.headers.get("Authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) return json(401, { error: "SIGN_IN_REQUIRED" });
  if (!url || !publishable) return json(503, { error: "AUTH_CONFIGURATION_MISSING" });

  let identity: Response;
  try {
    identity = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: publishable, Authorization: authorization },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return json(503, { error: "AUTH_SERVICE_UNAVAILABLE" });
  }
  if (!identity.ok) return json(401, { error: "SESSION_INVALID_OR_EXPIRED" });

  let input: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json(400, { error: "INVALID_REQUEST_BODY" });
    input = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: "INVALID_JSON" });
  }

  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!message || message.length > 12_000) return json(400, { error: "MESSAGE_LENGTH_INVALID" });
  if (!providerKey) return json(503, { error: "AI_PROVIDER_NOT_CONFIGURED", detail: "Add LOVABLE_API_KEY to Supabase Edge Function secrets." });

  const task = input.taskType;
  const history = normalizeHistory(input.history);
  const route = modelRoute(task);
  const endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const requestId = crypto.randomUUID();
  let lastFailure = "MODEL_REQUEST_FAILED";

  for (let index = 0; index < route.length; index++) {
    const model = route[index];
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${providerKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [...history, { role: "user", content: message }],
          max_tokens: 1_200,
        }),
        signal: AbortSignal.timeout(28_000),
      });
      if (!response.ok) {
        lastFailure = `MODEL_PROVIDER_HTTP_${response.status}`;
        continue;
      }
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        lastFailure = "MODEL_EMPTY_RESPONSE";
        continue;
      }
      return json(200, {
        requestId,
        answer: content.trim(),
        model,
        fallbackUsed: index > 0,
        successful: true,
      });
    } catch (error) {
      lastFailure = error instanceof Error && error.name === "TimeoutError"
        ? "MODEL_TIMEOUT"
        : "MODEL_NETWORK_ERROR";
    }
  }

  return json(502, { requestId, error: "ALL_MODELS_FAILED", detail: lastFailure, attemptedModels: route });
});
