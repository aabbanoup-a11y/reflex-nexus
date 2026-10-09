import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudAuth } from "@/integrations/supabase/runtime-auth";
import { scheduleJob } from "@/core/scheduler";

const input = z.object({
  name: z.string().min(1).max(120),
  instruction: z.string().min(1).max(4000),
  cron: z.string().min(9).max(120),
  timezone: z.string().default("Africa/Cairo"),
  enabled: z.boolean().default(true),
});

export const listScheduledJobs = createServerFn({ method: "GET" })
  .middleware([requireCloudAuth])
  .handler(async ({ context }) => {
    // The generated Supabase types predate the scheduled_jobs migration.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
    const { data, error } = await db
      .from("scheduled_jobs")
      .select("id,name,instruction,cron,timezone,enabled,next_run_at,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createScheduledJob = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((value) => input.parse(value))
  .handler(async ({ context, data }) => {
    const job = scheduleJob(data);
    // The generated Supabase types predate the scheduled_jobs migration.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
    const { data: row, error } = await db
      .from("scheduled_jobs")
      .insert({ user_id: context.userId, ...job })
      .select("id,name,instruction,cron,timezone,enabled,next_run_at,created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleScheduledJob = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((value) => z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(value))
  .handler(async ({ context, data }) => {
    // The generated Supabase types predate the scheduled_jobs migration.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
    const { data: row, error } = await db
      .from("scheduled_jobs")
      .update({ enabled: data.enabled })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("id,enabled")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
