import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MANAGER_ID, MANAGER_LABEL, NET_MODELS, REPOS, WORK_BRANCH } from "./models30";
import { requireCloudAuth } from "@/integrations/supabase/runtime-auth";
import { loadConsentedMemoryContext } from "./memory.functions";

const Turn = z.object({
  model: z.string().min(1),
  thread: z.array(z.object({ who: z.string(), text: z.string() })).max(200),
});

export type ToolEvent = { tool: string; ok: boolean; text: string; link?: string | undefined; shot?: string | undefined };
export type TurnReply = { model: string; text: string; tools: ToolEvent[]; usedModel: string };

const HINT = (me: string, memory: string, manager: boolean) => `${manager ? `إنت ${MANAGER_LABEL}. أنت نقطة الدخول والمنسق: افهم طلب أبانوب، حدد الوكيل المتخصص المناسب، واكتب وسم [[DELEGATE:health|السؤال]] أو [[DELEGATE:karate|السؤال]] أو [[DELEGATE:general|السؤال]] عندما تحتاج رأيًا متخصصًا. لا تدّعي تنفيذ مهمة قبل استخدام أداة الهاتف أو ظهور نتيجتها.` : `إنت "${me}" واحد من شبكة 30 نموذج ذكاء اصطناعي`} بتشتغل مع أبانوب في محادثة واحدة مشتركة. كل الردود (بتاعته وبتاعت باقي النماذج) قدامك تحت وبتتحفظ عند الكل.
الذاكرة المشتركة المصرّح بها من أبانوب:
${memory}
رد بالعربية المصرية، مختصر وعملي، ونص عادي من غير ** أو ##. لو نموذج تاني قال حاجة، ممكن توافق أو تصحح أو تكمل عليه.
أدوات (اكتب الوسم في سطر لوحده، هيتنفذ وتشوف نتيجته):
[[BROWSE:https://...]] يفتح الصفحة في المتصفح السحابي (Cloudflare) ويقرأها ويصورها.
[[ASK:معرف-النموذج|سؤال]] تبعت رسالة لنموذج تاني وتاخد رده. المعرفات: ${NET_MODELS.map((m) => m.id).join(", ")}
[[GH_READ:repo|path]] يقرا ملف أو مجلد (repo = abra-cadabra-repo أو AbanoupAi، path فاضي = الجذر).
[[GH_WRITE:repo|path]]
المحتوى الكامل للملف
[[/GH_WRITE]] يكتب في فرع ${WORK_BRANCH} بس (الأصلي مش بيتلمس).
[[MERGE:repo]] تطلب دمج فرع ${WORK_BRANCH} في الأصلي — ده بيستنى موافقة أبانوب بزرار.
[[PHONE:kind|arg]] يتحكم في هاتف أبانوب المربوط. يدعم فتح التطبيقات والإعدادات، Chrome، الروابط والتنزيلات، Home/Back/Recents، الضغط والكتابة والسحب، الكاميرا، screenshot، speak/listen، وجرد الجهاز والتطبيقات والإشعارات. الأوامر الحساسة تحتاج موافقته وصلاحية Android المناسبة.
استخدم الأدوات بس لما الطلب محتاجها.`;

export const networkTurn = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((i: unknown) => Turn.parse(i))
  .handler(async ({ data, context }): Promise<TurnReply> => {
    const n = await import("./network.server");
    if (!n.knownModel(data.model)) throw new Error("نموذج غير معروف");
    const isManager = data.model === MANAGER_ID;
    const me = isManager ? { label: MANAGER_LABEL } : NET_MODELS.find((m) => m.id === data.model)!;
    const memoryText = await loadConsentedMemoryContext(context.supabase, context.userId);
    // Shared thread is read from the user's account in the database (fallback: client copy).
    const { data: rows } = await context.supabase
      .from("network_messages").select("who,content,created_at").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(40);
    const dbThread = (rows ?? []).reverse().map((r) => ({ who: r.who === "me" ? "me" : (NET_MODELS.find((x) => x.id === r.who)?.label ?? r.who), text: r.content }));
    const lastClient = data.thread[data.thread.length - 1];
    const base = dbThread.length ? dbThread : data.thread;
    if (lastClient && !base.some((t) => t.text === lastClient.text)) base.push(lastClient);
    // Device info for all models: phone status + latest events.
    const { data: devs } = await context.supabase
      .from("companion_devices").select("id,device_name,platform,status,last_seen_at").eq("user_id", context.userId).limit(5);
    const { data: evs } = await context.supabase
      .from("companion_events").select("event_type,message,created_at").eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(8);
    const deviceInfo = (devs ?? []).length
      ? `أجهزة أبانوب: ${(devs ?? []).map((d) => `${d.device_name} (${d.platform}) حالته ${d.status}، آخر ظهور ${d.last_seen_at ?? "-"}`).join("؛ ")}\nآخر أحداث الجهاز:\n${(evs ?? []).map((e) => `- ${e.event_type}: ${(e.message ?? "").slice(0, 300)}`).join("\n")}`
      : "مفيش جهاز مربوط حاليًا.";
    const sharedMemory = `${memoryText}\n\n${deviceInfo}`;
    const history = base.slice(-30).map((t) => ({
      role: (t.who === "me" ? "user" : "assistant") as "user" | "assistant",
      content: (t.who === "me" ? "أبانوب: " : `[${t.who}]: `) + t.text.slice(0, 2500),
    }));
    // keep role alternation simple: merge into a single user turn transcript
    const transcript = history.map((h) => h.content).join("\n\n");
    const msgs = [{ role: "user" as const, content: `المحادثة المشتركة لحد دلوقتي:\n\n${transcript}\n\nدلوقتي دورك يا ${me.label}.` }];

    const fallback = "cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    let used = isManager ? fallback : data.model;
    let text: string;
    try {
      text = await n.callModel(used, HINT(me.label, sharedMemory, isManager), msgs);
    } catch (e) {
      console.error("model failed", data.model, e);
      if (String(e).includes("402")) throw new Error("رصيد الذكاء الاصطناعي خلص.");
      used = fallback;
      text = await n.callModel(fallback, HINT(me.label, sharedMemory, isManager), msgs);
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
    if (isManager) {
      const specialists: Record<string, string> = {
        health: "google/gemini-3.8-flash",
        karate: "cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        coding: "cf/@cf/qwen/qwen2.5-coder-32b-instruct",
        browser: "cf/@cf/meta/llama-4-scout-17b-16e-instruct",
        general: fallback,
      };
      for (const m of text.matchAll(/\[\[DELEGATE:\s*([^|\]]+)\s*\|([\s\S]*?)\]\]/g)) {
        if (jobs++ >= 3) break;
        const role = (m[1] ?? "general").trim().toLowerCase();
        const specialist = specialists[role] ?? fallback;
        await run(`👤 ${role} ← ${specialist}`, async () => ({
          text: await n.callModel(specialist, HINT(`وكيل ${role}`, sharedMemory, false), [{ role: "user", content: `${m[2]!.trim()}\n\nالسياق المشترك:\n${transcript}` }]),
        }));
      }
    }
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
    const PHONE_KINDS = new Set(["open_chrome", "open_url", "open_app", "open_settings", "open_camera", "download_file", "speak", "listen", "back", "home", "recents", "tap_text", "tap_coordinates", "long_press", "type_text", "swipe", "screenshot", "device_inventory", "app_inventory", "notification_inventory"]);
    const SENSITIVE = new Set(["open_url", "open_app", "open_settings", "open_camera", "download_file", "speak", "listen", "type_text", "tap_text", "tap_coordinates", "long_press", "swipe", "screenshot", "device_inventory", "app_inventory", "notification_inventory"]);
    for (const m of text.matchAll(/\[\[PHONE:\s*([a-z_]+)\s*\|?([^\]]*)\]\]/g)) {
      if (jobs++ >= 12) break;
      const kind = m[1]!;
      const arg = (m[2] ?? "").trim();
      await run(`📱 الهاتف: ${kind}`, async () => {
        if (!PHONE_KINDS.has(kind)) throw new Error("أمر غير مسموح");
        const { data: dev } = await context.supabase
          .from("companion_devices").select("id,status").eq("user_id", context.userId).eq("platform", "android")
          .order("last_seen_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
        if (!dev) throw new Error("مفيش هاتف مربوط — افتح التطبيق وسجّل دخول");
        if (["open_url", "download_file"].includes(kind) && !/^https:\/\//.test(arg)) throw new Error("الرابط لازم يبدأ بـ https://");
        if (kind.endsWith("inventory") && arg) throw new Error("أمر الجرد لا يقبل بيانات إضافية");
        const payload = kind === "open_url" || kind === "download_file" ? { url: arg } : kind === "open_app" ? { package: arg } : kind === "open_settings" ? { setting: arg } : kind === "speak" ? { text: arg.slice(0, 4000) } : kind === "tap_text" || kind === "type_text" ? { text: arg.slice(0, 500) } : {};
        const sensitive = SENSITIVE.has(kind);
        const { error } = await context.supabase.from("companion_commands").insert({
          device_id: dev.id, user_id: context.userId, kind, payload,
          requires_approval: sensitive, status: sensitive ? "queued" : "approved",
          approved_at: sensitive ? null : new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        return { text: sensitive ? "مستني موافقتك في صفحة التحكم" : `اتبعت للهاتف (${dev.status})`, link: sensitive ? "/companion" : undefined };
      });
    }
    const clean = text.replace(/\[\[GH_WRITE:[\s\S]*?\[\[\/GH_WRITE\]\]/g, "[تعديل ملف]").replace(/\[\[DELEGATE:[\s\S]*?\]\]/g, "").trim();
    return { model: data.model, usedModel: used, text: clean, tools };
  });

export const mergeRepo = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((i: unknown) => z.object({ repo: z.enum(REPOS) }).parse(i))
  .handler(async ({ data }) => {
    const n = await import("./network.server");
    return { url: await n.ghMerge(data.repo) };
  });
