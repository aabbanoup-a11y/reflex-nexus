package com.abanoubai.companion

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.util.Locale

/**
 * Small offline command router. It is intentionally deterministic: it can run
 * without the cloud, but it never pretends to be a local copy of the 50 cloud
 * models. Unknown requests are saved as pending text for the cloud agent.
 */
object LocalAgentController {
    private const val PREFS = "companion"
    private const val PENDING = "offline_agent_pending"

    fun handle(context: Context, spoken: String): String {
        val text = spoken.trim()
        if (text.isBlank()) return "لم أسمع أمرًا واضحًا"
        val command = stripWakeWord(text)
        val lower = command.lowercase(Locale.ROOT)

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

        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString(PENDING, command.take(2000)).apply()
        return "حفظت الطلب محليًا. عند عودة الاتصال سيعالجه AbanoupAi السحابي؛ هذا الطلب غير معروف للوكيل المحلي الآن."
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
