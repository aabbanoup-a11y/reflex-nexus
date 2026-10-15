type AiBinding = { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  INTEGRATION_MESH_URL?: string;
  AI: AiBinding;
  AI_GATEWAY_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/ai/chat" && request.method === "POST") return runAiChat(request, env);
    return new Response("AbanoubAi cloud gateway is ready", { status: 200 });
  },
};

async function runAiChat(request: Request, env: Env) {
  if (!(await isAuthorized(request, env))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { model?: string; messages?: unknown[]; max_tokens?: number } | null;
  const model = body?.model?.startsWith("@cf/") ? body.model : "@cf/meta/llama-3.2-1b-instruct";
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-24) : [];
  const result = await env.AI.run(model, { messages, max_tokens: Math.min(Math.max(body?.max_tokens ?? 800, 1), 2000) });
  return Response.json({ result, model, scheduled_jobs: false });
}

async function isAuthorized(request: Request, env: Env) {
  const authorization = request.headers.get("authorization") ?? "";
  if (env.AI_GATEWAY_TOKEN && authorization === `Bearer ${env.AI_GATEWAY_TOKEN}`) return true;
  if (!authorization.startsWith("Bearer ") || !env.SUPABASE_PUBLISHABLE_KEY) return false;
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: authorization },
  });
  return response.ok;
}
