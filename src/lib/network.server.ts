import { MANAGER_ID, NET_MODELS, REPOS, WORK_BRANCH } from "./models30";

type Msg = { role: "user" | "assistant"; content: string };
const CF = "https://connector-gateway.lovable.dev/cloudflare/client/v4";
const GH = "https://connector-gateway.lovable.dev/github";
const AIG = "https://ai.gateway.lovable.dev/v1";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} مش متضاف`);
  return v;
}

let accCache = "";
async function cfAccount() {
  if (accCache) return accCache;
  const r = await fetch(`${CF}/accounts`, { headers: cfHeaders() });
  if (!r.ok) throw new Error(`Cloudflare ${r.status}: ${await r.text()}`);
  accCache = ((await r.json()) as any).result[0].id;
  return accCache;
}
const cfHeaders = () => ({
  Authorization: `Bearer ${env("LOVABLE_API_KEY")}`,
  "X-Connection-Api-Key": env("CLOUDFLARE_API_KEY"),
  "Content-Type": "application/json",
});

async function sse(body: ReadableStream<Uint8Array>, on: (e: any) => void) {
  const rd = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await rd.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const l of lines) {
      if (!l.startsWith("data:")) continue;
      const p = l.slice(5).trim();
      if (!p || p === "[DONE]") continue;
      try {
        on(JSON.parse(p));
      } catch {
        /* partial */
      }
    }
  }
}

export async function callModel(id: string, system: string, messages: Msg[]): Promise<string> {
  if (id.startsWith("local/")) id = "cf/@cf/meta/llama-3.1-8b-instruct-fast";
  const key = env("LOVABLE_API_KEY");
  let text = "";
  if (id.startsWith("cf/")) {
    const acc = await cfAccount();
    const r = await fetch(`${CF}/accounts/${acc}/ai/run/${id.slice(3)}`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify({ messages: [{ role: "system", content: system }, ...messages], max_tokens: 1500 }),
    });
    if (!r.ok) throw new Error(`${r.status}:${(await r.text()).slice(0, 200)}`);
    const j = (await r.json()) as any;
    text = String(j?.result?.choices?.[0]?.message?.content ?? j?.result?.response ?? "");
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  } else if (id.startsWith("openai/")) {
    const r = await fetch(`${AIG}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: id,
        stream: true,
        store: false,
        input: [
          { role: "system", content: [{ type: "input_text", text: system }] },
          ...messages.map((m) => ({ role: m.role, content: [{ type: m.role === "assistant" ? "output_text" : "input_text", text: m.content }] })),
        ],
      }),
    });
    if (!r.ok || !r.body) throw new Error(`${r.status}:${(await r.text()).slice(0, 200)}`);
    await sse(r.body, (e) => {
      if (e.type === "response.output_text.delta" && typeof e.delta === "string") text += e.delta;
    });
  } else if (id.startsWith("anthropic/")) {
    const r = await fetch(`${AIG}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: id, max_tokens: 4000, stream: true, system, messages }),
    });
    if (!r.ok || !r.body) throw new Error(`${r.status}:${(await r.text()).slice(0, 200)}`);
    let refused = false;
    await sse(r.body, (e) => {
      if (e.type === "content_block_delta" && e.delta?.type === "text_delta") text += e.delta.text;
      if (e.type === "message_delta" && e.delta?.stop_reason === "refusal") refused = true;
    });
    if (refused) throw new Error("refusal");
  } else {
    const r = await fetch(`${AIG}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: id, stream: true, messages: [{ role: "system", content: system }, ...messages] }),
    });
    if (!r.ok || !r.body) throw new Error(`${r.status}:${(await r.text()).slice(0, 200)}`);
    await sse(r.body, (e) => {
      const d = e?.choices?.[0]?.delta?.content;
      if (typeof d === "string") text += d;
    });
  }
  if (!text.trim()) throw new Error("empty");
  return text.trim();
}

// ---------- Browser (Cloudflare Browser Rendering) ----------
export async function browse(url: string) {
  const u = new URL(url);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("رابط غير صالح");
  const acc = await cfAccount();
  const base = `${CF}/accounts/${acc}/browser-rendering`;
  const post = async (path: string) => {
    for (let i = 0; i < 3; i++) {
      const r = await fetch(`${base}/${path}`, { method: "POST", headers: cfHeaders(), body: JSON.stringify({ url: u.href }) });
      if (r.status !== 429) return r;
      await new Promise((res) => setTimeout(res, 10000));
    }
    throw new Error("متصفح Cloudflare مشغول، جرّب بعد دقيقة");
  };
  const c = await post("content");
  if (!c.ok) throw new Error(`المتصفح فشل (${c.status})`);
  const html = String(((await c.json()) as any)?.result ?? "");
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  const txt = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000);
  let shot: string | undefined;
  const s = await post("screenshot").catch(() => null);
  if (s?.ok) {
    const b = new Uint8Array(await s.arrayBuffer());
    let bin = "";
    for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
    shot = `data:image/png;base64,${btoa(bin)}`;
  }
  return { text: `العنوان: ${title}\n${txt}`, shot };
}

// ---------- GitHub (work branch only) ----------
const ghHeaders = () => ({
  Authorization: `Bearer ${env("LOVABLE_API_KEY")}`,
  "X-Connection-Api-Key": env("GITHUB_API_KEY"),
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
});
async function gh(path: string, init?: RequestInit) {
  const r = await fetch(`${GH}/${path}`, { ...init, headers: ghHeaders() });
  const body = (await r.json().catch(() => ({}))) as any;
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${body?.message ?? ""}`);
  return body;
}
export function checkRepo(repo: string) {
  const r = REPOS.find((x) => x.toLowerCase() === repo.toLowerCase() || x.split("/")[1]!.toLowerCase() === repo.toLowerCase());
  if (!r) throw new Error(`مسموح بس: ${REPOS.join(" و ")}`);
  return r;
}
const b64 = (s: string) => {
  const by = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < by.length; i += 0x8000) bin += String.fromCharCode(...by.subarray(i, i + 0x8000));
  return btoa(bin);
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
  const body = await gh(`repos/${repo}/contents/${path}`);
  return Array.isArray(body) ? body.map((f: any) => `${f.type === "dir" ? "📁" : "📄"} ${f.path}`).join("\n") : unb64(body.content ?? "").slice(0, 12000);
}

export async function ghWrite(repoIn: string, path: string, content: string, by: string) {
  const repo = checkRepo(repoIn);
  if (!path) throw new Error("لازم اسم ملف");
  await ensureBranch(repo);
  let sha: string | undefined;
  try {
    sha = (await gh(`repos/${repo}/contents/${path}?ref=${WORK_BRANCH}`)).sha;
  } catch {
    sha = undefined;
  }
  const r = await gh(`repos/${repo}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message: `${by}: تعديل ${path}`, content: b64(content), branch: WORK_BRANCH, ...(sha ? { sha } : {}) }),
  });
  return r?.commit?.html_url as string | undefined;
}

export async function ghMerge(repoIn: string) {
  const repo = checkRepo(repoIn);
  const info = await gh(`repos/${repo}`);
  const pulls = await gh(`repos/${repo}/pulls?head=${repo.split("/")[0]}:${WORK_BRANCH}&state=open`);
  const pr =
    pulls[0] ??
    (await gh(`repos/${repo}/pulls`, {
      method: "POST",
      body: JSON.stringify({ title: "تعديلات فريق الـ30 نموذج", head: WORK_BRANCH, base: info.default_branch }),
    }));
  await gh(`repos/${repo}/pulls/${pr.number}/merge`, { method: "PUT", body: JSON.stringify({ merge_method: "merge" }) });
  return pr.html_url as string;
}

export const knownModel = (id: string) => id === MANAGER_ID || NET_MODELS.some((m) => m.id === id);
