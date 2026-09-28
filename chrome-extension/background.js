// AbanoubAI Companion — Chrome extension service worker.
// Listens to Lovable Cloud Realtime for approved commands on this device only (RLS-scoped via user token).
const SUPABASE_URL = "https://c--f343cb8e-77bb-41d3-b7e1-5d6f7dc4998f-prod.lovable.cloud";
const KEY = "sb_publishable_F8v4MSocHPMF0RSQpbZFvw_-DivRfUB";
let ws = null, hb = null, ref = 1;

const get = () => chrome.storage.local.get(["session", "deviceId", "enabled"]);

async function refresh() {
  const { session } = await get();
  if (!session?.refresh_token) return null;
  if (session.expires_at && session.expires_at * 1000 > Date.now() + 120000) return session;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!r.ok) return null;
  const s = await r.json();
  const next = { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at, user_id: s.user?.id ?? session.user_id };
  await chrome.storage.local.set({ session: next });
  return next;
}

async function rest(path, method, body) {
  const s = await refresh();
  if (!s) throw new Error("no session");
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
}

async function logEvent(cmd, type, message) {
  const { deviceId, session } = await get();
  await rest("companion_events", "POST", { command_id: cmd?.id ?? null, device_id: deviceId, user_id: session.user_id, event_type: type, message: String(message ?? "").slice(0, 2000) }).catch(() => {});
}

async function setStatus(id, status, error) {
  const patch = { status };
  if (status === "running") patch.started_at = new Date().toISOString();
  if (status === "done" || status === "failed") patch.finished_at = new Date().toISOString();
  if (error) patch.error = String(error).slice(0, 1000);
  await rest(`companion_commands?id=eq.${id}`, "PATCH", patch).catch(() => {});
}

async function activeTab() {
  const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return t;
}

async function run(cmd) {
  const { enabled } = await get();
  if (!enabled && cmd.kind !== "stop") return;
  if (cmd.status !== "approved") return;
  await setStatus(cmd.id, "running");
  try {
    const p = cmd.payload || {};
    let result = "ok";
    switch (cmd.kind) {
      case "open_chrome": await chrome.tabs.create({}); break;
      case "open_url":
        if (!/^https?:\/\//i.test(p.url || "")) throw new Error("رابط غير صالح");
        await chrome.tabs.create({ url: p.url }); result = p.url; break;
      case "back": { const t = await activeTab(); await chrome.tabs.goBack(t.id); break; }
      case "tap_text": case "type_text": {
        const t = await activeTab();
        const [{ result: r }] = await chrome.scripting.executeScript({
          target: { tabId: t.id }, args: [cmd.kind, String(p.text || "").slice(0, 500)],
          func: (kind, text) => {
            if (kind === "type_text") {
              const el = document.activeElement;
              if (!el || !("value" in el)) return "لا يوجد حقل مُركّز";
              el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); return "typed";
            }
            const nodes = [...document.querySelectorAll("a,button,[role=button],input[type=submit],label")];
            const n = nodes.find((x) => (x.innerText || x.value || "").trim().includes(text));
            if (!n) return "لم يتم العثور على النص";
            n.click(); return "clicked";
          },
        });
        result = r; break;
      }
      case "screenshot": {
        const url = await chrome.tabs.captureVisibleTab(undefined, { format: "jpeg", quality: 40 });
        result = url; break;
      }
      case "stop": await chrome.storage.local.set({ enabled: false }); result = "stopped"; break;
    }
    await logEvent(cmd, cmd.kind === "screenshot" ? "screenshot" : "done", result);
    await setStatus(cmd.id, "done");
  } catch (e) {
    await logEvent(cmd, "error", e.message);
    await setStatus(cmd.id, "failed", e.message);
  }
}

async function connect() {
  const { deviceId, enabled } = await get();
  const s = await refresh();
  if (!s || !deviceId || !enabled || (ws && ws.readyState <= 1)) return;
  ws = new WebSocket(`${SUPABASE_URL.replace("https", "wss")}/realtime/v1/websocket?apikey=${KEY}&vsn=1.0.0`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ topic: `realtime:companion-${deviceId}`, event: "phx_join", ref: String(ref++), payload: {
      access_token: s.access_token,
      config: { postgres_changes: [{ event: "*", schema: "public", table: "companion_commands", filter: `device_id=eq.${deviceId}` }] },
    } }));
    clearInterval(hb);
    hb = setInterval(() => ws?.readyState === 1 && ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(ref++) })), 25000);
    rest(`companion_devices?id=eq.${deviceId}`, "PATCH", { status: "online", last_seen_at: new Date().toISOString() }).catch(() => {});
  };
  ws.onmessage = (m) => {
    try {
      const j = JSON.parse(m.data);
      const rec = j.event === "postgres_changes" && j.payload?.data?.record;
      if (rec && (j.payload.data.type === "INSERT" || j.payload.data.type === "UPDATE")) run(rec);
    } catch {}
  };
  ws.onclose = () => { ws = null; clearInterval(hb); };
}

async function disconnect() {
  const { deviceId } = await get();
  await chrome.storage.local.set({ enabled: false });
  if (deviceId) await rest(`companion_devices?id=eq.${deviceId}`, "PATCH", { status: "offline" }).catch(() => {});
  ws?.close(); ws = null;
}

chrome.runtime.onMessageExternal.addListener((msg, _sender, reply) => {
  (async () => {
    if (msg?.type === "pair" && msg.session && msg.deviceId) {
      await chrome.storage.local.set({ session: msg.session, deviceId: msg.deviceId, enabled: true });
      await connect(); reply({ ok: true });
    } else if (msg?.type === "ping") {
      const { deviceId, enabled } = await get(); reply({ ok: true, deviceId, enabled });
    } else reply({ ok: false });
  })();
  return true;
});
chrome.runtime.onMessage.addListener((msg, _s, reply) => {
  (async () => {
    if (msg?.type === "stop") await disconnect();
    if (msg?.type === "start") { await chrome.storage.local.set({ enabled: true }); await connect(); }
    reply(await get().then((x) => ({ enabled: x.enabled, paired: !!x.deviceId })));
  })();
  return true;
});
chrome.alarms.create("keepalive", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(() => connect());
chrome.runtime.onStartup.addListener(() => connect());
connect();
