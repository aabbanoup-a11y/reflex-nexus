export type ScheduledJob = {
  id?: string; name: string; instruction?: string; command?: string; cron: string; timezone?: string;
  enabled?: boolean; status?: string; nextRunAt?: string | null; next_run_at?: string | null;
};
type Db = { from: (table: string) => any };
type DueJob = { id: string; name: string; cron: string; command?: string; instruction?: string; status?: string; enabled?: boolean; next_run_at?: string | null };

export function validateCron(cron: string) {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error("صيغة الجدولة يجب أن تحتوي على 5 خانات cron");
  return cron.trim();
}
export function scheduleJob(input: Omit<ScheduledJob, "id">): ScheduledJob {
  return { ...input, cron: validateCron(input.cron), name: input.name.trim().slice(0, 120), instruction: input.instruction?.trim().slice(0, 4000) ?? "", timezone: input.timezone || "Africa/Cairo" };
}
function nextRun(cron: string, from: Date) {
  const parts = cron.trim().split(/\s+/); const next = new Date(from.getTime() + 60_000);
  if (parts.length === 5 && parts[0] !== "*" && parts[1] !== "*") { next.setHours(Number(parts[1]) || 0, Number(parts[0]) || 0, 0, 0); if (next <= from) next.setDate(next.getDate() + 1); return next; }
  if (parts.length === 5 && parts[0] !== "*") { next.setSeconds(0, 0); next.setMinutes(Number(parts[0]) || 0); if (next <= from) next.setHours(next.getHours() + 1); }
  return next;
}
async function executeLocalCommand(command: string) {
  const text = command.trim();
  if (text.startsWith("notify:") && typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("AbanoupAi — مهمة مجدولة", { body: text.slice(7).trim() || "تم تنفيذ المهمة" });
  return `تم التنفيذ المحلي: ${text.slice(0, 500)}`;
}
export async function runDueScheduledJobs(db: Db, now = new Date()) {
  const { data: jobs, error } = await db.from("scheduled_jobs").select("id,name,cron,command,instruction,status,enabled,next_run_at").or("status.eq.active,enabled.eq.true").lte("next_run_at", now.toISOString()).limit(25);
  if (error) throw new Error(error.message);
  const results: string[] = [];
  for (const job of (jobs ?? []) as DueJob[]) {
    const result = await executeLocalCommand(job.command || job.instruction || ""); const next = nextRun(job.cron, now);
    await db.from("scheduled_jobs").update({ last_run_at: now.toISOString(), next_run_at: next.toISOString(), last_result: result, last_status: result }).eq("id", job.id);
    results.push(`${job.name}: ${result}`);
  }
  return results;
}
export function startLocalScheduler(db: Db) {
  let running = false; const tick = async () => { if (running) return; running = true; try { await runDueScheduledJobs(db); } catch (error) { console.error("local scheduler", error); } finally { running = false; } };
  void tick(); const timer = window.setInterval(() => void tick(), 60_000); return () => window.clearInterval(timer);
}
