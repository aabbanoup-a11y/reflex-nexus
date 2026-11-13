import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: cors });
const env = (name: string) => Deno.env.get(name)?.trim() ?? "";
const missing = (...names: string[]) => names.filter((name) => !env(name));

async function requireOwner(req: Request) {
  const url = env("SUPABASE_URL");
  const anon = env("SUPABASE_ANON_KEY") || env("SUPABASE_PUBLISHABLE_KEY");
  const owner = env("AGENT_OWNER_USER_ID");
  if (!url || !anon || !owner) throw new Error("SERVER_SETUP_MISSING");
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const userRes = await fetch(url + "/auth/v1/user", {
    headers: { apikey: anon, Authorization: authorization },
  });
  if (!userRes.ok) throw new Error("UNAUTHORIZED");
  const user = await userRes.json();
  if (user.id !== owner) throw new Error("FORBIDDEN");
  return { user, url, authorization };
}

function safePath(path: string) {
  const p = path.replace(/^\/+/, "");
  if (!p || p.includes("..") || p.includes("\\") || /^https?:/i.test(p)) {
    throw new Error("INVALID_PATH");
  }
  return p;
}

async function github(action: string, input: any) {
  const token = env("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_NOT_CONFIGURED");
  const repo = String(input.repo ?? "");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error("INVALID_REPOSITORY");
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch("https://api.github.com/" + path, {
      ...init, headers: { ...headers, ...(init.headers ?? {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error("GITHUB_" + response.status + ": " + String(data.message ?? "request failed").slice(0, 180));
    return data;
  };
  const branch = "agent-work";
  if (action === "github.read") {
    const path = safePath(String(input.path ?? ""));
    const info = await request(`repos/${repo}`);
    let refName = branch;
    try { await request(`repos/${repo}/git/ref/heads/${branch}`); }
    catch { refName = String(info.default_branch ?? "main"); }
    const data = await request(`repos/${repo}/contents/${path}?ref=${encodeURIComponent(refName)}`);
    if (Array.isArray(data)) return data.map((f: any) => ({ name: f.name, path: f.path, type: f.type, size: f.size }));
    const binary = atob(String(data.content ?? "").replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return { path, ref: refName, content: new TextDecoder().decode(bytes).slice(0, 30000), sha: data.sha, html_url: data.html_url };
  }
  if (action === "github.write" || action === "github.delete") {
    const path = safePath(String(input.path ?? ""));
    if (action === "github.delete" && input.confirmDestructive !== true) throw new Error("CONFIRM_DESTRUCTIVE_REQUIRED");
    const info = await request(`repos/${repo}`);
    let ref: any;
    try { ref = await request(`repos/${repo}/git/ref/heads/${branch}`); }
    catch {
      const base = await request(`repos/${repo}/git/ref/heads/${info.default_branch}`);
      await request(`repos/${repo}/git/refs`, {
        method: "POST", body: JSON.stringify({ ref: "refs/heads/" + branch, sha: base.object.sha }),
      });
    }
    let current: any = null;
    try { current = await request(`repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`); } catch { /* new file */ }
    if (action === "github.delete" && !current?.sha) throw new Error("FILE_NOT_FOUND");
    const message = String(input.message ?? (action === "github.delete" ? "Agent delete " : "Agent update ") + path).slice(0, 200);
    const body: any = { message, branch };
    if (action === "github.delete") body.sha = current.sha;
    else {
      if (typeof input.content !== "string") throw new Error("CONTENT_REQUIRED");
      const bytes = new TextEncoder().encode(input.content);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      body.content = btoa(binary);
      if (current?.sha) body.sha = current.sha;
    }
    const result = await request(`repos/${repo}/contents/${path}`, {
      method: action === "github.delete" ? "DELETE" : "PUT",
      body: JSON.stringify(body),
    });
    return { path, branch, commit: result.commit?.sha, url: result.commit?.html_url };
  }
  throw new Error("UNSUPPORTED_GITHUB_ACTION");
}

async function cloudflare(input: any) {
  const token = env("CLOUDFLARE_API_TOKEN");
  const account = env("CLOUDFLARE_ACCOUNT_ID");
  if (!token || !account) throw new Error("CLOUDFLARE_NOT_CONFIGURED");
  const path = safePath(String(input.path ?? ""));
  if (path.startsWith("user/") || path.startsWith("accounts/") && !path.startsWith("accounts/" + account + "/") && path !== "accounts/" + account) {
    throw new Error("CLOUDFLARE_SCOPE_DENIED");
  }
  if (path.startsWith("workers/scripts/abanoupai-local-first-scheduler")) throw new Error("SCHEDULER_EXCLUDED");
  const method = String(input.method ?? "GET").toUpperCase();
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) throw new Error("INVALID_METHOD");
  if (method === "DELETE" && input.confirmDestructive !== true) throw new Error("CONFIRM_DESTRUCTIVE_REQUIRED");
  const apiPath = path.startsWith("accounts/") || path.startsWith("zones/")
    ? path
    : "accounts/" + account + "/" + path;
  const response = await fetch("https://api.cloudflare.com/client/v4/" + apiPath, {
    method,
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    ...(method === "GET" || method === "DELETE" || input.body === undefined ? {} : { body: JSON.stringify(input.body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error("CLOUDFLARE_" + response.status + ": " + JSON.stringify(data.errors ?? "request failed").slice(0, 250));
  return data.result ?? data;
}

async function supabaseRest(action: string, input: any, auth: { url: string }) {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
  const table = String(input.table ?? "");
  if (!/^[a-z_][a-z0-9_]*$/.test(table)) throw new Error("INVALID_TABLE");
  const query = new URLSearchParams();
  for (const [column, value] of Object.entries(input.filters ?? {})) {
    if (!/^[a-z_][a-z0-9_]*$/.test(column) || typeof value !== "string") throw new Error("INVALID_FILTER");
    query.set(column, "eq." + value);
  }
  const method = action === "supabase.read" ? "GET" : action === "supabase.insert" ? "POST" : action === "supabase.update" ? "PATCH" : "DELETE";
  if (method === "DELETE" && input.confirmDestructive !== true) throw new Error("CONFIRM_DESTRUCTIVE_REQUIRED");
  if (["PATCH", "DELETE"].includes(method) && !Object.keys(input.filters ?? {}).length) throw new Error("FILTER_REQUIRED");
  if (method === "GET") query.set("limit", String(Math.min(Math.max(Number(input.limit) || 25, 1), 100)));
  const response = await fetch(auth.url + "/rest/v1/" + table + (query.size ? "?" + query.toString() : ""), {
    method,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      "Accept-Profile": "public",
      "Content-Profile": "public",
    },
    ...(method === "GET" || method === "DELETE" ? {} : { body: JSON.stringify(input.data ?? {}) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("SUPABASE_" + response.status + ": " + String(data.message ?? data.hint ?? "request failed").slice(0, 220));
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "POST_REQUIRED" });
  try {
    const owner = await requireOwner(req);
    const input = await req.json();
    const action = String(input.action ?? "");
    let result: unknown;
    if (action === "status") {
      result = {
        github: Boolean(env("GITHUB_TOKEN")),
        cloudflare: Boolean(env("CLOUDFLARE_API_TOKEN") && env("CLOUDFLARE_ACCOUNT_ID")),
        supabaseAdmin: Boolean(env("SUPABASE_SERVICE_ROLE_KEY")),
        ownerAuthenticated: true,
      };
    } else if (action.startsWith("github.")) result = await github(action, input);
    else if (action === "cloudflare.request") result = await cloudflare(input);
    else if (action.startsWith("supabase.")) result = await supabaseRest(action, input, owner);
    else return reply(400, { error: "UNKNOWN_ACTION" });
    return reply(200, { ok: true, action, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "SERVER_SETUP_MISSING" ? 503 : message.endsWith("_NOT_CONFIGURED") ? 503 : message === "CONFIRM_DESTRUCTIVE_REQUIRED" ? 409 : 400;
    return reply(status, { ok: false, error: message });
  }
});
