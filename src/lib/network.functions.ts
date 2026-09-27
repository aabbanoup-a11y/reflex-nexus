import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { NET_MODELS, REPOS, WORK_BRANCH } from "./models30";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Turn = z.object({
  model: z.string().min(1),
  thread: z.array(z.object({ who: z.string(), text: z.string() })).max(200),
});

export type ToolEvent = { tool: string; ok: boolean; text: string; link?: string | undefined; shot?: string | undefined };
export type TurnReply = { model: string; text: string; tools: ToolEvent[]; usedModel: string };

const HINT = (me: string) => `إنت "${me}" واحد من شبكة 30 نموذج ذكاء اصطناعي بتشتغل مع أبانوب في محادثة واحدة مشتركة. كل الردود (بتاعته وبتاعت باقي النماذج) قدامك تحت وبتتحفظ عند الكل.
رد بالعربية المصرية، مختصر وعملي، ونص عادي من غير ** أو ##. لو نموذج تاني قال حاجة، ممكن توافق أو تصحح أو تكمل عليه.
أدوات (اكتب الوسم في سطر لوحده، هيتنفذ وتشوف نتيجته):
[[BROWSE:https://...]] يفتح الصفحة في المتصفح السحابي (Cloudflare) ويقرأها ويصورها.
[[ASK:معرف-النموذج|سؤال]] تبعت رسالة لنموذج تاني وتاخد رده. المعرفات: ${NET_MODELS.map((m) => m.id).join(", ")}
[[GH_READ:repo|path]] يقرا ملف أو مجلد (repo = abra-cadabra-repo أو AbanoupAi، path فاضي = الجذر).
[[GH_WRITE:repo|path]]
المحتوى الكامل للملف
[[/GH_WRITE]] يكتب في فرع ${WORK_BRANCH} بس (الأصلي مش بيتلمس).
[[MERGE:repo]] تطلب دمج فرع ${WORK_BRANCH} في الأصلي — ده بيستنى موافقة أبانوب بزرار.
استخدم الأدوات بس لما الطلب محتاجها.`;

export const networkTurn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Turn.parse(i))
  .handler(async ({ data }): Promise<TurnReply> => {
    const n = await import("./network.server");
    if (!n.knownModel(data.model)) throw new Error("نموذج غير معروف");
    const me = NET_MODELS.find((m) => m.id === data.model)!;
    const history = data.thread.slice(-30).map((t) => ({
      role: (t.who === "me" ? "user" : "assistant") as "user" | "assistant",
      content: (t.who === "me" ? "أبانوب: " : `[${t.who}]: `) + t.text.slice(0, 2500),
    }));
    // keep role alternation simple: merge into a single user turn transcript
    const transcript = history.map((h) => h.content).join("\n\n");
    const msgs = [{ role: "user" as const, content: `المحادثة المشتركة لحد دلوقتي:\n\n${transcript}\n\nدلوقتي دورك يا ${me.label}.` }];

    const fallback = "cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    let used = data.model;
    let text: string;
    try {
      text = await n.callModel(data.model, HINT(me.label), msgs);
    } catch (e) {
      console.error("model failed", data.model, e);
      if (String(e).includes("402")) throw new Error("رصيد الذكاء الاصطناعي خلص.");
      used = fallback;
      text = await n.callModel(fallback, HINT(me.label), msgs);
    }

    const tools: ToolEvent[] = [];
    const run = async (tool: string, f: () => Promise<Omit<ToolEvent, "tool" | "ok">>) => {
      try {
        tools.push({ tool, ok: true, ...(await f()) });
      } catch (e) {
        tools.push({ tool, ok: false, text: e instanceof Error ? e.message : String(e) });
      }
    };
    let jobs = 0;
    for (const m of text.matchAll(/\[\[BROWSE:\s*(\S+?)\s*\]\]/g)) {
      if (jobs++ >= 4) break;
      await run(`🌐 متصفح ${m[1]}`, async () => {
        const r = await n.browse(m[1]!);
        const reader = NET_MODELS.find((x) => x.browser && x.id.startsWith("cf/"))!.id;
        const sum = await n.callModel(reader, "إنت نموذج المتصفح. لخّص محتوى الصفحة بالعربية في نقاط قصيرة.", [{ role: "user", content: r.text }]).catch(() => r.text.slice(0, 800));
        return { text: sum, shot: r.shot };
      });
    }
    for (const m of text.matchAll(/\[\[ASK:\s*([^|\]]+?)\s*\|([\s\S]*?)\]\]/g)) {
      if (jobs++ >= 6) break;
      const peer = n.knownModel(m[1]!) ? m[1]! : fallback;
      await run(`💬 ${me.label} ← ${NET_MODELS.find((x) => x.id === peer)?.label}`, async () => ({
        text: await n.callModel(peer, `نموذج "${me.label}" في الشبكة بيسألك. رد بالعربية باختصار.`, [{ role: "user", content: m[2]!.trim() || "?" }]),
      }));
    }
    for (const m of text.matchAll(/\[\[GH_READ:([^|\]]+)\|?([^\]]*)\]\]/g)) {
      if (jobs++ >= 8) break;
      await run(`📖 GitHub ${m[1]}/${m[2]}`, async () => ({ text: await n.ghRead(m[1]!.trim(), (m[2] ?? "").trim()) }));
    }
    for (const m of text.matchAll(/\[\[GH_WRITE:\s*([^|\]]+?)\s*\|\s*([^\]]+?)\s*\]\]\n?([\s\S]*?)\[\[\/GH_WRITE\]\]/g)) {
      if (jobs++ >= 10) break;
      await run(`✏️ GitHub ${m[1]}/${m[2]} (فرع ${WORK_BRANCH})`, async () => {
        const link = await n.ghWrite(m[1]!, m[2]!, m[3]!, me.label);
        return { text: "اتحفظ في الفرع التجريبي", link };
      });
    }
    for (const m of text.matchAll(/\[\[MERGE:\s*([^\]]+?)\s*\]\]/g)) {
      tools.push({ tool: `🔀 طلب دمج ${m[1]}`, ok: true, text: `MERGE_REQUEST:${n.checkRepo(m[1]!)}` });
    }
    const clean = text.replace(/\[\[GH_WRITE:[\s\S]*?\[\[\/GH_WRITE\]\]/g, "[تعديل ملف]").trim();
    return { model: data.model, usedModel: used, text: clean, tools };
  });

export const mergeRepo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ repo: z.enum(REPOS) }).parse(i))
  .handler(async ({ data }) => {
    const n = await import("./network.server");
    return { url: await n.ghMerge(data.repo) };
  });
