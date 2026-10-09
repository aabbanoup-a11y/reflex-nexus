export type DiscoverySnapshot = {
  installedApps: Array<{ package: string; label?: string }>;
  models: string[];
  trendingTools: string[];
};

export type IntegrationRecord = {
  name: string;
  kind: "android-app" | "model" | "tool";
  source: string;
  discoveredAt: string;
};

export async function dailyDiscovery(snapshot: DiscoverySnapshot, known: string[] = []) {
  const knownSet = new Set(known);
  const records: IntegrationRecord[] = [];
  for (const app of snapshot.installedApps)
    if (!knownSet.has(`app:${app.package}`))
      records.push({
        name: app.label ?? app.package,
        kind: "android-app",
        source: app.package,
        discoveredAt: new Date().toISOString(),
      });
  for (const model of snapshot.models)
    if (!knownSet.has(`model:${model}`))
      records.push({
        name: model,
        kind: "model",
        source: model,
        discoveredAt: new Date().toISOString(),
      });
  for (const tool of snapshot.trendingTools)
    if (!knownSet.has(`tool:${tool}`))
      records.push({
        name: tool,
        kind: "tool",
        source: tool,
        discoveredAt: new Date().toISOString(),
      });
  return {
    discovered: records,
    commands: records.map((r) => ({
      action: `integration:${r.name}`,
      params: { source: r.source },
      fallback: "create_tool" as const,
    })),
  };
}

export function cloudflareCronWorker() {
  return `export default { async scheduled(controller, env, ctx) { await env.INTEGRATION_MESH.fetch("https://internal/discovery", { method: "POST", headers: { "x-cron": controller.cron } }); } };`;
}
