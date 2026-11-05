// مكتبة مهارات الهاتف الجاهزة: كل مهارة = متسلسلة أوامر تُنفَّذ دفعة واحدة.
// صيغة الخطوات: "kind" أو "kind=قيمة" أو "kind={json}"، مفصولة بـ "|".
// العلامتان {a} و{b} تُستبدلان بوسائط المهارة.

export type SkillStep = { kind: string; payload: Record<string, unknown> };

const NO_ARG_KINDS = new Set([
  "open_chrome", "open_settings", "open_camera", "listen", "back", "home", "recents",
  "clear_text", "screenshot", "read_screen", "screen_text", "press_back", "press_home",
  "open_notifications", "quick_settings", "stop", "device_inventory", "app_inventory",
  "app_permissions", "notification_inventory", "file_inventory", "open_document",
]);

function buildPayload(kind: string, raw: string): Record<string, unknown> {
  if (raw.startsWith("{")) {
    try { return JSON.parse(raw) as Record<string, unknown>; } catch { throw new Error(`خطوة ${kind} ليست JSON صالحًا`); }
  }
  switch (kind) {
    case "open_app": return { app: raw };
    case "open_url": case "download_file": return { url: raw };
    case "search": return { text: raw, submit: "true" };
    case "type_text": return { text: raw };
    case "speak": return { text: raw };
    case "tap_text": case "tap_description": case "long_press": return { text: raw };
    case "tap_id": return { id: raw };
    case "scroll": return { direction: raw || "down" };
    case "wait": return { ms: Number(raw) || 1500 };
    case "wait_for_text": return { text: raw, timeoutMs: 9000 };
    case "file_read": case "open_file": return { path: raw };
    default: return raw ? { value: raw } : {};
  }
}

function parseSteps(spec: string, args: Record<string, string>): SkillStep[] {
  return spec.split("|").map((s) => s.trim()).filter(Boolean).map((s) => {
    const eq = s.indexOf("=");
    const kind = (eq === -1 ? s : s.slice(0, eq)).trim().toLowerCase();
    let raw = eq === -1 ? "" : s.slice(eq + 1).trim();
    raw = raw.replace(/\{a\}/g, args["a"] ?? "\u0000{a}").replace(/\{b\}/g, args["b"] ?? "\u0000{b}");
    if (raw.includes("{a}") || raw.includes("{b}")) {
      throw new Error(`المهارة تحتاج ${raw.includes("{b}") ? "الوسيط b" : "الوسيط a"} ولم يصل`);
    }
    if (raw === "" && !NO_ARG_KINDS.has(kind) && !["search", "wait"].includes(kind)) {
      throw new Error(`الخطوة ${kind} تحتاج قيمة`);
    }
    return { kind, payload: buildPayload(kind, raw) };
  });
}

// [المعرّف، الاسم بالعربية، الوسائط المطلوبة، الخطوات]
const RAW: [string, string, string, string][] = [
  // بحث ومعرفة
  ["google_search", "بحث Google وقراءة النتائج", "a", "open_chrome|search={a}|wait=3000|screen_text"],
  ["bing_search", "بحث Bing", "a", "open_url=https://www.bing.com/search?q={a}|wait=3000|screen_text"],
  ["duckduckgo_search", "بحث DuckDuckGo", "a", "open_url=https://duckduckgo.com/?q={a}|wait=3000|screen_text"],
  ["wikipedia_search", "بحث ويكيبيديا", "a", "open_url=https://ar.wikipedia.org/wiki/Special:Search?search={a}|wait=3000|screen_text"],
  ["google_news", "أحدث أخبار Google News", "", "open_url=https://news.google.com|wait=3500|screen_text"],
  ["weather_cairo", "طقس القاهرة الآن", "", "open_url=https://wttr.in/Cairo?format=3|screen_text"],
  ["weather_city", "طقس أي مدينة", "a", "open_url=https://wttr.in/{a}?format=3|screen_text"],
  ["translate", "ترجمة نص للعربية", "a", "open_url=https://translate.google.com/?sl=auto&tl=ar&text={a}&op=translate|wait=3000|screen_text"],
  ["currency_price", "سعر عملة أو سلعة", "a", "open_url=https://www.google.com/search?q=سعر+{a}|wait=3000|screen_text"],
  ["gold_price", "سعر الذهب اليوم", "", "open_url=https://www.google.com/search?q=سعر+الذهب+اليوم|wait=3000|screen_text"],
  ["stock_price", "سعر سهم", "a", "open_url=https://www.google.com/search?q={a}+stock|wait=3000|screen_text"],
  ["crypto_price", "سعر عملة رقمية", "a", "open_url=https://www.google.com/search?q={a}+price|wait=3000|screen_text"],
  ["football_scores", "نتائج المباريات اليوم", "", "open_url=https://www.google.com/search?q=نتائج+المباريات+اليوم|wait=3000|screen_text"],
  ["prayer_times", "مواقيت الصلاة", "", "open_url=https://www.google.com/search?q=مواقيت+الصلاة+القاهرة|wait=3000|screen_text"],
  ["perplexity_search", "بحث Perplexity", "a", "open_url=https://www.perplexity.ai/search?q={a}|wait=3500|screen_text"],
  ["scholar_search", "بحث أكاديمي Google Scholar", "a", "open_url=https://scholar.google.com/scholar?q={a}|wait=3000|screen_text"],
  ["books_search", "بحث كتب", "a", "open_url=https://www.google.com/search?tbm=bks&q={a}|wait=3000|screen_text"],
  ["maps_search", "بحث مكان على الخرائط", "a", "open_url=https://www.google.com/maps/search/{a}|wait=4000|screenshot"],
  ["maps_route", "مسار على الخرائط", "a", "open_url=https://www.google.com/maps/dir/{a}|wait=4000|screenshot"],
  ["youtube_search", "بحث يوتيوب وتشغيل", "a", "open_app=youtube|wait=2500|tap_description=بحث|search={a}|wait=3000|screenshot"],
  // تواصل اجتماعي
  ["whatsapp_open", "فتح واتساب", "", "open_app=whatsapp|wait=2500|screen_text"],
  ["whatsapp_message", "رسالة واتساب لشخص", "a b", "open_app=whatsapp|wait=2500|tap_description=بحث|type_text={a}|wait=1800|tap_text={a}|wait=1800|search={b}|wait=1500|screenshot"],
  ["telegram_open", "فتح تليجرام", "", "open_app=telegram|wait=2500|screen_text"],
  ["instagram_open", "فتح إنستجرام", "", "open_app=instagram|wait=2500|screen_text"],
  ["facebook_open", "فتح فيسبوك", "", "open_app=facebook|wait=2500|screen_text"],
  ["messenger_open", "فتح ماسنجر", "", "open_app=messenger|wait=2500|screen_text"],
  ["x_open", "فتح X تويتر", "", "open_url=https://x.com|wait=3500|screen_text"],
  ["x_search", "بحث على X", "a", "open_url=https://x.com/search?q={a}|wait=3500|screen_text"],
  ["tiktok_open", "فتح تيك توك", "", "open_app=tiktok|wait=2500|screen_text"],
  ["snapchat_open", "فتح سناب شات", "", "open_app=snapchat|wait=2500|screen_text"],
  ["linkedin_open", "فتح لينكدإن", "", "open_app=linkedin|wait=2500|screen_text"],
  ["linkedin_jobs", "بحث وظائف لينكدإن", "a", "open_url=https://www.linkedin.com/jobs/search/?keywords={a}|wait=4000|screen_text"],
  ["reddit_open", "فتح ريديت", "", "open_url=https://www.reddit.com|wait=3500|screen_text"],
  ["pinterest_open", "فتح بينتريست", "", "open_app=pinterest|wait=2500|screen_text"],
  ["discord_open", "فتح ديسكورد", "", "open_app=discord|wait=2500|screen_text"],
  ["slack_open", "فتح Slack", "", "open_app=slack|wait=2500|screen_text"],
  ["teams_open", "فتح Microsoft Teams", "", "open_app=teams|wait=2500|screen_text"],
  ["zoom_open", "فتح Zoom", "", "open_app=zoom|wait=2500|screen_text"],
  // وسائط وترفيه
  ["youtube_open", "فتح يوتيوب", "", "open_app=youtube|wait=2500|screen_text"],
  ["youtube_music_search", "بحث YouTube Music", "a", "open_url=https://music.youtube.com/search?q={a}|wait=3500|screenshot"],
  ["spotify_open", "فتح Spotify", "", "open_app=spotify|wait=2500|screen_text"],
  ["anghami_search", "بحث أنغامي", "a", "open_url=https://play.anghami.com/search?q={a}|wait=3500|screen_text"],
  ["soundcloud_search", "بحث SoundCloud", "a", "open_url=https://soundcloud.com/search?q={a}|wait=3500|screen_text"],
  ["netflix_open", "فتح Netflix", "", "open_app=netflix|wait=2500|screen_text"],
  ["shahid_open", "فتح شاهد", "", "open_app=shahid|wait=2500|screen_text"],
  ["primevideo_open", "فتح Prime Video", "", "open_app=prime video|wait=2500|screen_text"],
  ["watchit_open", "فتح Watch iT", "", "open_app=watchit|wait=2500|screen_text"],
  ["vimeo_open", "فتح Vimeo", "", "open_url=https://vimeo.com|wait=3500|screen_text"],
  // تسوق
  ["amazon_search", "بحث أمازون", "a", "open_url=https://www.amazon.eg/s?k={a}|wait=4000|screenshot"],
  ["noon_search", "بحث نون", "a", "open_url=https://www.noon.com/egypt-en/search/?q={a}|wait=4000|screenshot"],
  ["jumia_search", "بحث جوميا", "a", "open_url=https://www.jumia.com.eg/catalog/?q={a}|wait=4000|screenshot"],
  ["aliexpress_search", "بحث علي إكسبريس", "a", "open_url=https://www.aliexpress.com/w/wholesale-{a}.html|wait=4000|screenshot"],
  ["ebay_search", "بحث إيباي", "a", "open_url=https://www.ebay.com/sch/i.html?_nkw={a}|wait=4000|screenshot"],
  ["shein_search", "بحث شي إن", "a", "open_url=https://www.shein.com/pdsearch/{a}|wait=4000|screenshot"],
  ["google_shopping", "بحث تسوق Google", "a", "open_url=https://www.google.com/search?tbm=shop&q={a}|wait=3500|screenshot"],
  ["temu_search", "بحث Temu", "a", "open_url=https://www.temu.com/search_result.html?search_key={a}|wait=4000|screenshot"],
  ["2b_search", "بحث 2B الإلكترونيات", "a", "open_url=https://2b.com.eg/en/search?q={a}|wait=4000|screenshot"],
  ["talabat_open", "فتح طلبات", "", "open_app=talabat|wait=2500|screen_text"],
  // تعلم
  ["coursera_open", "فتح Coursera", "", "open_url=https://www.coursera.org|wait=3500|screen_text"],
  ["udemy_search", "بحث كورسات Udemy", "a", "open_url=https://www.udemy.com/courses/search/?q={a}|wait=3500|screen_text"],
  ["khan_open", "فتح أكاديمية خان", "", "open_url=https://ar.khanacademy.org|wait=3500|screen_text"],
  ["duolingo_open", "فتح دوولينجو", "", "open_app=duolingo|wait=2500|screen_text"],
  ["quizlet_search", "بحث Quizlet", "a", "open_url=https://quizlet.com/search?query={a}|wait=3500|screen_text"],
  ["geeksforgeeks_search", "بحث GeeksforGeeks", "a", "open_url=https://www.geeksforgeeks.org/search/?gq={a}|wait=3500|screen_text"],
  ["w3schools_search", "بحث W3Schools", "a", "open_url=https://www.w3schools.com/search/?q={a}|wait=3500|screen_text"],
  ["mdn_docs", "بحث توثيق MDN", "a", "open_url=https://developer.mozilla.org/ar/search?q={a}|wait=3500|screen_text"],
  ["chatgpt_open", "فتح ChatGPT", "", "open_url=https://chatgpt.com|wait=3500|screen_text"],
  ["gemini_open", "فتح Gemini", "", "open_url=https://gemini.google.com|wait=3500|screen_text"],
  ["claude_open", "فتح Claude", "", "open_url=https://claude.ai|wait=3500|screen_text"],
  // إنتاجية وبريد
  ["gmail_open", "فتح Gmail وقراءة آخر الإيميلات", "", "open_app=gmail|wait=3000|screen_text"],
  ["gmail_compose", "كتابة إيميل جديد", "a", "open_url=https://mail.google.com/mail/u/0/#compose|wait=3000|tap_description=إلى|type_text={a}|screenshot"],
  ["outlook_open", "فتح Outlook", "", "open_app=outlook|wait=2500|screen_text"],
  ["calendar_open", "فتح تقويم Google", "", "open_url=https://calendar.google.com|wait=3500|screen_text"],
  ["keep_note", "تدوين ملاحظة سريعة", "a", "open_app=keep|wait=2500|tap_description=إضافة|type_text={a}|screenshot"],
  ["drive_open", "فتح Google Drive", "", "open_app=drive|wait=2500|screen_text"],
  ["dropbox_open", "فتح Dropbox", "", "open_app=dropbox|wait=2500|screen_text"],
  ["onedrive_open", "فتح OneDrive", "", "open_url=https://onedrive.live.com|wait=3500|screen_text"],
  ["notion_open", "فتح Notion", "", "open_app=notion|wait=2500|screen_text"],
  ["todoist_open", "فتح Todoist", "", "open_url=https://todoist.com|wait=3500|screen_text"],
  // عمليات الجهاز
  ["settings_open", "فتح الإعدادات", "", "open_settings|wait=2000|screen_text"],
  ["settings_find", "بحث في الإعدادات", "a", "open_settings|wait=2000|tap_text={a}|wait=2000|screen_text"],
  ["wifi_settings", "فتح إعدادات Wi-Fi", "", "open_settings|wait=2000|tap_text=Wi-Fi|wait=2000|screen_text"],
  ["bluetooth_settings", "فتح إعدادات بلوتوث", "", "open_settings|wait=2000|tap_text=بلوتوث|wait=2000|screen_text"],
  ["screenshot_now", "لقطة شاشة الآن", "", "screenshot"],
  ["screen_read", "قراءة نص الشاشة", "", "screen_text"],
  ["screen_read_full", "قراءة كاملة لعناصر الشاشة", "", "read_screen"],
  ["wait_for", "انتظر نصًا محددًا ثم اقرأ الشاشة", "a", "wait_for_text={a}|screen_text"],
  ["notifications_check", "فحص الإشعارات الحالية", "", "open_notifications|wait=2000|screen_text|press_back"],
  ["quick_settings_open", "فتح الإعدادات السريعة", "", "quick_settings|wait=2000|screen_text|press_back"],
  ["downloads_open", "فتح التنزيلات", "", "open_app=downloads|wait=2500|screen_text"],
  ["camera_photo", "فتح الكاميرا", "", "open_camera|wait=2500|screen_text"],
  ["file_read_skill", "قراءة ملف من الهاتف", "a", "file_read={a}"],
  ["open_file_skill", "فتح ملف من الهاتف", "a", "open_file={a}|wait=2500|screenshot"],
  ["open_document", "فتح مستند حديث", "", "open_document|wait=2500|screen_text"],
  ["device_inventory", "جرد الجهاز", "", "device_inventory"],
  ["app_inventory", "جرد التطبيقات المثبتة", "", "app_inventory"],
  ["app_permissions", "جرد صلاحيات التطبيقات", "", "app_permissions"],
  ["notification_inventory", "جرد إشعارات النظام", "", "notification_inventory"],
  ["file_inventory", "جرد الملفات", "", "file_inventory"],
  ["app_open", "فتح أي تطبيق بالاسم", "a", "open_app={a}|wait=2500|screen_text"],
  ["phone_home", "الرجوع للشاشة الرئيسية", "", "press_home"],
  ["phone_back", "رجوع خطوة واحدة", "", "press_back"],
  ["scroll_down", "تمرير للأسفل ثم قراءة", "", "scroll=down|screen_text"],
  ["scroll_up", "تمرير للأعلى ثم قراءة", "", "scroll=up|screen_text"],
  ["type_and_send", "كتابة في الحقل المفتوح وإرسال", "a", "type_text={a}|wait=1200|screenshot"],
  ["clear_and_type", "تفريغ الحقل والكتابة", "a", "clear_text|type_text={a}|wait=1000|screen_text"],
  ["open_chrome_home", "فتح متصفح كروم", "", "open_chrome|wait=3000|screen_text"],
  ["download_file_skill", "تنزيل ملف من رابط", "a", "download_file={a}|wait=4000|screen_text"],
  ["screen_audit", "قراءة شاملة: نص + عناصر + لقطة", "", "screen_text|read_screen|screenshot"],
];

export type AgentSkill = { id: string; title: string; needs: string[]; spec: string };

export const AGENT_SKILLS: AgentSkill[] = RAW.map(([id, title, needs, spec]) => ({
  id,
  title,
  needs: needs ? needs.split(" ") : [],
  spec,
}));

export const SKILL_IDS = new Set(AGENT_SKILLS.map((s) => s.id));

/** يوسّع معرف مهارة إلى خطوات هاتف جاهزة مع استبدال الوسائط. */
export function expandSkill(id: string, args: Record<string, unknown> = {}): SkillStep[] {
  const skill = AGENT_SKILLS.find((s) => s.id === id);
  if (!skill) {
    const sample = AGENT_SKILLS.slice(0, 8).map((s) => s.id).join("، ");
    throw new Error(`مهارة غير معروفة: ${id}. أمثلة: ${sample}…`);
  }
  const strArgs: Record<string, string> = {};
  for (const k of ["a", "b"] as const) {
    const v = args[k];
    if (v !== undefined && v !== null) strArgs[k] = String(v);
  }
  for (const need of skill.needs) {
    if (!strArgs[need]) throw new Error(`المهارة ${skill.id} (${skill.title}) تحتاج الوسيط ${need}`);
  }
  return parseSteps(skill.spec, strArgs);
}

export const SKILL_PROMPT = AGENT_SKILLS.map((s) => `${s.id} (${s.title}${s.needs.length ? ` — يحتاج ${s.needs.join(" و")}` : ""})`).join("\n");
