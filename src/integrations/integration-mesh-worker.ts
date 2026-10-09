export interface Env {
  INTEGRATION_MESH_URL: string;
  INTEGRATION_MESH_SECRET: string;
}
type ScheduledController = { cron: string };

export default {
  async scheduled(controller: ScheduledController, env: Env) {
    if (controller.cron !== "0 3 * * *") return;
    await fetch(env.INTEGRATION_MESH_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-integration-cron": env.INTEGRATION_MESH_SECRET,
      },
      body: JSON.stringify({ source: "cloudflare-cron", at: new Date().toISOString() }),
    });
  },
};
