type Db = { from: (table: string) => any };

type ScheduledJob = { id: string; name: string; cron: string; command: string; status: string; next_run_at: string; };

function nextRun(cron: string, from: Date) {
  const parts = cron.trim().split(/\s+/);
  const next = new Date(from.getTime() + 60_000);
  if (parts.length === 5 && parts[0] !== "*" && parts[1] !== "*") {
    next.setHours(Number(parts[1]) || 0, Number(parts[0]) || 0, 0, 0);
    if (next <= from) next.setDate(next.getDate() + 1);
    return next;
  }
  if (parts.length === 5 && parts[0] !== "*") {
    next.setSeconds(0, 0);
    next.setMinutes(Number(parts[0]) || 0);
    if (next <= from) next.setHours(next.getHours() + 1);
    return next;
  }
  return next;
}

async function executeLocalCommand(command: string) {
  const text = command.trim();
  if (text.startsWith("notify:") && typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification("AbanoupAi — مهمة مجدولة", { body: text.slice(7).trim() || "تم تنفيذ المهمة" });
  }
  return `تم التنفيذ المحلي: ${text.slice(0, 500)}`;
}

export async function runDueScheduledJobs(db: Db, now = new Date()) {
  const { data: jobs, error } = await db.from("scheduled_jobs").select("id,name,cron,command,status,next_run_at").eq("status", "active").lte("next_run_at", now.toISOString()).limit(25);
  if (error) throw new Error(error.message);
  const results: string[] = [];
  for (const job of (jobs ?? []) as ScheduledJob[]) {
    const result = await executeLocalCommand(job.command);
    const next = nextRun(job.cron, now);
    await db.from("scheduled_jobs").update({ last_run_at: now.toISOString(), next_run_at: next.toISOString(), last_result: result }).eq("id", job.id);
    results.push(`${job.name}: ${result}`);
  }
  return results;
}

export function startLocalScheduler(db: Db) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await runDueScheduledJobs(db); } catch (error) { console.error("local scheduler", error); } finally { running = false; }
  };
  void tick();
  const timer = window.setInterval(() => void tick(), 60_000);
  return () => window.clearInterval(timer);
}
