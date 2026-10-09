export interface Env { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; INTEGRATION_MESH_URL?: string; }
type CronEvent = Record<string, unknown>;
type WorkerContext = { waitUntil: (promise: Promise<unknown>) => void };

export default {
  async scheduled(_event: CronEvent, env: Env, ctx: WorkerContext) {
    ctx.waitUntil(runScheduledJobs(env));
  },
  async fetch() { return new Response("AbanoupAi local-first scheduler is ready", { status: 200 }); },
};

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
