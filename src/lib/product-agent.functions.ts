import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudAuth } from "@/integrations/supabase/runtime-auth";
import { normalizeCommand, commandToCompanion } from "@/core/command-protocol";
import { create_new_tool } from "@/core/tool-factory";

const commandInput = z.object({ command: z.unknown() });
const toolInput = z.object({
  toolName: z.string(),
  code: z.string(),
  deploy: z.boolean().default(false),
});
const artifactInput = z.object({
  kind: z.string(),
  name: z.string(),
  mime: z.string(),
  url: z.string().optional(),
  preview: z.string().optional(),
  status: z.string().default("queued"),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const executeProductCommand = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((input) => commandInput.parse(input))
  .handler(async ({ context, data }) => {
    const command = normalizeCommand(data.command);
    if (command.action === "create_tool") {
      const result = await create_new_tool(
        {
          toolName: String(command.params["toolName"] ?? "custom-tool"),
          code: String(command.params["code"] ?? ""),
          repo: "aabbanoup-a11y/reflex-nexus",
          deploy: false,
        },
        "Product Agent",
      );
      return { ok: true, action: command.action, result };
    }
    const mapped = commandToCompanion(command);
    // The generated Supabase types do not include the migration added in this commit.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
    const { data: device } = await db
      .from("companion_devices")
      .select("id,status")
      .eq("user_id", context.userId)
      .eq("platform", "android")
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (!device) throw new Error("لا يوجد هاتف مربوط حاليًا");
    const { data: row, error } = await db
      .from("companion_commands")
      .insert({
        device_id: device.id,
        user_id: context.userId,
        kind: mapped.kind,
        payload: mapped.payload,
        requires_approval: false,
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .select("id,kind,status,created_at")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, action: command.action, command: row, deviceStatus: device.status };
  });

export const createProductTool = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((input) => toolInput.parse(input))
  .handler(async ({ context, data }) => {
    const toolName = data["toolName"];
    const code = data["code"];
    const result = await create_new_tool(
      { toolName, code, deploy: data["deploy"], repo: "aabbanoup-a11y/reflex-nexus" },
      `user:${context.userId}`,
    );
    // The generated Supabase types do not include the migration added in this commit.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
    const { error } = await db.from("agent_tools").insert({
      user_id: context.userId,
      name: toolName,
      path: result.registry.path,
      source: code,
      status: "proposed",
      metadata: result,
    });
    if (error) throw new Error(error.message);
    return result;
  });

export const registerArtifact = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((input) => artifactInput.parse(input))
  .handler(async ({ context, data }) => {
    // The generated Supabase types do not include the migration added in this commit.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = context.supabase as any;
    const { data: row, error } = await db
      .from("artifacts")
      .insert({
        user_id: context.userId,
        kind: data["kind"],
        name: data["name"],
        mime: data["mime"],
        url: data["url"] ?? null,
        preview: data["preview"] ?? null,
        status: data["status"],
        metadata: data["metadata"],
      })
      .select("id,kind,name,mime,url,preview,status,created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
