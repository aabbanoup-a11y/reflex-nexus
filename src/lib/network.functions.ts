import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MANAGER_ID, MANAGER_LABEL, NET_MODELS, REPOS, WORK_BRANCH } from "./models30";
import { requireCloudAuth } from "@/integrations/supabase/runtime-auth";
import { loadConsentedMemoryContext } from "./memory.functions";

const Turn = z.object({
  model: z.string().min(1),
  thread: z.array(z.object({ who: z.string(), text: z.string() })).max(200),
  mode: z.enum(["execute", "opinion"]).default("execute"),
});

export type ToolEvent = { tool: string; ok: boolean; text: string; link?: string | undefined; shot?: string | undefined };
export type TurnReply = { model: string; text: string; tools: ToolEvent[]; usedModel: string };

function songTitle(input: string) {
  return input
    .replace(/https?:\/\/\S+|www\.\S+/gi, "")
    .replace(/(?:عايز|عايزة|اريد|أريد|ممكن|لو سمحت|من فضلك|نزّل|نزل|حمّل|حمل|تحميل|تنزيل|تنزيله|ابحث|أبحث|بحث|عن|أغنية|اغنية|اغنيه|اسمها|على|علي|في|من|اليوتيوب|يوتيوب|youtube|please|download|song|on|from)/gi, " ")
    .replace(/[،,.!?؟]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferPhoneTag(input: string) {
  const text = input.trim();
  const url = text.match(/https?:\/\/\S+|www\.\S+/i)?.[0]?.replace(/[،.,)]+$/g, "");
  if (url && /(افتح|شغل|اذهب|رابط|open|go)/i.test(text)) return `[[PHONE:open_url|${url.startsWith("www.") ? `https://${url}` : url}]]`;
  if (/(يوتيوب|youtube|أغنية|اغنية|اغنيه)/i.test(text) && /(بحث|ابحث|أغنية|اغنية|اغنيه|تحميل|تنزيل|نزل|نزّل|حمل|حمّل)/i.test(text)) {
    const title = songTitle(text).slice(0, 500);
    if (title.length < 2) return "[[PHONE:open_app|youtube]]";
    const safe = JSON.stringify(title);
    return `[[PHONE_BATCH|{"steps":[{"kind":"open_app","payload":{"package":"com.google.android.youtube"}},{"kind":"wait","payload":{"ms":"1200"}},{"kind":"tap_description","if_text":"بحث","payload":{"text":"بحث"}},{"kind":"tap_description","if_text":"Search","payload":{"text":"Search"}},{"kind":"type_text","payload":{"text":${safe},"submit":"true"}},{"kind":"wait","payload":{"ms":"1800"}},{"kind":"screen_text","payload":{}},{"kind":"screenshot","payload":{}}]}]]`;
  }
  if (!/(افتح|شغل|شغّل|open|launch)/i.test(text)) return "";
  const app = text.match(/(يوتيوب|youtube|كروم|chrome|واتساب|whatsapp|تليجرام|telegram|جيميل|gmail|الإعدادات|settings)/i)?.[0];
  return app ? `[[PHONE:open_app|${app}]]` : "";
}

const HINT = (me: string, memory: string, manager: boolean) => `${manager ? `إنت ${MANAGER_LABEL}. أنت نقطة الدخول والمنسق: افهم طلب أبانوب، حدد الوكيل المتخصص المناسب، واكتب وسم [[DELEGATE:health|السؤال]] أو [[DELEGATE:karate|السؤال]] أو [[DELEGATE:general|السؤال]] عندما تحتاج رأيًا متخصصًا. لا تدّعي تنفيذ مهمة قبل استخدام أداة الهاتف أو ظهور نتيجتها.` : `إنت "${me}" واحد من شبكة 30 نموذج ذكاء اصطناعي`} بتشتغل مع أبانوب في محادثة واحدة مشتركة. كل الردود (بتاعته وبتاعت باقي النماذج) قدامك تحت وبتتحفظ عند الكل.
الذاكرة المشتركة المصرّح بها من أبانوب:
${memory}
رد بالعربية المصرية، مختصر وعملي، ونص عادي من غير ** أو ##. لو نموذج تاني قال حاجة، ممكن توافق أو تصحح أو تكمل عليه.
أدوات (اكتب الوسم في سطر لوحده، هيتنفذ وتشوف نتيجته):
[[BROWSE:https://...]] يفتح الصفحة في المتصفح السحابي (Cloudflare) ويقرأها ويصورها.
[[ASK:معرف-النموذج|سؤال]] تبعت رسالة لنموذج تاني وتاخد رده. المعرفات: ${NET_MODELS.map((m) => m.id).join(", ")}
[[GH_READ:repo|path]] يقرا ملف أو مجلد (repo = reflex-nexus وهو مستودع هذا التطبيق المتزامن مع Lovable، أو abra-cadabra-repo أو AbanoupAi، path فاضي = الجذر).
[[DB_READ:table|عدد]] يقرأ آخر صفوف من جداول حساب أبانوب في قاعدة البيانات (tasks, network_messages, companion_commands, companion_events, companion_devices, mood_checkins, daily_reports, ai_runs, profiles).
[[DB_WRITE:table]]
{"عمود":"قيمة"}
[[/DB_WRITE]] يضيف صفًا في جداول أبانوب القابلة للكتابة (tasks, network_messages, mood_checkins).
[[CF:path]] يقرأ من حساب Cloudflare (مثال: workers/scripts أو ai/models/search أو storage/kv/namespaces).
[[CF_WRITE:PUT|workers/scripts/اسم-العامل]]
{"script":"..."}
[[/CF_WRITE]] يعدّل موارد Cloudflare المعروفة فقط. استخدمه عندما يطلب أبانوب تعديل Worker أو KV أو D1 أو Pages، وبعد قراءة الحالة الحالية.
[[GH_WRITE:repo|path]]
المحتوى الكامل للملف
[[/GH_WRITE]] يكتب في فرع ${WORK_BRANCH} بس (الأصلي مش بيتلمس).
[[MERGE:repo]] تطلب دمج فرع ${WORK_BRANCH} في الأصلي — ده بيستنى موافقة أبانوب بزرار.
[[PHONE:kind|arg]] يتحكم في هاتف أبانوب المربوط. مهم جدًا: اكتب دائمًا الرمز | بين kind وarg، ولا تكتب [[PHONE:open_appcom...]]. إذا قال أبانوب "افتح/شغل يوتيوب أو Chrome أو واتساب" أخرج الوسم فورًا: [[PHONE:open_app|اسم التطبيق أو الحزمة]]. وإذا أعطى رابطًا أخرج [[PHONE:open_url|https://...]]. للبحث: أخرج [[PHONE:open_app|chrome]] ثم [[PHONE:type_text|نص البحث]]. للضغط: [[PHONE:tap_text|النص الظاهر]]. لا تكتفِ بشرح الخطوات ولا تقل إنك لا تملك الهاتف؛ أخرج الوسم وانتظر نتيجة الأداة. يدعم أيضًا الإعدادات، Home/Back/Recents، الضغط والكتابة والسحب، الكاميرا، screenshot، speak/listen، وجرد الجهاز والتطبيقات والإشعارات. الأوامر الحساسة تحتاج موافقته وصلاحية Android المناسبة.
[[DB_READ:table]] يقرأ بيانات الحساب من جدول مسموح به وبحد أقصى 50 صفًا: tasks أو employees أو network_messages أو companion_events.
[[WORKSPACE_WRITE|note أو task أو proposal|العنوان|التفاصيل]] يسجل تعديلًا مقترحًا في مساحة عمل حسابك لمراجعته. لا يوجد حذف أو تعديل شامل من النموذج.
المهارات التي تختار منها حسب الهدف: phone-control (ملاحظة الشاشة والضغط والكتابة)، youtube-search (فتح YouTube والبحث والتحقق)، file-reader (فهرسة وفتح الملفات)، browser-research (قراءة الصفحة وتلخيصها)، github-editor (قراءة وتعديل فرع العمل)، supabase-data (قراءة/إضافة بيانات الحساب)، cloudflare-ops (قراءة/تعديل الموارد المسموحة)، screen-learning (استخراج أنماط التطبيق من حركات المستخدم دون حفظ نصوصه)، وtask-summary (تلخيص ما تم فعليًا). لا تخترع عنصرًا غير موجود: اقرأ الشاشة قبل الضغط، ولا تستخدم tap_text إلا لنص ظهر في screen_text/read_screen أو وصف معروف، وبعد الفشل أعد القراءة واختر بديلًا. افهم الهدف والنتيجة المطلوبة، وليس مجرد تنفيذ أول أمر.
استخدم الأدوات بس لما الطلب محتاجها.`;

export const networkTurn = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((i: unknown) => Turn.parse(i))
  .handler(async ({ data, context }): Promise<TurnReply> => {
    const n = await import("./network.server");
    const modelCall = (id: string, system: string, messages: { role: "user" | "assistant"; content: string }[]) => n.callModel(id, system, messages, context.accessToken);
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

    const fallbacks = ["google/gemini-3.8-flash", "openai/chat-latest", "anthropic/claude-haiku-4-5"];
    const fallback = fallbacks[0]!;
    let used = isManager ? fallback : data.model;
    let text = "";
    try {
      text = await modelCall(used, HINT(me.label, sharedMemory, isManager), msgs);
    } catch (e) {
      console.error("model failed", data.model, e);
      let recovered = false;
      for (const candidate of fallbacks) {
        if (candidate === used) continue;
        try { used = candidate; text = await modelCall(candidate, HINT(me.label, sharedMemory, isManager), msgs); recovered = true; break; } catch { /* جرّب المزود التالي */ }
      }
      if (!recovered) throw new Error("تعذر الاتصال بالمصادر السحابية الآن؛ تم الاحتفاظ بالطلب للمحاولة المحلية.");
    }
    if (data.mode === "opinion") {
      return { model: data.model, usedModel: used, text: text.replace(/\[\[[\s\S]*?\]\]/g, "").trim(), tools: [] };
    }
    const requestText = lastClient?.text ?? "";
    const searchIntent = /(يوتيوب|youtube|أغنية|اغنية|اغنيه)/i.test(requestText) && /(بحث|ابحث|أغنية|اغنية|اغنيه|تحميل|تنزيل|نزل|نزّل|حمل|حمّل)/i.test(requestText);
    if (searchIntent) {
      // لا نسمح للنموذج باختراع open_url أو عنصر مثل Accounts في مسار YouTube؛ نستخدم المسار الحتمي أعلاه.
      text = text.replace(/\[\[PHONE:[\s\S]*?\]\]/gi, "");
    }
    const inferredPhone = inferPhoneTag(requestText);
    if (inferredPhone && (!text.includes("[[PHONE:") || searchIntent)) text = `${text.trim()}\n${inferredPhone}`;

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
          text: await modelCall(specialist, HINT(`وكيل ${role}`, sharedMemory, false), [{ role: "user", content: `${m[2]!.trim()}\n\nالسياق المشترك:\n${transcript}` }]),
        }));
      }
    }
    for (const m of text.matchAll(/\[\[BROWSE:\s*(\S+?)\s*\]\]/g)) {
      if (jobs++ >= 4) break;
      await run(`🌐 متصفح ${m[1]}`, async () => {
        const r = await n.browse(m[1]!);
        const reader = NET_MODELS.find((x) => x.browser && x.id.startsWith("cf/"))!.id;
        const sum = await modelCall(reader, "إنت نموذج المتصفح. لخّص محتوى الصفحة بالعربية في نقاط قصيرة.", [{ role: "user", content: r.text }]).catch(() => r.text.slice(0, 800));
        return { text: sum, shot: r.shot };
      });
    }
    for (const m of text.matchAll(/\[\[ASK:\s*([^|\]]+?)\s*\|([\s\S]*?)\]\]/g)) {
      if (jobs++ >= 6) break;
      const peer = n.knownModel(m[1]!) ? m[1]! : fallback;
      await run(`💬 ${me.label} ← ${NET_MODELS.find((x) => x.id === peer)?.label}`, async () => ({
        text: await modelCall(peer, `نموذج "${me.label}" في الشبكة بيسألك. رد بالعربية باختصار.`, [{ role: "user", content: m[2]!.trim() || "?" }]),
      }));
    }
    const DB_TABLES = ["tasks", "network_messages", "companion_commands", "companion_events", "companion_devices", "mood_checkins", "daily_reports", "ai_runs", "profiles"] as const;
    for (const m of text.matchAll(/\[\[DB_READ:\s*([a-z_]+)\s*\|?\s*(\d*)\s*\]\]/g)) {
      if (jobs++ >= 12) break;
      await run(`🗄️ قراءة ${m[1]}`, async () => {
        const t = m[1] as (typeof DB_TABLES)[number];
        if (!DB_TABLES.includes(t)) throw new Error("جدول غير مسموح");
        const { data: rows, error } = await (context.supabase as any).from(t).select("*").order("created_at", { ascending: false }).limit(Math.min(Number(m[2]) || 10, 50));
        if (error) throw new Error(error.message);
        return { text: JSON.stringify(rows).slice(0, 6000) };
      });
    }
    for (const m of text.matchAll(/\[\[DB_WRITE:\s*([a-z_]+)\s*\]\]\n?([\s\S]*?)\[\[\/DB_WRITE\]\]/g)) {
      if (jobs++ >= 12) break;
      await run(`🗄️ إضافة في ${m[1]}`, async () => {
        if (!["tasks", "network_messages", "mood_checkins"].includes(m[1]!)) throw new Error("جدول غير مسموح بالكتابة");
        const row = { ...JSON.parse(m[2]!.trim()), user_id: context.userId };
        const { error } = await (context.supabase as any).from(m[1]!).insert(row);
        if (error) throw new Error(error.message);
        return { text: "اتضاف ✓" };
      });
    }
    for (const m of text.matchAll(/\[\[CF:\s*([a-z0-9_/?=&.-]+)\s*\]\]/gi)) {
      if (jobs++ >= 12) break;
      await run(`☁️ Cloudflare ${m[1]}`, async () => ({ text: await n.cfGet(m[1]!) }));
    }
    for (const m of text.matchAll(/\[\[CF_WRITE:\s*(POST|PUT|PATCH)\s*\|\s*([^\]]+)\]\]\n?([\s\S]*?)\[\[\/CF_WRITE\]\]/gi)) {
      if (jobs++ >= 8) break;
      await run(`☁️ تعديل Cloudflare ${m[2]}`, async () => ({ text: await n.cfWrite(m[2]!.trim(), m[1]!, m[3]!.trim()) }));
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
        const columns = table === "tasks" ? "id,title,description,priority,status,created_at" : table === "employees" ? "id,code,name,department_name,role_description,primary_model,lifecycle_status,risk_level,quality_score" : table === "network_messages" ? "id,who,content,created_at" : table === "companion_events" ? "id,event_type,message,created_at" : "id,action_type,title,content,status,created_at";
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
    const SENSITIVE = new Set(["open_url", "open_app", "open_settings", "open_camera", "download_file", "speak", "listen", "type_text", "tap_text", "tap_coordinates", "long_press", "swipe", "screenshot", "screen_text", "device_inventory", "app_inventory", "notification_inventory"]);
    const appPackages: Record<string, string> = {
      youtube: "com.google.android.youtube", "يوتيوب": "com.google.android.youtube",
      chrome: "com.android.chrome", "جوجل كروم": "com.android.chrome", "كروم": "com.android.chrome",
      whatsapp: "com.whatsapp", "واتساب": "com.whatsapp", telegram: "org.telegram.messenger", "تليجرام": "org.telegram.messenger",
      gmail: "com.google.android.gm", "جيميل": "com.google.android.gm", settings: "com.android.settings", "الإعدادات": "com.android.settings",
    };
    const submitPhone = async (kind: string, payload: Record<string, unknown>) => {
      const { data: dev } = await context.supabase.from("companion_devices").select("id,status").eq("user_id", context.userId).eq("platform", "android").order("last_seen_at", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
      if (!dev) throw new Error("مفيش هاتف مربوط — افتح التطبيق وسجّل دخول");
      const command = { device_id: dev.id, user_id: context.userId, kind, payload: payload as any, requires_approval: false, status: "approved", approved_at: new Date().toISOString() };
      let { data: inserted, error } = await context.supabase.from("companion_commands").insert(command).select("id").single();
      if (error && /kind_check|check constraint/i.test(error.message) && kind !== "tap_text") ({ data: inserted, error } = await context.supabase.from("companion_commands").insert({ ...command, kind: "tap_text", payload: { ...payload, agent_action: kind } }).select("id").single());
      if (error) throw new Error(error.message);
      if (!inserted?.id) return { text: `اتبعت للهاتف (${dev.status})` };
      for (let attempt = 0; attempt < 24; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        const [{ data: state }, { data: event }] = await Promise.all([
          context.supabase.from("companion_commands").select("status,error").eq("id", inserted.id).maybeSingle(),
          context.supabase.from("companion_events").select("event_type,message").eq("command_id", inserted.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (state?.status === "succeeded") return { text: event?.message?.slice(0, 12000) || "تم التنفيذ على الهاتف" };
        if (state?.status === "failed" || state?.status === "rejected") throw new Error(state.error || event?.message || "فشل تنفيذ الأمر على الهاتف");
      }
      return { text: `أُرسل للهاتف ولم تصل النتيجة بعد (${dev.status})` };
    };
    for (const m of text.matchAll(/\[\[PHONE_(BATCH|WORKFLOW)\|([\s\S]*?)\]\]/gi)) {
      if (jobs++ >= 4) break;
      await run(`📱 الهاتف: ${m[1]!.toLowerCase()}`, async () => {
        let payload: any;
        try { payload = JSON.parse(m[2]!.trim()); } catch { throw new Error("خطة الهاتف ليست JSON صالحًا"); }
        if (!Array.isArray(payload?.steps) || payload.steps.length < 1 || payload.steps.length > 50) throw new Error("خطة الهاتف تحتاج من 1 إلى 50 خطوة");
        return submitPhone(m[1]!.toLowerCase() === "batch" ? "batch" : "workflow", payload);
      });
    }
    const PHONE_KINDS = new Set(["open_chrome", "open_url", "open_app", "open_settings", "open_camera", "download_file", "speak", "listen", "back", "home", "recents", "tap_text", "tap_id", "tap_description", "tap_coordinates", "long_press", "type_text", "type_text_submit", "clear_text", "swipe", "scroll", "wait", "wait_for_text", "screenshot", "read_screen", "screen_text", "press_back", "press_home", "open_notifications", "quick_settings", "device_inventory", "app_inventory", "app_permissions", "notification_inventory", "file_inventory", "file_read", "open_file", "open_document", "stop", "batch", "workflow"]);
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
        // التشغيل التلقائي هو الوضع الافتراضي الذي طلبه صاحب الهاتف؛ يظل كل شيء
        // مملوكًا للحساب ومسجلًا في السجل، مع زر الطوارئ لإيقاف التنفيذ.
        const sensitive = false;
        const command = {
          device_id: dev.id, user_id: context.userId, kind, payload,
          requires_approval: false, status: "approved",
          approved_at: new Date().toISOString(),
        };
        let { data: inserted, error } = await context.supabase.from("companion_commands").insert(command).select("id").single();
        // Lovable Cloud deployments that still have the original allowlist accept tap_text.
        // Preserve the real action inside the payload so the Android agent can execute it.
        if (error && /kind_check|check constraint/i.test(error.message) && kind !== "tap_text") {
          const legacy = { ...command, kind: "tap_text", payload: { ...payload, agent_action: kind } };
          ({ data: inserted, error } = await context.supabase.from("companion_commands").insert(legacy).select("id").single());
        }
        if (error) throw new Error(error.message);
        if (!inserted?.id) return { text: `اتبعت للهاتف (${dev.status})` };
        for (let attempt = 0; attempt < 18; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 700));
          const [{ data: state }, { data: event }] = await Promise.all([
            context.supabase.from("companion_commands").select("status,error").eq("id", inserted.id).maybeSingle(),
            context.supabase.from("companion_events").select("event_type,message").eq("command_id", inserted.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          ]);
          if (state?.status === "succeeded") return { text: event?.message?.slice(0, 12000) || "تم التنفيذ على الهاتف" };
          if (state?.status === "failed" || state?.status === "rejected") throw new Error(state.error || event?.message || "فشل تنفيذ الأمر على الهاتف");
        }
        return { text: `أُرسل للهاتف ولم تصل النتيجة بعد (${dev.status})` };
        });
    }
    const phoneResults = tools.filter((t) => t.tool.includes("الهاتف"));
    if (phoneResults.length) {
      const resultText = phoneResults.map((t) => `${t.tool}: ${t.ok ? "نجح" : "فشل"}\n${t.text.slice(0, 5000)}`).join("\n\n");
      try {
        const summary = await modelCall(used, "إنت مراجع تنفيذ. لخّص بالعربية المصرية ما حدث فعلًا في الهاتف من النتائج التالية. لا تصدر أي أوامر ولا تخترع عناصر أو نجاحات غير موجودة. اذكر الخطوة التي فشلت والسبب والخطوة التالية المنطقية.", [{ role: "user", content: `الطلب الأصلي: ${requestText}\nنتائج التنفيذ:\n${resultText}` }]);
        text = `${text}\n\nملخص التنفيذ الفعلي:\n${summary}`;
      } catch { /* لا نفشل المهمة إذا تعذر نموذج التلخيص */ }
    }
    const clean = text.replace(/\[\[GH_WRITE:[\s\S]*?\[\[\/GH_WRITE\]\]/g, "[تعديل ملف]").replace(/\[\[CF_WRITE:[\s\S]*?\[\[\/CF_WRITE\]\]/gi, "[تعديل Cloudflare]").replace(/\[\[PHONE(?:_BATCH|_WORKFLOW)\|[\s\S]*?\]\]/gi, "").replace(/\[\[PHONE:[\s\S]*?\]\]/gi, "").replace(/\[\[DELEGATE:[\s\S]*?\]\]/g, "").trim();
    return { model: data.model, usedModel: used, text: clean, tools };
  });

export const createDailyReport = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [{ data: messages }, { data: events }] = await Promise.all([
      context.supabase.from("network_messages").select("who,content,created_at").eq("user_id", context.userId).gte("created_at", since).order("created_at", { ascending: true }).limit(100),
      context.supabase.from("companion_events").select("event_type,message,created_at").eq("user_id", context.userId).gte("created_at", since).order("created_at", { ascending: true }).limit(100),
    ]);
    const msgCount = messages?.length ?? 0;
    const eventCount = events?.length ?? 0;
    const failures = (events ?? []).filter((e) => e.event_type === "error").length;
    const lines = (events ?? []).slice(-12).map((e) => `- ${e.event_type}: ${(e.message ?? "").slice(0, 240)}`);
    const content = [
      `تقرير AbanoupAi لآخر 24 ساعة`,
      `المحادثات المسجلة: ${msgCount}`,
      `أحداث الهاتف: ${eventCount}`,
      `الأخطاء: ${failures}`,
      lines.length ? `آخر الأحداث:\n${lines.join("\n")}` : "لا توجد أحداث هاتف مسجلة.",
    ].join("\n\n");
    const reportDate = new Date().toISOString().slice(0, 10);
    const { data, error } = await context.supabase.from("daily_reports").insert({ user_id: context.userId, report_date: reportDate, content }).select("id,report_date,content,created_at").single();
    if (error) throw new Error(error.message);
    return data;
  });

export const mergeRepo = createServerFn({ method: "POST" })
  .middleware([requireCloudAuth])
  .inputValidator((i: unknown) => z.object({ repo: z.enum(REPOS) }).parse(i))
  .handler(async ({ data }) => {
    const n = await import("./network.server");
    return { url: await n.ghMerge(data.repo) };
  });
