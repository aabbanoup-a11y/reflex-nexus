import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const commandSchema = z.object({
  deviceId: z.string().uuid(),
  kind: z.enum(["open_chrome", "open_url", "back", "tap_text", "type_text", "screenshot", "stop"]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

const sensitive = new Set(["open_url", "tap_text", "type_text"]);

export const listCompanionDevices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("companion_devices")
      .select("id,device_name,platform,status,last_seen_at,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const queueCompanionCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => commandSchema.parse(input))
  .handler(async ({ context, data }) => {
    if (data.kind === "open_url") {
      const url = typeof data.payload["url"] === "string" ? (data.payload["url"] as string) : "";
      if (!/^https?:\/\//i.test(url)) throw new Error("الرابط يجب أن يبدأ بـ http أو https");
    }
    if (
      data.kind === "type_text" &&
      typeof data.payload["text"] === "string" &&
      (data.payload["text"] as string).length > 500
    ) {
      throw new Error("النص أطول من الحد المسموح");
    }
    const { data: row, error } = await context.supabase
      .from("companion_commands")
      .insert({
        device_id: data.deviceId,
        user_id: context.userId,
        kind: data.kind,
        payload: data.payload,
        requires_approval: sensitive.has(data.kind),
        status: sensitive.has(data.kind) ? "queued" : "approved",
        approved_at: sensitive.has(data.kind) ? null : new Date().toISOString(),
      })
      .select("id,device_id,kind,status,requires_approval,created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const stopCompanion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ deviceId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("companion_commands")
      .insert({
        device_id: data.deviceId,
        user_id: context.userId,
        kind: "stop",
        payload: {},
        status: "approved",
        approved_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
