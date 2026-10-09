import {
  commandToCompanion,
  normalizeCommand,
  unknownCommand,
  type AgentCommand,
  type CommandResult,
} from "./command-protocol";

export type ExecutorDeps = {
  queueLegacy: (kind: string, payload: Record<string, unknown>) => Promise<unknown>;
  createTool: (requestedCommand: string) => Promise<unknown>;
};

export async function executeCommand(
  input: AgentCommand | string,
  deps: ExecutorDeps,
): Promise<CommandResult> {
  const command =
    typeof input === "string" ? normalizeCommand(JSON.parse(input)) : normalizeCommand(input);
  if (command.action === "create_tool")
    return {
      ok: true,
      action: command.action,
      message: "جارٍ إنشاء أداة جديدة",
      data: await deps.createTool(String(command.params["requestedCommand"] ?? "طلب غير محدد")),
    };
  try {
    const mapped = commandToCompanion(command);
    return {
      ok: true,
      action: command.action,
      message: "تم إرسال الأمر للهاتف",
      data: await deps.queueLegacy(mapped.kind, mapped.payload),
    };
  } catch {
    if (command.fallback === "create_tool")
      return { ...unknownCommand(command), data: await deps.createTool(command.action) };
    throw new Error(`الأمر غير مدعوم: ${command.action}`);
  }
}
