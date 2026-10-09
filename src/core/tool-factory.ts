import { z } from "zod";
import { ghWrite, cfWrite, checkRepo } from "@/lib/network.server";

const inputSchema = z.object({
  toolName: z.string().regex(/^[a-z][a-z0-9-]{1,48}$/),
  code: z.string().min(1).max(120_000),
  repo: z.string().default("aabbanoup-a11y/reflex-nexus"),
  deploy: z.boolean().default(false),
});

export type ToolFactoryInput = z.input<typeof inputSchema>;

export async function create_new_tool(input: ToolFactoryInput, actor = "Product Agent") {
  const data = inputSchema.parse(input);
  const repo = checkRepo(data.repo);
  const path = `tools/${data.toolName}.ts`;
  const link = await ghWrite(repo, path, data.code, actor);
  const registry = {
    name: data.toolName,
    path,
    repo,
    branch: "ai-team",
    createdAt: new Date().toISOString(),
  };
  let deploy: string = JSON.stringify({ status: "skipped", reason: "deploy=false" });
  if (data.deploy) {
    // Only deploy through the existing allowlisted Workers endpoint. Never execute arbitrary code here.
    deploy = await cfWrite(
      `workers/scripts/${data.toolName}`,
      "PUT",
      JSON.stringify({
        script: data.code,
        metadata: { source: "reflex-nexus", branch: "ai-team" },
      }),
    );
  }
  return { ok: true, registry, githubUrl: link ?? null, deploy };
}

export async function createToolFromUnknownCommand(requestedCommand: string) {
  const safeName =
    requestedCommand
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "custom-tool";
  const code = `// Generated scaffold for: ${requestedCommand}\nexport async function run(input: unknown) {\n  return { ok: false, status: "needs-implementation", input };\n}\n`;
  return create_new_tool({ toolName: safeName, code, deploy: false });
}
