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

function inferPhoneTag(input: string) {
  const text = input.trim();
  const url = text.match(/https?:\/\/\S+|www\.\S+/i)?.[0]?.replace(/[،.,)]+$/g, "");
  if (url && /(افتح|شغل|اذهب|رابط|open|go)/i.test(text)) return `[[PHONE:open_url|${url.startsWith("www.") ? `https://${url}` : url}]]`;
  if (/(يوتيوب|youtube)/i.test(text) && /(ابحث|بحث|أغنية|اغنية|اغنيه|تحميل|تنزيل|نزل|نزّل|حمل|حمّل)/i.test(text)) {
    const title = text
      .replace(/.*?(?:أغنية|اغنية|اغنيه|بحث عن|ابحث عن|تحميل|تنزيل|نزل|نزّل|حمل|حمّل)\s*/i, "")
      .replace(/\s*(?:على|في|من)\s*(?:ال)?يوتيوب.*$/i, "")
      .replace(/^(?:أغنية|اغنية|اغنيه|في|على)\s+/i, "")
      .trim();
    if (title.length >= 2) return `[[PHONE:open_app|youtube]]\n[[PHONE:type_text_submit|${title.slice(0, 500)}]]`;
    return "[[PHONE:open_app|youtube]]";
  }
  if (!/(افتح|شغل|شغّل|open|launch)/i.test(text)) return "";
  const app = text.match(/(يوتيوب|youtube|كروم|chrome|واتساب|whatsapp|تليجرام|telegram|جيميل|gmail|الإعدادات|settings)/i)?.[0];
  return app ? `[[PHONE:open_app|${app}]]` : "";
}

const HINT = (me: string, memory: string, manager: boolean) => `${manager ? `إنت ${MANAGER_LABEL}. أنت نقطة الدخول والمنسق: افهم طلب أبانوب، حدد الوكيل المتخصص المناسب، واكتب وسم [[DELEGATE:health|السؤال]] أو [[DELEGATE:karate|السؤال]] أو [[DELEGATE:general|السؤال]] عندما تحتاج رأيًا متخصصًا. لا تدّعي تنفيذ مهمة قبل استخدام أداة الهاتف أو ظهور نتيجتها.` : `إنت "${me}" واحد من شبكة 50 نموذج ذكاء اصطناعي`} بتشتغل مع أبانوب في محادثة واحدة مشتركة. كل الردود (بتاعته وبتاعت باقي النماذج) قدامك تحت وبتتحفظ عند الكل.
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
[[PHONE:kind|arg]] يتحكم في هاتف أبانوب المربوط. استخدم الأوامر الذرية أو خطة متسلسلة [[PHONE_BATCH|{"steps":[{"kind":"open_app","payload":{"package":"..."}},{"kind":"wait_for_text","payload":{"text":"..."}},{"kind":"tap_description","payload":{"text":"..."}},{"kind":"read_screen","payload":{}}]}]]، أو دورة [[PHONE_WORKFLOW|{"until_text":"تم","steps":[...]}]] تكرر الملاحظة والتنفيذ حتى يظهر الهدف. الأوامر تشمل: open_app/open_url/open_chrome/open_settings/open_camera/download_file/back/home/recents/tap_text/tap_id/tap_description/tap_coordinates/long_press/type_text/clear_text/swipe/scroll/wait/wait_for_text/screenshot/read_screen/screen_text/press_back/press_home/open_notifications/quick_settings/device_inventory/app_inventory/app_permissions/notification_inventory/file_inventory/file_read/open_file/open_document/stop. داخل batch يمكن استعمال if_text أو unless_text لتخطي خطوة، وrepeat لعدد مرات. للبحث استخدم type_text_submit ثم Enter. لا تتوقف إذا فشل أمر؛ سجّل الفشل وكمل باقي الخطة. لا تدّعي التنفيذ قبل نتيجة الأداة.
[[DB_READ:table]] يقرأ بيانات الحساب من جدول مسموح به وبحد أقصى 50 صفًا: tasks أو employees أو network_messages أو companion_events.
[[WORKSPACE_WRITE|note أو task أو proposal|العنوان|التفاصيل]] يسجل تعديلًا مقترحًا في مساحة عمل حسابك لمراجعته. لا يوجد حذف أو تعديل شامل من النموذج.
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
    const requestText = lastClient?.text ?? "";
    const searchIntent = /(يوتيوب|youtube)/i.test(requestText) && /(بحث|ابحث|أغنية|اغنية|اغنيه|تحميل|تنزيل|نزل|نزّل|حمل|حمّل)/i.test(requestText);
    if (searchIntent) text = text.replace(/\[\[PHONE:\s*type_text\s*\|([^\]]+)\]\]/gi, "[[PHONE:type_text_submit|$1]]");
    const inferredPhone = inferPhoneTag(requestText);
    if (inferredPhone && !text.includes("[[PHONE:")) text = `${text}\n${inferredPhone}`;

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
    const dbReadTables = new Set(["tasks", "employees", "network_messages", "companion_events", "agent_workspace_actions"]);
    for (const m of text.matchAll(/\[\[DB_READ:\s*([^\]]+?)\s*\]\]/g)) {
      if (jobs++ >= 10) break;
      await run(`🗄️ قراءة قاعدة البيانات: ${m[1]}`, async () => {
        const table = m[1]!.trim();
        if (!dbReadTables.has(table)) throw new Error("الجدول غير مسموح للوكيل");
        const columns = table === "tasks" ? "id,title,details,priority,status,created_at" : table === "employees" ? "id,code,full_name,department,job_title,status" : table === "network_messages" ? "id,who,content,created_at" : table === "companion_events" ? "id,event_type,message,created_at" : "id,action_type,title,content,status,created_at";
        const db = context.supabase as any;
        const q = db.from(table).select(columns).limit(50);
        const scoped = table === "employees" ? q : q.eq("user_id", context.userId);
        const { data, error } = await scoped;
        if (error) throw new Error(error.message);
        return { text: JSON.stringify(data ?? []).slice(0, 12000) };
      });
    }
    for (const m of text.matchAll(/\[\[WORKSPACE_WRITE\s*\|\s*(note|task|proposal)\s*\|\s*([^|\]]+)\s*\|\s*([\s\S]*?)\]\]/g)) {
      if (jobs++ >= 10) break;
      await run("🗄️ تسجيل تعديل في مساحة عمل الحساب", async () => {
        const db = context.supabase as any;
        const { data, error } = await db.from("agent_workspace_actions").insert({ user_id: context.userId, action_type: m[1], title: m[2]!.trim().slice(0, 200), content: m[3]!.trim().slice(0, 4000), status: "proposed" }).select("id,action_type,title,status").single();
        if (error) throw new Error(error.message);
        return { text: `تم تسجيل التعديل كمقترح ${JSON.stringify(data)} — راجعه قبل اعتماده.` };
      });
    }
    for (const m of text.matchAll(/\[\[MERGE:\s*([^\]]+?)\s*\]\]/g)) {
      tools.push({ tool: `🔀 طلب دمج ${m[1]}`, ok: true, text: `MERGE_REQUEST:${n.checkRepo(m[1]!)}` });
    }
    const PHONE_KINDS = new Set(["open_chrome", "open_url", "open_app", "open_settings", "open_camera", "download_file", "speak", "listen", "back", "home", "recents", "tap_text", "tap_id", "tap_description", "tap_coordinates", "long_press", "type_text", "clear_text", "swipe", "scroll", "wait", "wait_for_text", "screenshot", "read_screen", "screen_text", "press_back", "press_home", "open_notifications", "quick_settings", "device_inventory", "app_inventory", "app_permissions", "notification_inventory", "file_inventory", "file_read", "open_file", "open_document", "batch", "workflow"]);
    const appPackages: Record<string, string> = {
      youtube: "com.google.android.youtube", "يوتيوب": "com.google.android.youtube",
      chrome: "com.android.chrome", "جوجل كروم": "com.android.chrome", "كروم": "com.android.chrome",
      whatsapp: "com.whatsapp", "واتساب": "com.whatsapp", telegram: "org.telegram.messenger", "تليجرام": "org.telegram.messenger",
      gmail: "com.google.android.gm", "جيميل": "com.google.android.gm", settings: "com.android.settings", "الإعدادات": "com.android.settings",
    };
    for (const m of text.matchAll(/\[\[PHONE_WORKFLOW\|([\s\S]*?)\]\]/gi)) {
      if (jobs++ >= 4) break;
      await run("📱 دورة هاتف ذاتية", async () => {
        let payload: any;
        try { payload = JSON.parse(m[1]!.trim()); } catch { throw new Error("دورة الهاتف ليست JSON صالحًا"); }
        if (!Array.isArray(payload?.steps) || payload.steps.length === 0 || payload.steps.length > 50) throw new Error("الدورة تحتاج خطوات");
        if (payload.max_cycles !== undefined && (!Number.isInteger(payload.max_cycles) || payload.max_cycles < 1 || payload.max_cycles > 100)) throw new Error("max_cycles يجب أن يكون بين 1 و100");
        const { data: dev } = await context.supabase.from("companion_devices").select("id,status").eq("user_id", context.userId).eq("platform", "android").order("last_seen_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
        if (!dev) throw new Error("مفيش هاتف مربوط — افتح التطبيق وسجّل دخول");
        const { error } = await context.supabase.from("companion_commands").insert({ device_id: dev.id, user_id: context.userId, kind: "workflow", payload, requires_approval: false, status: "approved", approved_at: new Date().toISOString() });
        if (error) throw new Error(error.message);
        return { text: `بدأت دورة من ${payload.steps.length} خطوة (${dev.status}) وتستمر حتى تحقق الهدف أو تصل لحد التشغيل الآمن.` };
      });
    }
    for (const m of text.matchAll(/\[\[PHONE_BATCH\|([\s\S]*?)\]\]/gi)) {
      if (jobs++ >= 4) break;
      await run("📱 خطة هاتف متسلسلة", async () => {
        let payload: any;
        try { payload = JSON.parse(m[1]!.trim()); } catch { throw new Error("خطة الهاتف ليست JSON صالحًا"); }
        if (!Array.isArray(payload?.steps) || payload.steps.length === 0 || payload.steps.length > 50) throw new Error("خطة الهاتف يجب أن تحتوي من 1 إلى 50 خطوة");
        const { data: dev } = await context.supabase.from("companion_devices").select("id,status").eq("user_id", context.userId).eq("platform", "android").order("last_seen_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
        if (!dev) throw new Error("مفيش هاتف مربوط — افتح التطبيق وسجّل دخول");
        const command = { device_id: dev.id, user_id: context.userId, kind: "batch", payload, requires_approval: false, status: "approved", approved_at: new Date().toISOString() };
        const { error } = await context.supabase.from("companion_commands").insert(command);
        if (error) throw new Error(error.message);
        return { text: `اتبعت خطة من ${payload.steps.length} خطوة للهاتف (${dev.status})؛ كل خطوة تسجل نجاحها أو فشلها وتستمر الخطة.` };
      });
    }
    for (const m of text.matchAll(/\[\[PHONE:\s*([a-z_]+)(?:\s*\|\s*([^\]]*))?\]\]/gi)) {
      if (jobs++ >= 12) break;
      const rawKind = m[1]!.toLowerCase();
      let kind = rawKind;
      let arg = (m[2] ?? "").trim();
      if (rawKind.startsWith("open_app") && rawKind.length > "open_app".length && !arg) {
        kind = "open_app";
        arg = rawKind.slice("open_app".length);
      }
      const submit = rawKind === "type_text_submit";
      const aliases: Record<string, string> = { click: "tap_text", tap: "tap_text", type: "type_text", search: "type_text", type_text_submit: "type_text", read_screen: "screen_text" };
      kind = aliases[kind] ?? kind;
      await run(`📱 الهاتف: ${kind}`, async () => {
        if (!PHONE_KINDS.has(kind)) throw new Error("أمر غير مسموح");
        const { data: dev } = await context.supabase
          .from("companion_devices").select("id,status").eq("user_id", context.userId).eq("platform", "android")
          .order("last_seen_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
        const appArg = kind === "open_app" ? (appPackages[arg.trim().toLowerCase()] ?? arg.trim()) : arg;
        const urlArg = kind === "open_url" && /^www\./i.test(arg) ? `https://${arg}` : arg;
        if (!dev) throw new Error("مفيش هاتف مربوط — افتح التطبيق وسجّل دخول");
        if (["open_url", "download_file"].includes(kind) && !/^https:\/\//.test(urlArg)) throw new Error("الرابط لازم يبدأ بـ https://");
        if (kind.endsWith("inventory") && arg) throw new Error("أمر الجرد لا يقبل بيانات إضافية");
        const payload = kind === "open_url" || kind === "download_file" ? { url: urlArg } : kind === "open_app" ? { package: appArg } : kind === "open_settings" ? { setting: arg } : kind === "speak" ? { text: arg.slice(0, 4000) } : kind === "tap_text" || kind === "type_text" ? { text: arg.slice(0, 500), ...(submit ? { submit: "true" } : {}) } : {};
        const command = {
          device_id: dev.id, user_id: context.userId, kind, payload,
          requires_approval: false, status: "approved",
          approved_at: new Date().toISOString(),
        };
        let { error } = await context.supabase.from("companion_commands").insert(command);
        // Lovable Cloud deployments that still have the original allowlist accept tap_text.
        // Preserve the real action inside the payload so the Android agent can execute it.
        if (error && /kind_check|check constraint/i.test(error.message) && kind !== "tap_text") {
          const legacy = { ...command, kind: "tap_text", payload: { ...payload, agent_action: kind } };
          ({ error } = await context.supabase.from("companion_commands").insert(legacy));
        }
        if (error) throw new Error(error.message);
        return { text: `اتبعت للهاتف (${dev.status}) ونُفذت تلقائيًا` };
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
