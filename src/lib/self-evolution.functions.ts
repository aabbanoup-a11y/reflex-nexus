import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudAuth } from "@/integrations/supabase/runtime-auth";
import {
  commandSchema,
  createCommand,
  createPath,
  createUpdatePlan,
  pathSchema,
  scaffoldPathTool,
} from "@/core/self-evolution";

const pathInput = pathSchema;
const commandInput = commandSchema;

export const createAgentPath = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((value) => pathInput.parse(value))
  .handler(async ({ context, data }) => {
    const path = createPath(data);
    const db = context.supabase as any;
    const { data: row, error } = await db
      .from("agent_paths")
      .insert({
        user_id: context.userId,
        name: path.name,
        description: path.description,
        entrypoint: path.entrypoint,
        enabled: path.enabled,
        version: path.version,
      })
      .select("id,name,description,entrypoint,enabled,version,created_at")
      .single();
    if (error) throw new Error(error.message);
    const tool = await scaffoldPathTool(path, `user:${context.userId}`);
    return { path: row, tool };
  });

export const registerAgentCommand = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((value) => commandInput.parse(value))
  .handler(async ({ context, data }) => {
    const command = createCommand(data);
    const db = context.supabase as any;
    const { data: row, error } = await db
      .from("agent_commands")
      .insert({
        user_id: context.userId,
        name: command.name,
        description: command.description,
        action: command.action,
        params: command.params,
        requires_approval: command.requiresApproval,
        version: command.version,
      })
      .select("id,name,description,action,params,requires_approval,version,created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const planSelfUpdate = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((value) =>
    z
      .object({
        currentVersion: z.string(),
        targetVersion: z.string(),
        files: z.array(z.string()).max(100),
      })
      .parse(value),
  )
  .handler(async ({ context, data }) => {
    const plan = createUpdatePlan(data.currentVersion, data.targetVersion, data.files);
    const db = context.supabase as any;
    const { data: row, error } = await db
      .from("agent_updates")
      .insert({
        user_id: context.userId,
        current_version: plan.currentVersion,
        target_version: plan.targetVersion,
        files: plan.files,
        strategy: plan.strategy,
        rollback_enabled: plan.rollback,
        status: "planned",
      })
      .select("id,current_version,target_version,files,strategy,rollback_enabled,status,created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
