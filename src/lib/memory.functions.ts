import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getKey() {
  const secret = process.env["MEMORY_ENCRYPTION_KEY"];
  if (!secret) throw new Error("مفتاح التشفير غير متاح");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function encrypt(text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getKey(), new TextEncoder().encode(text)));
  return `${b64(iv)}.${b64(ct)}`;
}
async function decrypt(enc: string) {
  const [iv, ct] = enc.split(".");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv!) }, await getKey(), unb64(ct!));
  return new TextDecoder().decode(pt);
}

export type Memory = { id: string; category: string; content: string; created_at: string };
const Category = z.enum(["preference", "trait", "goal", "habit"]);

export const getMemoryState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: s } = await context.supabase.from("memory_settings").select("*").eq("user_id", context.userId).maybeSingle();
    const { data: rows } = await context.supabase.from("user_memories").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });
    const memories: Memory[] = [];
    for (const r of rows ?? []) {
      try {
        memories.push({ id: r.id, category: r.category, content: await decrypt(r.content_enc), created_at: r.created_at });
      } catch {
        /* skip unreadable */
      }
    }
    return { consent: s?.consent ?? false, enabled: s?.enabled ?? false, memories };
  });

export const setMemorySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ consent: z.boolean(), enabled: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("memory_settings")
      .upsert({ user_id: context.userId, consent: data.consent, enabled: data.consent && data.enabled, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid().nullable(), category: Category, content: z.string().min(1).max(500) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { data: s } = await context.supabase.from("memory_settings").select("consent").eq("user_id", context.userId).maybeSingle();
    if (!s?.consent) throw new Error("لازم توافق على الذاكرة الأول.");
    const content_enc = await encrypt(data.content.trim());
    const q = data.id
      ? context.supabase.from("user_memories").update({ content_enc, category: data.category, updated_at: new Date().toISOString() }).eq("id", data.id)
      : context.supabase.from("user_memories").insert({ user_id: context.userId, content_enc, category: data.category });
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid().nullable() }).parse(i))
  .handler(async ({ data, context }) => {
    const q = context.supabase.from("user_memories").delete().eq("user_id", context.userId);
    const { error } = data.id ? await q.eq("id", data.id) : await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// يقترح ذكريات من المحادثة — لا يحفظ شيء إلا بموافقة المستخدم.
export const suggestMemories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ text: z.string().min(1).max(8000) }).parse(i))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("خدمة الذكاء الاصطناعي غير متاحة");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'استخرج من كلام المستخدم حتى 5 معلومات مفيدة يفتكرها المساعد عنه (تفضيلات، صفات، أهداف، عادات). لا تستنتج أي تشخيص طبي أو نفسي. رد json بالشكل {"items":[{"category":"preference|trait|goal|habit","content":"جملة قصيرة بالعربية"}]}',
          },
          { role: "user", content: data.text },
        ],
      }),
    });
    if (!res.ok) throw new Error(res.status === 429 ? "مشغول، جرّب بعد شوية" : `فشل (${res.status})`);
    const json = await res.json();
    try {
      const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as { items?: { category: string; content: string }[] };
      return (parsed.items ?? [])
        .filter((x) => ["preference", "trait", "goal", "habit"].includes(x.category) && x.content)
        .slice(0, 5)
        .map((x) => ({ category: x.category as z.infer<typeof Category>, content: String(x.content).slice(0, 300) }));
    } catch {
      return [];
    }
  });
