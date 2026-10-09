export type ScheduledJob = {
  id?: string;
  name: string;
  instruction: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  nextRunAt?: string | null;
};

export function validateCron(cron: string) {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error("صيغة الجدولة يجب أن تحتوي على 5 خانات cron");
  return cron.trim();
}

export function scheduleJob(input: Omit<ScheduledJob, "id">): ScheduledJob {
  return {
    ...input,
    cron: validateCron(input.cron),
    name: input.name.trim().slice(0, 120),
    instruction: input.instruction.trim().slice(0, 4000),
    timezone: input.timezone || "Africa/Cairo",
  };
}
