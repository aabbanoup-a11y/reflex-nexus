import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudAuth } from "@/integrations/supabase/runtime-auth";
import { commandSchema, createCommand, createPath, createUpdatePlan, pathSchema, scaffoldPathTool } from "@/core/self-evolution";

const PathInput = z.object({ name: z.string().min(1).max(120), description: z.string().max(1000).default(""), entry_point: z.string().min(1).max(120).default("local") });
const CommandInput = z.object({ path_id: z.string().uuid().optional(), name: z.string().min(1).max(120), description: z.string().max(1000).default(""), command: z.string().min(1).max(10000) });
const JobInput = z.object({ name: z.string().min(1).max(120), cron: z.string().min(1).max(100), command: z.string().min(1).max(10000) });

export const createAgentPath = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((i: unknown) => PathInput.parse(i)).handler(async ({ data, context }) => {
  const db = context.supabase as any; const rowInput = { ...data, entrypoint: data.entry_point, enabled: true, version: 1, user_id: context.userId };
  const { data: row, error } = await db.from("agent_paths").insert(rowInput).select().single(); if (error) throw new Error(error.message);
  return { path: row, tool: await scaffoldPathTool({ ...createPath({ name: data.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 48) || "path", description: data.description || "local path", entrypoint: data.entry_point, enabled: true }), version: 1 }, `user:${context.userId}`) };
});

export const createAgentCommand = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((i: unknown) => CommandInput.parse(i)).handler(async ({ data, context }) => {
  const db = context.supabase as any; const rowInput = { user_id: context.userId, path_id: data.path_id, name: data.name, description: data.description, command: data.command, action: data.command, params: {}, requires_approval: false, version: 1 };
  const { data: row, error } = await db.from("agent_commands").insert(rowInput).select().single(); if (error) throw new Error(error.message); return row;
});

export const registerAgentCommand = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((value: unknown) => commandSchema.parse(value)).handler(async ({ context, data }) => {
  const command = createCommand(data); const db = context.supabase as any;
  const { data: row, error } = await db.from("agent_commands").insert({ user_id: context.userId, name: command.name, description: command.description, action: command.action, command: command.action, params: command.params, requires_approval: command.requiresApproval, version: command.version }).select().single();
  if (error) throw new Error(error.message); return row;
});

export const createScheduledJob = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((i: unknown) => JobInput.parse(i)).handler(async ({ data, context }) => {
  const { data: row, error } = await (context.supabase as any).from("scheduled_jobs").insert({ ...data, instruction: data.command, user_id: context.userId, status: "active", enabled: true, next_run_at: new Date().toISOString() }).select().single(); if (error) throw new Error(error.message); return row;
});

export const planSelfUpdate = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((value: unknown) => z.object({ currentVersion: z.string(), targetVersion: z.string(), files: z.array(z.string()).max(100) }).parse(value)).handler(async ({ context, data }) => {
  const plan = createUpdatePlan(data.currentVersion, data.targetVersion, data.files); const { data: row, error } = await (context.supabase as any).from("agent_updates").insert({ user_id: context.userId, current_version: plan.currentVersion, target_version: plan.targetVersion, version: plan.targetVersion, summary: `Update ${plan.currentVersion} → ${plan.targetVersion}`, files: plan.files, strategy: plan.strategy, rollback_enabled: plan.rollback, status: "planned" }).select().single(); if (error) throw new Error(error.message); return row;
});

export const rollbackAgentUpdate = createServerFn({ method: "POST" }).middleware([requireCloudAuth]).inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i)).handler(async ({ data, context }) => {
  const db = context.supabase as any; const { data: current, error: readError } = await db.from("agent_updates").select("*").eq("id", data.id).eq("user_id", context.userId).single(); if (readError) throw new Error(readError.message);
  const { data: row, error } = await db.from("agent_updates").insert({ user_id: context.userId, version: `rollback-${current.version || current.target_version}`, summary: `Rollback: ${current.summary || current.target_version}`, current_version: current.target_version || "current", target_version: current.current_version || "previous", files: current.files ?? [], strategy: "rollback", rollback_enabled: true, status: "rolled_back", rollback_of: current.id }).select().single(); if (error) throw new Error(error.message); return row;
});
