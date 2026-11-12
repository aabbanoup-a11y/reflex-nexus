import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function cloudflareConfig() {
  const account = process.env["CLOUDFLARE_ACCOUNT_ID"]?.trim();
  const token = process.env["CLOUDFLARE_API_TOKEN"]?.trim();
  if (!account || !token) throw new Error("CLOUDFLARE_ACCOUNT_ID و CLOUDFLARE_API_TOKEN غير مضبوطين في بيئة الخادم");
  return { account, token };
}

async function screenshot(url: string, scripts: string[]) {
  const { account, token } = cloudflareConfig();
  const body: Record<string, unknown> = {
    url,
    viewport: { width: 1280, height: 800 },
    gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
  };
  if (scripts.length) {
    body["addScriptTag"] = [{
      content: `(async()=>{const w=t=>new Promise(r=>setTimeout(r,t));${scripts.map((script) => `try{${script}}catch(e){console.error(e)};await w(800);`).join("")}})();`,
    }];
    body["waitForTimeout"] = 800 * scripts.length + 1200;
  }
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/browser-rendering/screenshot`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Cloudflare Browser Rendering failed [${r.status}]: ${(await r.text()).slice(0, 300)}`);
  const bytes = new Uint8Array(await r.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:image/png;base64,${btoa(binary)}`;
}

async function ai(prompt: string, image: string, json: boolean) {
  const network = await import("./network.server");
  const instruction = json
    ? `${prompt}\\nأخرج JSON صالحًا فقط، بلا Markdown أو نص خارج JSON.`
    : prompt;
  let lastError = "";
  for (const model of ["google/gemini-3.8-flash", "anthropic/claude-sonnet-5", "openai/gpt-5.4"]) {
    try {
      return await network.callModel(model, "أنت وكيل متصفح. حلّل لقطة الشاشة ونفّذ المطلوب بدقة.", [
        { role: "user", content: instruction },
      ], undefined, [{ kind: "image", url: image, mime: "image/png", name: "browser-screenshot.png" }]);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(`لم يتوفر نموذج مباشر قادر على تحليل لقطة الشاشة: ${lastError.slice(0, 250)}`);
}

const stepSchema = z.object({
  title: z.string(),
  script: z.string(),
  sensitive: z.boolean(),
});
export type AgentStep = z.infer<typeof stepSchema>;

export const planRun = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ url: z.string().url(), goal: z.string().min(3).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const shot = await screenshot(data.url, []);
    const raw = await ai(
      `You are a browser agent. Page URL: ${data.url}. User goal: "${data.goal}".
Look at the screenshot and produce a plan of at most 5 steps. Each step is plain browser JavaScript run inside the page (use document.querySelector, .click(), setting input .value and dispatching 'input' events, window.scrollBy, location.href). No external libraries.
Mark "sensitive": true for any step that submits forms, types data, logs in, buys, deletes, or navigates to another site.
Return JSON: {"summary": string, "steps": [{"title": string, "script": string, "sensitive": boolean}]}. Titles in the user's language.`,
      shot,
      true,
    );
    const parsed = z
      .object({ summary: z.string(), steps: z.array(stepSchema).max(5) })
      .parse(JSON.parse(raw.replace(/^```json|```$/g, "").trim()));
    return { screenshot: shot, ...parsed };
  });

export const runStep = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ url: z.string().url(), goal: z.string(), scripts: z.array(z.string()).min(1).max(5) }).parse(d),
  )
  .handler(async ({ data }) => {
    const shot = await screenshot(data.url, data.scripts);
    const observation = await ai(
      `Goal: "${data.goal}". Briefly (1-2 sentences, in the goal's language) describe what this screenshot shows after the last action and whether the goal looks achieved.`,
      shot,
      false,
    );
    return { screenshot: shot, observation };
  });

// قراءة نص صفحة حقيقية عبر Cloudflare Browser Rendering (قراءة فقط) لأي مساعد.
export const browsePage = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    const k = keys();
    const acc = await accountId(k);
    let r: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      r = await fetch(`${CF_API}/accounts/${acc}/browser-rendering/markdown`, {
        method: "POST",
        headers: { Authorization: `Bearer ${k.lovable}`, "X-Connection-Api-Key": k.cf, "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url, gotoOptions: { waitUntil: "networkidle0", timeout: 30000 } }),
      });
      if (r.status !== 429) break;
      await new Promise((res) => setTimeout(res, 11000));
    }
    if (!r || r.status === 429) throw new Error("المتصفح السحابي مشغول، جرّب بعد دقيقة");
    if (!r.ok) throw new Error(`فشل فتح الصفحة [${r.status}]`);
    const j = (await r.json()) as { result?: string };
    return { text: String(j.result ?? "").slice(0, 12000) };
  });
