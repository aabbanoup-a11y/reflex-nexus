package com.abanoubai.companion

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

/** Strict, local-only plan boundary. The model may suggest steps, but never new capabilities. */
object OfflinePlan {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }
    private val allowed = setOf(
        "open_app", "open_note", "open_url", "tap_text", "tap_description", "type_text",
        "press_enter", "press_search", "clear_text", "wait", "wait_for_text", "back",
        "home", "recents", "scroll", "press_back", "press_home"
    )

    fun fromModel(raw: String): JsonArray? {
        val candidate = raw.substringAfter("```json", raw).substringAfter("```").substringBeforeLast("```").trim()
        val start = candidate.indexOf('{').takeIf { it >= 0 } ?: candidate.indexOf('[')
        if (start < 0) return null
        val text = candidate.substring(start)
        return runCatching {
            val element = json.parseToJsonElement(text)
            val steps = when (element) {
                is JsonArray -> element
                is JsonObject -> element["steps"] as? JsonArray
                else -> null
            } ?: return null
            validate(steps)
        }.getOrNull()
    }

    fun validate(steps: JsonArray): JsonArray? {
        if (steps.isEmpty() || steps.size > 12) return null
        val valid = buildJsonArray {
            steps.forEach { item ->
                val step = item as? JsonObject ?: return@forEach
                val kind = step["kind"]?.jsonPrimitive?.contentOrNull ?: return@forEach
                if (kind !in allowed) return@forEach
                val payload = step["payload"] as? JsonObject ?: buildJsonObject { }
                if (kind == "type_text" && payload["text"]?.jsonPrimitive?.contentOrNull.isNullOrBlank()) return@forEach
                if ((kind == "tap_text" || kind == "tap_description" || kind == "wait_for_text") && payload["text"]?.jsonPrimitive?.contentOrNull.isNullOrBlank()) return@forEach
                add(buildJsonObject {
                    put("kind", kind)
                    put("payload", payload)
                    step["if_text"]?.let { put("if_text", it) }
                    step["unless_text"]?.let { put("unless_text", it) }
                    step["repeat"]?.let { put("repeat", it) }
                })
            }
        }
        return valid.takeIf { it.size == steps.size }
    }

    fun prompt(request: String, phoneContext: String = "{}"): String = """
أنت مخطط أوفلاين للهاتف. حوّل طلب المستخدم إلى JSON فقط بلا شرح.
الشكل الإجباري: {"steps":[{"kind":"...","payload":{}}]}
الأوامر المسموحة فقط: open_app(package), open_note(), open_url(url), tap_text(text), tap_description(text), type_text(text,submit), press_enter(), press_search(), clear_text(), wait(ms), wait_for_text(text,timeout_ms), back(), home(), recents(), scroll(dir), press_back(), press_home().
لا تخترع package. استخدم هذه الحزم المعروفة فقط: YouTube=com.google.android.youtube, Chrome=com.android.chrome, WhatsApp=com.whatsapp, Telegram=org.telegram.messenger, Gmail=com.google.android.gm, Settings=com.android.settings.
بعد فتح التطبيق انتظر 1200ms. بعد الكتابة استخدم submit=true إذا كان المطلوب إرسال/بحث، وإلا أضف press_enter عند الحاجة. اجعل الخطة 1 إلى 8 خطوات.
حالة الهاتف الحالية (محلية فقط): $phoneContext
إذا كانت الحالة لا تحتوي على تطبيق أو عنصر مناسب، لا تخترع نتيجة؛ استخدم خطوة انتظار أو خطة آمنة قصيرة.
طلب المستخدم: $request
JSON:
""".trimIndent()
}
