package com.abanoubai.companion

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.core.content.ContextCompat
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.util.Locale

/**
 * Offline command router. Known commands use deterministic fallbacks; unknown
 * requests are planned by the embedded Qwen model and then validated locally.
 */
object LocalAgentController {
    private const val PREFS = "companion"
    private const val PENDING = "offline_agent_pending"
    @Volatile private var qwen: QwenEngine? = null

    fun handle(context: Context, spoken: String): String {
        val text = spoken.trim()
        if (text.isBlank()) return "لم أسمع أمرًا واضحًا"
        // Keep local listening alive even when Android recreates the activity.
        runCatching { ContextCompat.startForegroundService(context, Intent(context, CompanionForegroundService::class.java)) }
        val command = stripWakeWord(text)
        val lower = command.lowercase(Locale.ROOT)

        if (containsAny(lower, "حالتي", "ملخص", "اعمل ايه", "عمل ايه", "البطارية", "الشبكة", "النت")) {
            return DeviceInventory.device(context)
        }
        if (containsAny(lower, "الملفات", "فحص الملفات", "الصور", "الفيديوهات")) {
            return DeviceInventory.files(context)
        }
        if (containsAny(lower, "الإشعارات", "الرسائل الأخيرة", "اشعارات")) {
            return if (NotificationInbox.enabled) DeviceInventory.notifications() else "فعّل الوصول إلى الإشعارات أولًا من إعدادات AbanoubAI"
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
            return run(context, "open_settings", buildPayload("setting" to "accessibility"))
        }

        // Offline planner for the common multi-step request: open YouTube and search.
        if (containsAny(lower, "يوتيوب", "youtube") && containsAny(lower, "ابحث", "بحث", "عن", "أغنية", "اغنية")) {
            val query = ((Regex("(?:عن|على|في)\\s+(.+)", RegexOption.IGNORE_CASE).find(command)?.groupValues?.getOrNull(1)?.trim() ?: "")
                .ifBlank { command.replace(Regex(".*?(يوتيوب|youtube)", RegexOption.IGNORE_CASE), "").trim() })
                .take(300)
            if (query.isNotBlank()) {
                val steps = buildJsonArray {
                    add(buildJsonObject { put("kind", "open_app"); put("payload", buildPayload("package" to "com.google.android.youtube")) })
                    add(buildJsonObject { put("kind", "wait"); put("payload", buildPayload("ms" to "1200")) })
                    add(buildJsonObject { put("kind", "tap_description"); put("if_text", "بحث"); put("payload", buildPayload("text" to "بحث")) })
                    add(buildJsonObject { put("kind", "tap_description"); put("if_text", "Search"); put("payload", buildPayload("text" to "Search")) })
                    add(buildJsonObject { put("kind", "type_text"); put("payload", buildPayload("text" to query, "submit" to "true")) })
                }
                return run(context, "batch", buildJsonObject { put("steps", steps); put("return_to_chat", "true") })
            }
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

        val global = when {
            containsAny(lower, "ارجع", "رجوع", "back") -> "back"
            containsAny(lower, "الرئيسية", "الشاشة الرئيسية", "home") -> "home"
            containsAny(lower, "التطبيقات الأخيرة", "التطبيقات المفتوحة", "recents") -> "recents"
            else -> null
        }
        if (global != null) return run(context, global, buildPayload())

        // Deterministic safety nets for the most common underspecified requests.
        if (containsAny(lower, "النوتة", "النوت", "الملاحظات", "note", "notepad") &&
            containsAny(lower, "افتح", "شغل", "اكتب", "اكتبي")) {
            val noteText = Regex("(?:اكتب|اكتبي|دوّن|دون)\\s+(.+)", RegexOption.IGNORE_CASE)
                .find(command)?.groupValues?.getOrNull(1)?.trim()
            val steps = buildJsonArray {
                add(buildJsonObject { put("kind", "open_note"); put("payload", buildPayload()) })
                add(buildJsonObject { put("kind", "wait"); put("payload", buildPayload("ms" to "1200")) })
                if (!noteText.isNullOrBlank()) add(buildJsonObject { put("kind", "type_text"); put("payload", buildPayload("text" to noteText)) })
            }
            return run(context, "batch", buildJsonObject { put("steps", steps); put("return_to_chat", "true") })
        }

        // Real local LLM planner. It is loaded lazily and never calls the network.
        val planned = runCatching {
            val engine = qwen ?: synchronized(this) { qwen ?: QwenEngine(context).also { qwen = it } }
            OfflinePlan.fromModel(engine.plan(command, PhoneContext.snapshot(context)))
        }.getOrNull()
        if (planned != null) {
            return run(context, "batch", buildJsonObject { put("steps", planned); put("return_to_chat", "true") })
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

    fun pending(context: Context): String? = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(PENDING, null)

    fun clearPending(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(PENDING).apply()

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
