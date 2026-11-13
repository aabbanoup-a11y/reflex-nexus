import { MANAGER_ID, NET_MODELS, REPOS, WORK_BRANCH } from "./models30";

type Msg = { role: "user" | "assistant"; content: string };
function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`متغير الاتصال ${name} غير مضبوط في بيئة الخادم`);
  return value;
}

function optionalEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export function integrationStatus() {
  return {
    github: Boolean(optionalEnv("GITHUB_TOKEN")),
    cloudflare: Boolean(optionalEnv("CLOUDFLARE_API_TOKEN") && optionalEnv("CLOUDFLARE_ACCOUNT_ID")),
    supabaseAdmin: Boolean(optionalEnv("SUPABASE_URL") && optionalEnv("SUPABASE_SERVICE_ROLE_KEY") && optionalEnv("AGENT_OWNER_USER_ID")),
    models: {
      cloudflare: Boolean(optionalEnv("CLOUDFLARE_API_TOKEN") && optionalEnv("CLOUDFLARE_ACCOUNT_ID")),
      openai: Boolean(optionalEnv("OPENAI_API_KEY")),
      anthropic: Boolean(optionalEnv("ANTHROPIC_API_KEY")),
      google: Boolean(optionalEnv("GOOGLE_AI_API_KEY")),
    },
  };
}

type ModelPart = { kind: "image" | "file"; url: string; mime: string; name: string };

function dataUrl(url: string) {
  const match = url.match(/^data:([^;,]+);base64,([\s\S]+)$/);
  return match ? { mime: match[1]!, data: match[2]! } : null;
}

export async function callModel(id: string, system: string, messages: Msg[], _accessToken?: string, parts: ModelPart[] = []): Promise<string> {
  const model = id.startsWith("local/") ? "@cf/meta/llama-3.1-8b-instruct-fast" : id.replace(/^(cf|openai|anthropic|google)\//, "");
  const lastIndex = messages.length - 1;
  let text = "";

  if (id.startsWith("cf/") || id.startsWith("local/")) {
    const conversation = messages.map((message, index) => {
      if (index !== lastIndex || message.role !== "user" || !parts.some((part) => part.kind === "image")) return message;
      return {
        role: message.role,
        content: [
          { type: "text", text: message.content },
          ...parts.filter((part) => part.kind === "image").map((part) => ({ type: "image_url", image_url: { url: part.url } })),
        ],
      };
    });
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccount()}/ai/run/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env("CLOUDFLARE_API_TOKEN")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "system", content: system }, ...conversation], max_tokens: 1800 }),
    });
    const payload = await r.json().catch(() => ({})) as any;
    if (!r.ok || payload.success === false) throw new Error(`Cloudflare AI ${r.status}: ${JSON.stringify(payload.errors ?? payload).slice(0, 250)}`);
    text = String(payload.result?.response ?? payload.result?.choices?.[0]?.message?.content ?? "");
  } else if (id.startsWith("openai/")) {
    const input = messages.map((m, i) => {
      if (i !== lastIndex || m.role !== "user" || !parts.length) return m;
      return { role: m.role, content: [{ type: "text", text: m.content }, ...parts.filter((p) => p.kind === "image").map((p) => ({ type: "image_url", image_url: { url: p.url } }))] };
    });
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, ...input], max_tokens: 1800 }),
    });
    const payload = await r.json().catch(() => ({})) as any;
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${String(payload.error?.message ?? "").slice(0, 250)}`);
    text = String(payload.choices?.[0]?.message?.content ?? "");
  } else if (id.startsWith("anthropic/")) {
    const input = messages.map((m, i) => {
      if (i !== lastIndex || m.role !== "user" || !parts.length) return m;
      const content: any[] = [{ type: "text", text: m.content }];
      for (const part of parts) {
        const encoded = dataUrl(part.url);
        if (!encoded) continue;
        if (part.kind === "image" && encoded.mime.startsWith("image/")) content.push({ type: "image", source: { type: "base64", media_type: encoded.mime, data: encoded.data } });
        else if (part.kind === "file" && encoded.mime === "application/pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: encoded.data } });
      }
      return { role: m.role, content };
    });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model, system, messages: input, max_tokens: 1800 }),
    });
    const payload = await r.json().catch(() => ({})) as any;
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${String(payload.error?.message ?? "").slice(0, 250)}`);
    text = (payload.content ?? []).filter((x: any) => x.type === "text").map((x: any) => x.text).join("\n");
  } else if (id.startsWith("google/")) {
    const contents = messages.map((m, i) => {
      const contentParts: any[] = [{ text: m.content }];
      if (i === lastIndex && m.role === "user") {
        for (const part of parts) {
          const encoded = dataUrl(part.url);
          if (encoded) contentParts.push({ inlineData: { mimeType: encoded.mime, data: encoded.data } });
        }
      }
      return { role: m.role === "assistant" ? "model" : "user", parts: contentParts };
    });
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env("GOOGLE_AI_API_KEY"))}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 1800 } }),
    });
    const payload = await r.json().catch(() => ({})) as any;
    if (!r.ok) throw new Error(`Google AI ${r.status}: ${String(payload.error?.message ?? "").slice(0, 250)}`);
    text = (payload.candidates?.[0]?.content?.parts ?? []).map((x: any) => x.text ?? "").join("");
  } else {
    throw new Error("مزود النموذج غير مدعوم في الاتصال المباشر");
  }
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  if (!text) throw new Error("النموذج رجّع ردًا فارغًا");
  return text;
}

function cfAccount() {
  return env("CLOUDFLARE_ACCOUNT_ID");
}

const cfHeaders = () => ({
  Authorization: `Bearer ${env("CLOUDFLARE_API_TOKEN")}`,
  "Content-Type": "application/json",
});

function cfResourceUrl(path: string) {
  const normalized = path.replace(/^\/+/, "");
  if (normalized.startsWith("zones/") || normalized === "zones") return "https://api.cloudflare.com/client/v4/" + normalized;
  if (normalized.startsWith("accounts/")) return "https://api.cloudflare.com/client/v4/" + normalized;
  return "https://api.cloudflare.com/client/v4/accounts/" + cfAccount() + "/" + normalized;
}

export async function cfGet(path: string) {
  if (path.includes("..") || path.startsWith("http") || path.includes("\\")) throw new Error("مسار Cloudflare غير صالح");
  const normalized = path.replace(/^\/+/, "");
  if (normalized.startsWith("accounts/") && normalized !== "accounts/" + cfAccount() && !normalized.startsWith("accounts/" + cfAccount() + "/")) throw new Error("لا يمكن الوصول إلى حساب Cloudflare آخر");
  if (normalized.startsWith("user/")) throw new Error("مسارات المستخدم العامة غير متاحة من موصل الحساب");
  const response = await fetch(cfResourceUrl(normalized), { headers: cfHeaders() });
  const payload = await response.json().catch(() => ({})) as any;
  if (!response.ok || payload.success === false) throw new Error("Cloudflare " + response.status + ": " + JSON.stringify(payload.errors ?? payload).slice(0, 500));
  return JSON.stringify(payload.result ?? payload).slice(0, 12000);
}

export async function cfWrite(path: string, method: string, body: string) {
  if (path.includes("..") || path.startsWith("http") || path.includes("\\")) throw new Error("مسار Cloudflare غير صالح");
  const normalized = path.replace(/^\/+/, "");
  if (normalized.startsWith("accounts/") && normalized !== "accounts/" + cfAccount() && !normalized.startsWith("accounts/" + cfAccount() + "/")) throw new Error("لا يمكن تعديل حساب Cloudflare آخر");
  if (normalized.startsWith("user/")) throw new Error("مسارات المستخدم العامة غير متاحة من موصل الحساب");
  const verb = method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(verb)) throw new Error("طريقة HTTP غير مدعومة");
  const parsed = body.trim() ? JSON.parse(body) as Record<string, unknown> : {};
  if (normalized.startsWith("workers/scripts/abanoupai-local-first-scheduler")) throw new Error("عامل الجدولة مؤجل ولا يتم تعديله ضمن هذه المهمة.");
  const url = cfResourceUrl(normalized);
  let response: Response;
  if (normalized.startsWith("workers/scripts/") && verb === "PUT") {
    const script = String(parsed.script ?? "");
    if (!script) throw new Error("بيانات Worker تحتاج حقل script");
    const mainModule = String(parsed.main_module ?? "worker.js");
    const metadata = { main_module: mainModule, compatibility_date: String(parsed.compatibility_date ?? "2026-11-12"), bindings: Array.isArray(parsed.bindings) ? parsed.bindings : [] };
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append(mainModule, new Blob([script], { type: "application/javascript+module" }), mainModule);
    response = await fetch(url, { method: "PUT", headers: { Authorization: "Bearer " + env("CLOUDFLARE_API_TOKEN") }, body: form });
  } else {
    response = await fetch(url, { method: verb, headers: cfHeaders(), ...(verb === "DELETE" || !body.trim() ? {} : { body: JSON.stringify(parsed) }) });
  }
  const payload = await response.json().catch(() => ({})) as any;
  if (!response.ok || payload.success === false) throw new Error("Cloudflare " + response.status + ": " + JSON.stringify(payload.errors ?? payload).slice(0, 500));
  return JSON.stringify(payload.result ?? payload).slice(0, 12000);
}

// ---------- Browser (Cloudflare Browser Rendering, direct API) ----------
export async function browse(url: string) {
  const u = new URL(url);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("رابط غير صالح");
  const base = `https://api.cloudflare.com/client/v4/accounts/${cfAccount()}/browser-rendering`;
  const post = async (endpoint: string) => {
    const r = await fetch(`${base}/${endpoint}`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify({ url: u.href, gotoOptions: { waitUntil: "networkidle0", timeout: 30000 } }),
    });
    if (!r.ok) throw new Error(`Cloudflare Browser ${r.status}: ${(await r.text()).slice(0, 250)}`);
    return r;
  };
  const content = await post("markdown");
  const payload = await content.json() as any;
  const text = String(payload.result ?? "").slice(0, 12000);
  let shot: string | undefined;
  try {
    const r = await post("screenshot");
    const bytes = new Uint8Array(await r.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    shot = `data:image/png;base64,${btoa(binary)}`;
  } catch { /* screenshot is optional */ }
  return { text, shot };
}

// ---------- GitHub REST API (direct token; work branch only) ----------
const ghHeaders = () => ({
  Authorization: `Bearer ${env("GITHUB_TOKEN")}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Content-Type": "application/json",
});
async function gh(path: string, init?: RequestInit) {
  const r = await fetch(`https://api.github.com/${path.replace(/^\/+/, "")}`, { ...init, headers: { ...ghHeaders(), ...(init?.headers ?? {}) } });
  const payload = await r.json().catch(() => ({})) as any;
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${String(payload.message ?? "").slice(0, 300)}`);
  return payload;
}
export function checkRepo(repo: string) {
  const r = REPOS.find((x) => x.toLowerCase() === repo.toLowerCase() || x.split("/")[1]!.toLowerCase() === repo.toLowerCase());
  if (!r) throw new Error(`مسموح بس: ${REPOS.join(" و ")}`);
  return r;
}
const b64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const unb64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

async function ensureBranch(repo: string) {
  try {
    await gh(`repos/${repo}/git/ref/heads/${WORK_BRANCH}`);
  } catch {
    const info = await gh(`repos/${repo}`);
    const main = await gh(`repos/${repo}/git/ref/heads/${info.default_branch}`);
    await gh(`repos/${repo}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${WORK_BRANCH}`, sha: main.object.sha }) });
  }
}

export async function ghRead(repoIn: string, path: string) {
  const repo = checkRepo(repoIn);
  const target = path ? `repos/${repo}/contents/${path}?ref=${WORK_BRANCH}` : `repos/${repo}/contents?ref=${WORK_BRANCH}`;
  const payload = await gh(target);
  return Array.isArray(payload) ? payload.map((f: any) => `${f.type === "dir" ? "📁" : "📄"} ${f.path}`).join("\n") : unb64(payload.content ?? "").slice(0, 12000);
}

export async function ghWrite(repoIn: string, path: string, content: string, by: string) {
  const repo = checkRepo(repoIn);
  if (!path || path.startsWith("/") || path.split("/").includes("..")) throw new Error("مسار الملف غير صالح");
  await ensureBranch(repo);
  let sha: string | undefined;
  try { sha = (await gh(`repos/${repo}/contents/${path}?ref=${WORK_BRANCH}`)).sha; } catch { sha = undefined; }
  const result = await gh(`repos/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message: `${by}: update ${path}`, content: b64(content), branch: WORK_BRANCH, ...(sha ? { sha } : {}) }),
  });
  return result?.commit?.html_url as string | undefined;
}

async function ghGraphQL(query: string, variables: Record<string, unknown>) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: ghHeaders(),
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json().catch(() => ({})) as any;
  if (!response.ok || payload.errors?.length) throw new Error("GitHub GraphQL: " + JSON.stringify(payload.errors ?? payload).slice(0, 500));
  return payload.data;
}

export async function ghMerge(repoIn: string) {
  const repo = checkRepo(repoIn);
  const build = await latestBuild(repo);
  if (build.status !== "success") throw new Error(`لن يتم الدمج قبل نجاح اختبارات البناء. الحالة الحالية: ${build.status}. ${build.link ?? ""}`);
  const info = await gh(`repos/${repo}`);
  const pulls = await gh(`repos/${repo}/pulls?head=${repo.split("/")[0]}:${WORK_BRANCH}&state=open`);
  const pr = pulls[0] ?? await gh(`repos/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title: "AbanoubAI autonomous update", head: WORK_BRANCH, base: info.default_branch, draft: false }),
  });
  const fullPr = await gh(`repos/${repo}/pulls/${pr.number}`);
  if (fullPr.draft) {
    await ghGraphQL(
      "mutation($id: ID!) { markPullRequestReadyForReview(input: { pullRequestId: $id }) { pullRequest { isDraft } } }",
      { id: fullPr.node_id },
    );
  }
  const merged = await gh(`repos/${repo}/pulls/${pr.number}/merge`, {
    method: "PUT",
    body: JSON.stringify({ merge_method: "squash" }),
  });
  if (!merged.merged) throw new Error("GitHub لم يؤكد الدمج: " + String(merged.message ?? "unknown"));
  return { url: pr.html_url as string, merged: true, merge_commit_sha: merged.sha as string, build: build.link };
}

export async function latestBuild(repoIn: string) {
  const repo = checkRepo(repoIn);
  const branch = await gh(`repos/${repo}/git/ref/heads/${WORK_BRANCH}`);
  const headSha = branch.object.sha as string;
  let run: any;
  for (let attempt = 0; attempt < 8; attempt++) {
    const runs = await gh(`repos/${repo}/actions/runs?branch=${WORK_BRANCH}&per_page=20`);
    run = (runs.workflow_runs ?? []).find((r: any) => r.head_sha === headSha && r.name === "Reflex Nexus CI and Android APK");
    if (run && run.status === "completed") break;
    if (attempt < 7) await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  if (!run) return { status: "queued", text: "التعديل موجود على فرع الاختبار، لكن GitHub Actions لم ينشئ تشغيل البناء بعد." };
  if (run.status !== "completed") return { status: run.status, text: `البناء ${run.status} للنسخة ${headSha.slice(0, 8)}. افتح سجل البناء لمتابعته.`, link: run.html_url };
  const artifacts = await gh(`repos/${repo}/actions/runs/${run.id}/artifacts`);
  const apk = (artifacts.artifacts ?? []).find((a: any) => a.name === "abanoubai-companion-debug-apk" && !a.expired);
  const web = (artifacts.artifacts ?? []).find((a: any) => a.name === "reflex-nexus-web-build" && !a.expired);
  return {
    status: run.conclusion,
    text: `نتيجة البناء: ${run.conclusion}. رقم التشغيل: ${run.run_number}. ${apk ? "حزمة APK متاحة." : ""} ${web ? "حزمة الويب متاحة." : ""}`,
    link: run.conclusion === "success" ? (apk?.archive_download_url ?? web?.archive_download_url ?? run.html_url) : run.html_url,
    runUrl: run.html_url,
  };
}


export async function agentControl(action: string, input: Record<string, unknown>, accessToken: string) {
  const baseUrl = env("SUPABASE_URL");
  const publishableKey = env("SUPABASE_PUBLISHABLE_KEY");
  const allowed = new Set([
    "status", "github.read", "github.write", "github.delete",
    "cloudflare.request", "supabase.read", "supabase.insert", "supabase.update", "supabase.delete",
  ]);
  if (!allowed.has(action)) throw new Error("أداة غير مدعومة");
  const response = await fetch(`${baseUrl.replace(/\\/+$/, "")}/functions/v1/agent-control`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ ...input, action }),
  });
  const payload = await response.json().catch(() => ({})) as any;
  if (!response.ok || payload.ok === false) {
    const message = String(payload.error ?? "فشل تنفيذ أداة التكامل").slice(0, 300);
    throw new Error(`Agent Control ${response.status}: ${message}`);
  }
  return JSON.stringify(payload.result ?? payload).slice(0, 12000);
}

export const knownModel = (id: string) => id === MANAGER_ID || NET_MODELS.some((m) => m.id === id);
