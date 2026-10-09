import { z } from "zod";
import { create_new_tool } from "@/core/tool-factory";

export const pathSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]{1,48}$/),
  description: z.string().min(1).max(500),
  entrypoint: z.string().min(1).max(120),
  enabled: z.boolean().default(true),
});
export const commandSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]{1,48}$/),
  description: z.string().min(1).max(500),
  action: z.string().min(1).max(120),
  params: z.record(z.string(), z.unknown()).default({}),
  requiresApproval: z.boolean().default(true),
});
export type AgentPath = z.infer<typeof pathSchema> & { version: number };
export type AgentCommandDefinition = z.infer<typeof commandSchema> & { version: number };

export function createPath(input: unknown): AgentPath {
  return { ...pathSchema.parse(input), version: 1 };
}
export function createCommand(input: unknown): AgentCommandDefinition {
  return { ...commandSchema.parse(input), version: 1 };
}
export function updateManifest(paths: AgentPath[], commands: AgentCommandDefinition[]) {
  return { version: 1, updatedAt: new Date().toISOString(), paths, commands };
}

export async function scaffoldPathTool(path: AgentPath, actor: string) {
  const code = `export const path = ${JSON.stringify(path, null, 2)} as const;\nexport async function run(input: unknown) { return { ok: true, path: path.name, input }; }\n`;
  return create_new_tool({ toolName: `path-${path.name}`, code, deploy: false }, actor);
}

export function createUpdatePlan(currentVersion: string, targetVersion: string, files: string[]) {
  return {
    currentVersion,
    targetVersion,
    files: files.filter((file) => /^src\/[A-Za-z0-9_./-]+$/.test(file)).slice(0, 100),
    strategy: "stage-review-then-apply",
    rollback: true,
  };
}
