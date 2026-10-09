import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudAuth } from "@/integrations/supabase/runtime-auth";

const PathInput = z.object({ name: z.string().min(1).max(120), description: z.string().max(1000).default(""), entry_point: z.string().min(1).max(120).default("local") });
const CommandInput = z.object({ path_id: z.string().uuid().optional(), name: z.string().min(1).max(120), description: z.string().max(1000).default(""), command: z.string().min(1).max(10000) });
const JobInput = z.object({ name: z.string().min(1).max(120), cron: z.string().min(1).max(100), command: z.string().min(1).max(10000) });

export const createAgentPath = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((i: unknown) => PathInput.parse(i)).handler(async ({ data, context }) => {
  const { data: row, error } = await (context.supabase as any).from("agent_paths").insert({ ...data, user_id: context.userId }).select().single();
  if (error) throw new Error(error.message);
  return row;
});

export const createAgentCommand = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((i: unknown) => CommandInput.parse(i)).handler(async ({ data, context }) => {
  const { data: row, error } = await (context.supabase as any).from("agent_commands").insert({ ...data, user_id: context.userId }).select().single();
  if (error) throw new Error(error.message);
  return row;
});

export const createScheduledJob = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((i: unknown) => JobInput.parse(i)).handler(async ({ data, context }) => {
  const { data: row, error } = await (context.supabase as any).from("scheduled_jobs").insert({ ...data, user_id: context.userId, status: "active", next_run_at: new Date().toISOString() }).select().single();
  if (error) throw new Error(error.message);
  return row;
});

export const rollbackAgentUpdate = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i)).handler(async ({ data, context }) => {
  const db = context.supabase as any;
  const { data: current, error: readError } = await db.from("agent_updates").select("id,version,summary,files").eq("id", data.id).eq("user_id", context.userId).single();
  if (readError) throw new Error(readError.message);
  const { data: row, error } = await db.from("agent_updates").insert({ user_id: context.userId, version: `rollback-${current.version}`, summary: `Rollback: ${current.summary}`, files: current.files ?? [], status: "rolled_back", rollback_of: current.id }).select().single();
  if (error) throw new Error(error.message);
  return row;
});
