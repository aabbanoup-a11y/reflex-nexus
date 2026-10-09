type AiBinding = { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };
export interface Env { SUPABASE_URL: string; SUPABASE_PUBLISHABLE_KEY: string; SUPABASE_SERVICE_ROLE_KEY: string; INTEGRATION_MESH_URL?: string; AI: AiBinding; AI_GATEWAY_TOKEN?: string; }
type CronEvent = Record<string, unknown>;
type WorkerContext = { waitUntil: (promise: Promise<unknown>) => void };

export default {
  async scheduled(_event: CronEvent, env: Env, ctx: WorkerContext) {
    ctx.waitUntil(runScheduledJobs(env));
  },
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/ai/chat" && request.method === "POST") return runAiChat(request, env);
    return new Response("AbanoupAi local-first scheduler is ready", { status: 200 });
  },
};

async function runAiChat(request: Request, env: Env) {
  if (!(await isAuthorized(request, env))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { model?: string; messages?: unknown[]; max_tokens?: number } | null;
  const model = body?.model?.startsWith("@cf/") ? body.model : "@cf/meta/llama-3.2-1b-instruct";
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-24) : [];
  const result = await env.AI.run(model, { messages, max_tokens: Math.min(Math.max(body?.max_tokens ?? 800, 1), 2000) });
  return Response.json({ result, model });
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

async function runScheduledJobs(env: Env) {
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
  const url = `${env.SUPABASE_URL}/rest/v1/scheduled_jobs?status=eq.active&next_run_at=lte.${encodeURIComponent(new Date().toISOString())}&select=id,name,command,cron`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`scheduled_jobs ${response.status}`);
  const jobs = await response.json() as Array<{ id: string; name: string; command: string; cron: string }>;
  for (const job of jobs) {
    if (env.INTEGRATION_MESH_URL) await fetch(env.INTEGRATION_MESH_URL, { method: "POST", headers, body: JSON.stringify({ source: "cloudflare-cron", job }) });
    await fetch(`${env.SUPABASE_URL}/rest/v1/scheduled_jobs?id=eq.${job.id}`, { method: "PATCH", headers, body: JSON.stringify({ last_run_at: new Date().toISOString(), last_result: `Cloudflare cron executed: ${job.command}`, next_run_at: nextDaily(job.cron).toISOString() }) });
  }
}

function nextDaily(cron: string) { const parts = cron.split(/\s+/); const d = new Date(Date.now() + 86_400_000); d.setHours(Number(parts[1]) || 3, Number(parts[0]) || 0, 0, 0); return d; }
