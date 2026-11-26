package com.abanoubai.companion

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

object OfflinePlan {
    private val json = Json { ignoreUnknownKeys = true; isLenient = true }
    private val allowed = setOf("open_app", "open_note", "open_url", "open_camera", "open_settings", "open_document", "speak", "wait")
    private val allowedPackages = setOf(
        "com.google.android.youtube",
        "com.android.chrome",
        "com.whatsapp",
        "org.telegram.messenger",
        "com.google.android.gm",
        "com.android.settings"
    )
    private val allowedSettings = setOf("battery", "wifi", "bluetooth", "app")

    fun fromModel(raw: String): JsonArray? {
        val candidate = raw.substringAfter("```json", raw).substringAfter("```").substringBeforeLast("```").trim()
        val start = candidate.indexOf('{').takeIf { it >= 0 } ?: candidate.indexOf('[')
        if (start < 0) return null
        return runCatching {
            val element = json.parseToJsonElement(candidate.substring(start))
            val steps = when (element) { is JsonArray -> element; is JsonObject -> element["steps"] as? JsonArray; else -> null } ?: return null
            validate(steps)
        }.getOrNull()
    }

    fun validate(steps: JsonArray): JsonArray? {
        if (steps.isEmpty() || steps.size > 8) return null
        val valid = buildJsonArray {
            steps.forEach { item ->
                val step = item as? JsonObject ?: return@forEach
                val kind = step["kind"]?.jsonPrimitive?.contentOrNull ?: return@forEach
                if (kind !in allowed) return@forEach
                val payload = step["payload"] as? JsonObject ?: buildJsonObject { }
                val safePayload = when (kind) {
                    "open_app" -> payload["package"]?.jsonPrimitive?.contentOrNull?.let { it in allowedPackages } == true
                    "open_url" -> payload["url"]?.jsonPrimitive?.contentOrNull?.let {
                        it.length <= 2048 && (it.startsWith("https://") || it.startsWith("http://"))
                    } == true
                    "open_settings" -> payload["setting"]?.jsonPrimitive?.contentOrNull?.let { it in allowedSettings } == true
                    "wait" -> payload["ms"]?.jsonPrimitive?.contentOrNull?.toLongOrNull()?.let { it in 0L..10000L } == true
                    "speak" -> payload["text"]?.jsonPrimitive?.contentOrNull?.let { it.isNotBlank() && it.length <= 4000 } == true
                    else -> true
                }
                if (!safePayload) return@forEach
                add(buildJsonObject { put("kind", kind); put("payload", payload) })
            }
        }
        return valid.takeIf { it.size == steps.size }
    }

    fun prompt(request: String, phoneContext: String = "{}", rag: String = ""): String = """
أنت مخطط أوفلاين للهاتف. حوّل طلب المستخدم إلى JSON فقط بلا شرح.
الشكل الإجباري: {"steps":[{"kind":"...","payload":{}}]}
الأوامر المسموحة فقط: open_app(package), open_note(), open_url(url), open_camera(), open_settings(setting), open_document(), speak(text), wait(ms).
الحزم المسموحة: YouTube=com.google.android.youtube, Chrome=com.android.chrome, WhatsApp=com.whatsapp, Telegram=org.telegram.messenger, Gmail=com.google.android.gm, Settings=com.android.settings.
الإعدادات المسموحة: battery, wifi, bluetooth, app.
لا تقرأ شاشة أي تطبيق آخر، ولا تنقر أو تكتب داخله، ولا تقرأ الإشعارات أو قائمة التطبيقات أو أسماء الملفات. لا تستخدم Accessibility.
فتح التطبيق لا يعني إتمام المهمة داخله؛ إذا احتاج الطلب إدخالًا في تطبيق آخر، افتحه فقط واطلب من المستخدم إكمال الإدخال بنفسه.
اجعل الخطة من خطوة إلى 8 خطوات. انتظر مدة قصيرة فقط عند الحاجة، وبحد أقصى 10000ms.
حالة الجهاز العامة: $phoneContext
أمثلة ناجحة من الذاكرة (RAG): ${rag.ifBlank { "لا يوجد" }}
طلب المستخدم: $request
JSON:
""".trimIndent()
}
