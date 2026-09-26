import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CF_API = "https://connector-gateway.lovable.dev/cloudflare/client/v4";
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-2.5-flash";

function keys() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const cf = process.env["CLOUDFLARE_API_KEY"];
  if (!lovable || !cf) throw new Error("Missing Cloudflare or AI credentials");
  return { lovable, cf };
}

async function accountId(k: { lovable: string; cf: string }) {
  const r = await fetch(`${CF_API}/accounts`, {
    headers: { Authorization: `Bearer ${k.lovable}`, "X-Connection-Api-Key": k.cf },
  });
  if (!r.ok) throw new Error(`Cloudflare accounts failed [${r.status}]: ${await r.text()}`);
  const j = (await r.json()) as { result: { id: string }[] };
  if (!j.result?.[0]) throw new Error("No Cloudflare account found");
  return j.result[0].id;
}

async function screenshot(url: string, scripts: string[]) {
  const k = keys();
  const acc = await accountId(k);
  const body: Record<string, unknown> = {
    url,
    viewport: { width: 1280, height: 800 },
    gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
  };
  if (scripts.length) {
    body["addScriptTag"] = [
      {
        content: `(async()=>{const w=t=>new Promise(r=>setTimeout(r,t));${scripts
          .map((s) => `try{${s}}catch(e){console.error(e)};await w(800);`)
          .join("")}})();`,
      },
    ];
    body["waitForTimeout"] = 800 * scripts.length + 1200;
  }
  let r: Response | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
  r = await fetch(`${CF_API}/accounts/${acc}/browser-rendering/screenshot`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${k.lovable}`,
      "X-Connection-Api-Key": k.cf,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (r.status !== 429) break;
  await new Promise((res) => setTimeout(res, 11000));
  }
  if (!r) throw new Error("Cloud browser unavailable");
  if (r.status === 429) throw new Error("متصفح Cloudflare مشغول (حد الخطة المجانية)، حاول بعد دقيقة");
  if (!r.ok) throw new Error(`Cloud browser failed [${r.status}]: ${await r.text()}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return `data:image/png;base64,${btoa(bin)}`;
}

async function ai(prompt: string, image: string, json: boolean) {
  const { lovable } = keys();
  const r = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovable}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: AI_MODEL,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    }),
  });
  if (r.status === 429) throw new Error("AI rate limit reached, try again shortly");
  if (r.status === 402) throw new Error("AI credits exhausted");
  if (!r.ok) throw new Error(`AI failed [${r.status}]: ${await r.text()}`);
  const j = (await r.json()) as { choices: { message: { content: string } }[] };
  return j.choices[0]?.message.content ?? "";
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
