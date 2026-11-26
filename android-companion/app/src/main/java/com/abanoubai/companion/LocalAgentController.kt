package com.abanoubai.companion

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.ContextCompat
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.util.Locale

/**
 * Lightweight phone command router. Known commands use deterministic handlers;
 * complex unknown requests are delegated to the cloud page when connected.
 */
object LocalAgentController {
    private const val PREFS = "companion"
    private const val PENDING = "offline_agent_pending"
    private const val PENDING_PLAN = "offline_agent_pending_plan"
    private const val PENDING_REASON = "offline_agent_pending_reason"
    @Volatile private var qwen: QwenEngine? = null

    fun handle(context: Context, spoken: String): String {
        val text = spoken.trim()
        if (text.isBlank()) return "لم أسمع أمرًا واضحًا"
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val pendingPlan = prefs.getString(PENDING_PLAN, null)
        if (pendingPlan != null) {
            if (isAffirmative(text)) {
                val steps = runCatching { Json.parseToJsonElement(pendingPlan) as JsonArray }.getOrNull()
                prefs.edit().remove(PENDING_PLAN).remove(PENDING_REASON).apply()
                if (steps != null) return run(context, "batch", buildJsonObject { put("steps", steps); put("return_to_chat", "true") })
                return "الخطة المؤجلة غير صالحة؛ لم أنفذها."
            }
            if (isNegative(text)) {
                prefs.edit().remove(PENDING_PLAN).remove(PENDING_REASON).apply()
                return "ألغيت الخطة ولم أنفذ الأمر."
            }
            // Neither yes nor no: the user moved on. Drop the risky plan and handle the new request.
            prefs.edit().remove(PENDING_PLAN).remove(PENDING_REASON).apply()
        }
        // Keep local listening alive even when Android recreates the activity.
        runCatching { ContextCompat.startForegroundService(context, Intent(context, CompanionForegroundService::class.java)) }
        val command = stripWakeWord(text)
        val lower = command.lowercase(Locale.ROOT)
        Regex("(?:احفظ|سجل)\\s+(.+?)\\s+(?:باسم|كاسم)\\s+(.+)", RegexOption.IGNORE_CASE).find(command)?.let {
            LocalLearning.rememberContact(context, it.groupValues[2].trim(), it.groupValues[1].trim())
            return "حفظت ${it.groupValues[2].trim()} في ذاكرة الهاتف المحلية."
        }

        if (containsAny(lower, "حالتي", "ملخص", "اعمل ايه", "عمل ايه", "البطارية", "الشبكة", "النت")) {
            return DeviceInventory.device(context)
        }
        if (containsAny(lower, "حالة النموذج", "الموديل المحلي", "النموذج المحلي", "model status")) {
            val engine = qwen ?: synchronized(this) { qwen ?: QwenEngine(context).also { qwen = it } }
            return engine.status()
        }
        if (containsAny(lower, "التطبيقات المثبتة", "كل التطبيقات", "قائمة التطبيقات")) {
            return "لا أستعرض قائمة التطبيقات المثبتة. اذكر اسم التطبيق الذي تريد فتحه."
        }
        if (containsAny(lower, "صلاحيات التطبيق", "الصلاحيات", "permissions")) {
            return "لا أفحص صلاحيات التطبيقات الأخرى. يمكنك مراجعة صلاحيات كل تطبيق من إعدادات Android."
        }
        if (containsAny(lower, "الملفات", "فحص الملفات", "الصور", "الفيديوهات")) {
            run(context, "open_document", buildPayload())
            return "فتحت منتقي Android للملفات. اختر الملف بنفسك؛ لا أفهرس ملفات الهاتف."
        }
        if (containsAny(lower, "الإشعارات", "الرسائل الأخيرة", "اشعارات")) {
            return "لا أقرأ محتوى الإشعارات أو الرسائل. افتح لوحة الإشعارات يدويًا من Android."
        }
        if (containsAny(lower, "لقطة شاشة", "سكرين شوت", "screenshot")) {
            return "قراءة أو التقاط شاشات التطبيقات الأخرى غير مدعومة حفاظًا على الخصوصية."
        }

        if (containsAny(lower, "افتح الكاميرا", "شغل الكاميرا", "شغّل الكاميرا", "الكاميرا")) {
            return run(context, "open_camera", buildPayload())
        }
        if (containsAny(lower, "افتح الواي فاي", "إعدادات الواي فاي", "wifi")) {
            return run(context, "open_settings", buildPayload("setting" to "wifi"))
        }
        if (containsAny(lower, "افتح البلوتوث", "إعدادات البلوتوث", "bluetooth")) {
            return run(context, "open_settings", buildPayload("setting" to "bluetooth"))
        }
        if (containsAny(lower, "افتح إعدادات إمكانية الوصول", "إعدادات إمكانية الوصول", "accessibility")) {
            return "لا نستخدم خدمات Accessibility العامة ولا نطلب صلاحيتها؛ استخدم إعدادات Android المعتادة."
        }

        // Open YouTube only; the user performs any search inside the other app.
        if (containsAny(lower, "يوتيوب", "youtube") && containsAny(lower, "ابحث", "بحث", "عن", "أغنية", "اغنية")) {
            val opened = run(context, "open_app", buildPayload("package" to "com.google.android.youtube"))
            return "$opened. اكتب عبارة البحث بنفسك داخل YouTube؛ لا أقرأ أو أتحكم في شاشة تطبيق آخر."
        }

        val app = appPackages.entries.firstOrNull { (name, _) -> lower.contains(name) }
        if (app != null && containsAny(lower, "افتح", "شغل", "شغّل", "launch", "open")) {
            return run(context, "open_app", buildPayload("package" to app.value))
        }

        val url = Regex("https?://\\S+|www\\.\\S+", RegexOption.IGNORE_CASE)
            .find(command)?.value?.trimEnd('،', '.', ')')
        if (url != null && containsAny(lower, "افتح", "اذهب", "رابط", "open", "go")) {
            val normalized = if (url.startsWith("www.", true)) "https://$url" else url
            return run(context, "open_url", buildPayload("url" to normalized))
        }

        if (containsAny(lower, "ارجع", "رجوع", "back", "الرئيسية", "الشاشة الرئيسية", "home", "التطبيقات الأخيرة", "التطبيقات المفتوحة", "recents")) {
            return "استخدم أزرار التنقل في Android؛ لا أتحكم في أزرار النظام العامة."
        }

        if (containsAny(lower, "النوتة", "النوت", "الملاحظات", "note", "notepad") &&
            containsAny(lower, "افتح", "شغل", "اكتب", "اكتبي", "دوّن", "دون")) {
            val opened = run(context, "open_note", buildPayload())
            return "$opened. اكتب النص بنفسك داخل تطبيق الملاحظات؛ لا أتحكم في شاشة تطبيق آخر."
        }

        // Real local LLM planner. It is loaded lazily and never calls the network.
        val engine = qwen ?: synchronized(this) { qwen ?: QwenEngine(context).also { qwen = it } }
        val phoneContext = PhoneContext.snapshot(context)
        val planned = runCatching { OfflinePlan.fromModel(engine.plan(command, phoneContext, LocalLearning.rag(context, command))) }.getOrNull()
        if (planned != null) {
            val reason = confirmationReason(planned, command)
            if (reason != null) {
                prefs.edit().putString(PENDING_PLAN, planned.toString()).putString(PENDING_REASON, reason).apply()
                return "الخطة جاهزة، لكن فيها خطوة قد تؤثر على شخص أو بيانات خارجية. $reason\nهل أنت متأكد؟ رد بآه أو تمام للتنفيذ، أو لا أو بلاش للإلغاء."
            }
            val verified = engine.verifyPlan(command, planned.toString(), phoneContext)
            if (!verified) {
                val retry = runCatching { OfflinePlan.fromModel(engine.plan("صحح الخطة السابقة واجعلها قابلة للتنفيذ: $command", phoneContext, LocalLearning.rag(context, command))) }.getOrNull()
                if (retry != null) return executePlanned(context, command, retry, engine, false)
            }
            return executePlanned(context, command, planned, engine)
        }

        // Local conversational fallback, still offline and never a fake execution claim.
        val localReply = runCatching {
            val engine = qwen ?: synchronized(this) { qwen ?: QwenEngine(context).also { qwen = it } }
            engine.chat(command)
        }.getOrDefault("")
        if (localReply.isNotBlank()) return "📱 محلي Offline\n$localReply"

        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString(PENDING, command.take(2000)).apply()
        return "حفظت الطلب محليًا. الأوامر الأساسية تعمل بدون إنترنت، أما هذا الطلب فيحتاج نموذجًا محليًا مدمجًا أو اتصالًا سحابيًا عند عودة الشبكة."
    }

    fun selectModel(context: Context, id: String): String {
        val engine = qwen ?: synchronized(this) { qwen ?: QwenEngine(context).also { qwen = it } }
        return engine.selectModel(id)
    }

    private fun executePlanned(context: Context, request: String, steps: JsonArray, engine: QwenEngine, allowRetry: Boolean = true): String {
        val result = run(context, "batch", buildJsonObject { put("steps", steps); put("return_to_chat", "true") })
        if (allowRetry && (result.lowercase(Locale.ROOT).contains("failed") || result.contains("فشل"))) {
            val corrected = runCatching {
                OfflinePlan.fromModel(engine.plan("أعد التخطيط باستخدام فتح تطبيق أو رابط أو إعداد مسموح فقط، ولا تحاول النقر أو الكتابة داخل تطبيق آخر: $request", PhoneContext.snapshot(context), LocalLearning.rag(context, request)))
            }.getOrNull()
            if (corrected != null) return executePlanned(context, request, corrected, engine, false)
        }
        if (!result.lowercase(Locale.ROOT).contains("failed") && !result.contains("فشل")) LocalLearning.rememberSuccess(context, request, steps.toString())
        return result
    }

    fun pending(context: Context): String? = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(PENDING, null)

    fun clearPending(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(PENDING).remove(PENDING_PLAN).remove(PENDING_REASON).apply()

    private fun normalizeReply(text: String): String = text.lowercase(Locale.ROOT)
        .replace(Regex("[أإآ]"), "ا").replace("ى", "ي").replace("ة", "ه")
        .replace(Regex("[^\\p{L}\\p{N}\\s]"), " ").replace(Regex("\\s+"), " ").trim()

    private val YES_WORDS = setOf("نعم", "ايوه", "ايوا", "اه", "ااه", "يس", "yes", "y", "ok", "okay", "اوك", "اوكي",
        "تمام", "موافق", "وافق", "نفذ", "نفذه", "نفذها", "كمل", "يلا", "اكيد", "طبعا", "ماشي", "اكد", "متاكد", "go", "sure")
    private val NO_WORDS = setOf("لا", "لاء", "no", "n", "الغاء", "الغي", "الغيه", "بلاش", "ارفض", "رفض", "مرفوض", "وقف",
        "اوقف", "استني", "cancel", "stop", "متنفذش", "ماتنفذش", "مش")

    private fun replyWords(text: String): List<String> = normalizeReply(text).split(" ").filter { it.isNotBlank() }

    /** Short reply (up to 4 words) that signals approval and contains no refusal word. */
    private fun isAffirmative(text: String): Boolean {
        val words = replyWords(text)
        if (words.isEmpty() || words.size > 4) return false
        return words.none { it in NO_WORDS } && words.any { it in YES_WORDS }
    }

    private fun isNegative(text: String): Boolean {
        val words = replyWords(text)
        if (words.isEmpty() || words.size > 4) return false
        return words.any { it in NO_WORDS }
    }

    private fun confirmationReason(steps: JsonArray, request: String): String? {
        val lower = request.lowercase(Locale.ROOT)
        if (containsAny(lower, "بحث", "ابحث", "search")) return null
        steps.forEach { item ->
            val step = item as? JsonObject ?: return@forEach
            val kind = step["kind"]?.toString()?.trim('"').orEmpty()
            val payload = step["payload"]?.toString().orEmpty().lowercase(Locale.ROOT)
            // Only truly risky effects need a "yes": sending to others, deleting, paying,
            // uninstalling, or factory/password changes. Everything else runs directly.
            if (
                containsAny(payload, "إرسال", "ارسال", "send", "حذف", "امسح", "delete",
                    "شراء", "اشتري", "دفع", "payment", "purchase",
                    "uninstall", "factory", "ضبط المصنع", "كلمة السر", "password")) {
                return "قد يؤدي هذا إلى إرسال أو حذف أو شراء، وهذا أثر لا يمكنني افتراض أنك تريده من دون تأكيد صريح."
            }
        }
        return null
    }

    private fun run(context: Context, kind: String, payload: JsonObject): String {
        val record = buildJsonObject { put("payload", payload) }
        return CommandExecutor.execute(context, kind, record)
    }

    private fun buildPayload(vararg values: Pair<String, String>): JsonObject = buildJsonObject {
        values.forEach { (key, value) -> put(key, value) }
    }

    private fun stripWakeWord(text: String): String = text
        .replace(Regex("abanoupai|أبانوباي|أبانوب اي|ابانوباي", RegexOption.IGNORE_CASE), "")
        .trim()

    private fun containsAny(text: String, vararg words: String): Boolean = words.any { text.contains(it) }

    private val appPackages = linkedMapOf(
        "يوتيوب" to "com.google.android.youtube",
        "youtube" to "com.google.android.youtube",
        "كروم" to "com.android.chrome",
        "chrome" to "com.android.chrome",
        "واتساب" to "com.whatsapp",
        "whatsapp" to "com.whatsapp",
        "تليجرام" to "org.telegram.messenger",
        "telegram" to "org.telegram.messenger",
        "جيميل" to "com.google.android.gm",
        "gmail" to "com.google.android.gm",
        "الإعدادات" to "com.android.settings",
        "settings" to "com.android.settings",
    )
}
