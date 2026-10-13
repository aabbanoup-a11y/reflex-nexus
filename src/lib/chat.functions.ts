import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasCrisisSignal } from "./safety";

const Attachment = z.object({ path: z.string().min(1), mime: z.string().min(1), name: z.string().min(1) });

const Input = z.object({
  system: z.string().min(1),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) }))
    .min(1),
  model: z.string().min(1),
  fallbacks: z.array(z.string()).default([]),
  attachments: z.array(Attachment).default([]),
  memories: z.array(z.string()).default([]),
  skipSafety: z.boolean().default(false),
});

export type ChatReply = { text: string; model: string; switched: boolean; crisis?: boolean };
type Msg = { role: "user" | "assistant"; content: string };
type Part = { kind: "image" | "file"; url: string; mime: string; name: string };

const styleHint = "اكتب نص عادي واضح بدون رموز تنسيق زي ** أو ## أو جداول.";

async function readSSE(body: ReadableStream<Uint8Array>, onEvent: (evt: any) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        onEvent(JSON.parse(payload));
      } catch {
        /* partial frame */
      }
    }
  }
}

async function callChat(key: string, model: string, system: string, messages: Msg[], parts: Part[]) {
  const last = messages.length - 1;
  const body = messages.map((m, i) => {
    if (i !== last || parts.length === 0) return m;
    return {
      role: m.role,
      content: [
        { type: "text", text: m.content },
        ...parts.map((p) =>
          p.kind === "image"
            ? { type: "image_url", image_url: { url: p.url } }
            : { type: "file", file: { filename: p.name, file_data: p.url } },
        ),
      ],
    };
  });
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model, stream: true, messages: [{ role: "system", content: `${system}\n${styleHint}` }, ...body] }),
  });
  if (!res.ok || !res.body) throw new Error(`${res.status}:${(await res.text().catch(() => "")).slice(0, 200)}`);
  let text = "";
  await readSSE(res.body, (evt) => {
    const d = evt?.choices?.[0]?.delta?.content;
    if (typeof d === "string") text += d;
  });
  if (!text.trim()) throw new Error("empty");
  return text;
}

async function callResponses(key: string, model: string, system: string, messages: Msg[], parts: Part[]) {
  const last = messages.length - 1;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: [{ type: "input_text", text: `${system}\n${styleHint}` }] },
        ...messages.map((m, i) => ({
          role: m.role,
          content:
            m.role === "assistant"
              ? [{ type: "output_text", text: m.content }]
              : [
                  { type: "input_text", text: m.content },
                  ...(i === last
                    ? parts.map((p) =>
                        p.kind === "image"
                          ? { type: "input_image", image_url: p.url }
                          : { type: "input_file", filename: p.name, file_data: p.url },
                      )
                    : []),
                ],
        })),
      ],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`${res.status}:${(await res.text().catch(() => "")).slice(0, 200)}`);
  let text = "";
  await readSSE(res.body, (evt) => {
    if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") text += evt.delta;
    else if (evt.type === "response.completed" && evt.response?.output_text && !text) text = String(evt.response.output_text);
  });
  if (!text.trim()) throw new Error("empty");
  return text;
}

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}


// يعرّف النموذج السحابي بالـ500 أمر والـ100 مهارة والـ50 مسار من قاعدة البيانات،
// ويسمح له بتنفيذ أي طلب مش موجود في الكتالوج بنفسه.
let catalogCache: { text: string; at: number } | undefined;
async function capabilityCatalogPrompt(admin: any): Promise<string> {
  if (catalogCache && Date.now() - catalogCache.at < 10 * 60_000) return catalogCache.text;
  try {
    const [cmd, skl, pth] = await Promise.all([
      admin.from("command_catalog").select("domain, action, requires_approval").limit(1000),
      admin.from("skill_catalog").select("slug").limit(500),
      admin.from("path_catalog").select("slug").limit(500),
    ]);
    if (cmd.error || skl.error || pth.error) throw cmd.error ?? skl.error ?? pth.error;
    const byDomain = new Map<string, string[]>();
    for (const c of cmd.data ?? []) {
      const list = byDomain.get(c.domain) ?? [];
      list.push(c.requires_approval ? `${c.action}*` : c.action);
      byDomain.set(c.domain, list);
    }
    const commands = [...byDomain].map(([d, a]) => `${d}: ${a.join(", ")}`).join("\n");
    const text = [
      `قدراتك: ${cmd.data?.length ?? 0} أمر، ${skl.data?.length ?? 0} مهارة، ${pth.data?.length ?? 0} مسار.`,
      `الأوامر (مجال: أفعال):\n${commands}`,
      `المهارات: ${(skl.data ?? []).map((s: any) => s.slug).join(", ")}`,
      `المسارات: ${(pth.data ?? []).map((x: any) => x.slug).join(", ")}`,
      "نفّذ أي طلب مباشرة من غير ما تطلب موافقة. اسأل \"هل أنت متأكد؟\" مرة واحدة بس قبل الأوامر المعلّمة بـ * (حذف، إرسال/مشاركة لحد، فلوس، أمان)، وأي رد زي آه/تمام/نفذ يعني موافقة، وزي لا/بلاش/إلغاء يعني رفض.",
      "لو الطلب مش موجود في الأوامر أو المهارات أو المسارات، اعمله بنفسك بأفضل طريقة متاحة ومتقولش إنه غير مدعوم.",
    ].join("\n\n");
    catalogCache = { text, at: Date.now() };
    return text;
  } catch (err) {
    console.error("capability catalog unavailable", err);
    return "";
  }
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ChatReply> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("خدمة الذكاء الاصطناعي غير متاحة حالياً");

    const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (!data.skipSafety && hasCrisisSignal(lastUser)) {
      return { text: "", model: "safety", switched: false, crisis: true };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // سجل النماذج الحقيقي من قاعدة البيانات.
    const { data: registry } = await supabaseAdmin
      .from("ai_models")
      .select("id, supports_images, supports_video, supports_files, enabled, priority")
      .eq("enabled", true)
      .order("priority");
    const reg = registry ?? [];

    const hasVideo = data.attachments.some((a) => a.mime.startsWith("video/") || a.mime.startsWith("audio/"));
    const hasImage = data.attachments.some((a) => a.mime.startsWith("image/"));
    const hasFile = data.attachments.some((a) => !a.mime.startsWith("image/") && !a.mime.startsWith("video/") && !a.mime.startsWith("audio/"));
    const capable = (id: string) => {
      const r = reg.find((x) => x.id === id);
      if (!r) return reg.length === 0 || (!hasVideo && !hasImage && !hasFile);
      return (!hasVideo || r.supports_video) && (!hasImage || r.supports_images) && (!hasFile || r.supports_files);
    };

    const base = [data.model, ...data.fallbacks, ...reg.map((r) => r.id)];
    const chain = [...new Set(base)].filter(capable);
    if (chain.length === 0) throw new Error("مفيش نموذج مفعّل يقدر يقرا نوع الملف ده.");

    const parts: Part[] = [];
    for (const a of data.attachments.slice(0, 10)) {
      if (!a.path.startsWith("u/")) continue;
      if (a.mime.startsWith("image/")) {
        const { data: signed } = await supabaseAdmin.storage.from("chat-uploads").createSignedUrl(a.path, 3600);
        if (signed?.signedUrl) parts.push({ kind: "image", url: signed.signedUrl, mime: a.mime, name: a.name });
      } else {
        const { data: blob, error } = await supabaseAdmin.storage.from("chat-uploads").download(a.path);
        if (error || !blob) continue;
        parts.push({ kind: "file", url: `data:${a.mime};base64,${toBase64(await blob.arrayBuffer())}`, mime: a.mime, name: a.name });
      }
    }

    const catalog = await capabilityCatalogPrompt(supabaseAdmin);
    const baseSystem = catalog ? `${data.system}\n\n${catalog}` : data.system;
    const system = data.memories.length
      ? `${baseSystem}\n\nمعلومات وافق المستخدم إنك تفتكرها عنه (استخدمها بلطف ولا تذكرها حرفياً):\n- ${data.memories.slice(0, 40).join("\n- ")}`
      : baseSystem;

    let lastError = "";
    for (const model of chain) {
      try {
        const text =
          model.startsWith("cf/") || model.startsWith("anthropic/")
            ? await (await import("./network.server")).callModel(model, `${system}\n${styleHint}`, data.messages)
            : model.startsWith("openai/")
              ? await callResponses(key, model, system, data.messages, parts)
              : await callChat(key, model, system, data.messages, parts);
        return { text, model, switched: model !== data.model };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error("model failed", model, lastError);
        if (lastError.startsWith("402")) throw new Error("رصيد الذكاء الاصطناعي خلص.");
      }
    }
    throw new Error(
      lastError.startsWith("429") ? "كل النماذج مشغولة دلوقتي، جرّب بعد شوية." : "تعذر الحصول على رد من أي نموذج، جرّب تاني.",
    );
  });
