import { z } from "zod";

export const ACTIONS = [
  "open_app",
  "tap",
  "type_text",
  "swipe",
  "screenshot",
  "getScreenText",
  "download",
  "install_apk",
  "create_tool",
] as const;
export type CommandAction = (typeof ACTIONS)[number];
export const commandSchema = z.object({
  action: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
  fallback: z.literal("create_tool").default("create_tool"),
});
export type AgentCommand = z.infer<typeof commandSchema>;
export type CommandResult = {
  ok: boolean;
  action: string;
  message: string;
  data?: unknown;
  needsTool?: boolean;
};
const aliases: Record<string, CommandAction> = {
  tap_text: "tap",
  tap_coordinates: "tap",
  type_text_submit: "type_text",
  download_file: "download",
  screen_text: "getScreenText",
  read_screen: "getScreenText",
};

export function normalizeCommand(input: unknown): AgentCommand {
  const parsed = commandSchema.parse(input);
  return { ...parsed, action: aliases[parsed.action] ?? parsed.action };
}
export function commandToCompanion(command: AgentCommand): {
  kind: string;
  payload: Record<string, unknown>;
} {
  const p = normalizeCommand(command).params;
  switch (command.action) {
    case "open_app":
      return { kind: "open_app", payload: { package: p["package"] ?? p["app"] ?? "" } };
    case "tap":
      return { kind: "tap_coordinates", payload: { x: p["x"] ?? 0, y: p["y"] ?? 0 } };
    case "type_text":
      return {
        kind: "type_text",
        payload: { text: String(p["text"] ?? ""), ...(p["submit"] ? { submit: true } : {}) },
      };
    case "swipe":
      return {
        kind: "swipe",
        payload: {
          x1: p["x1"] ?? 0,
          y1: p["y1"] ?? 0,
          x2: p["x2"] ?? 0,
          y2: p["y2"] ?? 0,
          duration: p["duration"] ?? 350,
        },
      };
    case "screenshot":
      return { kind: "screenshot", payload: {} };
    case "getScreenText":
      return { kind: "screen_text", payload: { ocr: true } };
    case "download":
      return { kind: "download_file", payload: { url: p["url"] ?? "" } };
    case "install_apk":
      return { kind: "open_file", payload: { path: p["path"] ?? p["url"] ?? "" } };
    default:
      throw new Error(`لا يوجد محول للهاتف للأمر: ${command.action}`);
  }
}
export function parseCommandText(text: string): AgentCommand {
  try {
    return normalizeCommand(JSON.parse(text));
  } catch {
    /* text command */
  }
  const t = text.trim();
  if (/^(افتح|open)/i.test(t))
    return {
      action: "open_app",
      params: { package: t.replace(/^(افتح|open)\s*/i, "") },
      fallback: "create_tool",
    };
  if (/^(اكتب|type)/i.test(t))
    return {
      action: "type_text",
      params: { text: t.replace(/^(اكتب|type)\s*/i, "") },
      fallback: "create_tool",
    };
  return { action: "create_tool", params: { requestedCommand: t }, fallback: "create_tool" };
}
export function unknownCommand(command: AgentCommand): CommandResult {
  return {
    ok: false,
    action: command.action,
    message: `الأمر ${command.action} غير مسجل؛ يلزم إنشاء أداة جديدة.`,
    needsTool: true,
  };
}
