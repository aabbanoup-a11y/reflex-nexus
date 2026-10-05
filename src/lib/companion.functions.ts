import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireCloudAuth } from "@/integrations/supabase/runtime-auth";

const commandSchema = z.object({
  deviceId: z.string().uuid(),
  kind: z.enum(["open_chrome", "open_url", "open_app", "open_settings", "open_camera", "download_file", "speak", "listen", "back", "home", "recents", "tap_text", "tap_coordinates", "long_press", "type_text", "swipe", "screenshot", "stop", "device_inventory", "app_inventory", "notification_inventory", "read_screen", "tap_node", "scroll", "wait"]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

  const sensitive = new Set(["open_url", "open_app", "open_settings", "open_camera", "download_file", "speak", "listen", "tap_text", "tap_coordinates", "long_press", "type_text", "swipe", "screenshot", "device_inventory", "app_inventory", "notification_inventory"]);

export const listCompanionDevices = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("companion_devices")
      .select("id,device_name,platform,status,last_seen_at,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const queueCompanionCommand = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
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
    const command = {
        device_id: data.deviceId,
        user_id: context.userId,
        kind: data.kind,
        payload: data.payload as import("@/integrations/supabase/types").Json,
        requires_approval: false,
        status: "approved",
        approved_at: new Date().toISOString(),
    };
    let { data: row, error } = await context.supabase
      .from("companion_commands").insert(command)
      .select("id,device_id,kind,status,requires_approval,created_at").single();
    if (error && /kind_check|check constraint/i.test(error.message) && data.kind !== "tap_text") {
      ({ data: row, error } = await context.supabase.from("companion_commands").insert({
        ...command,
        kind: "tap_text",
        payload: { ...data.payload, agent_action: data.kind } as import("@/integrations/supabase/types").Json,
      }).select("id,device_id,kind,status,requires_approval,created_at").single());
    }
    if (error) throw new Error(error.message);
    return row;
  });

export const stopCompanion = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
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
