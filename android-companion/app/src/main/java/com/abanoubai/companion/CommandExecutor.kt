package com.abanoubai.companion

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.provider.Settings
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

object CommandExecutor {
    fun execute(context: Context, kind: String, record: JsonObject): String {
        val payload = record["payload"] as? JsonObject
        val delegated = payload?.get("agent_action")?.jsonPrimitive?.contentOrNull
        if (kind == "tap_text" && !delegated.isNullOrBlank()) {
            return execute(context, delegated, record)
        }
        return when (kind) {
            "open_app" -> {
                val packageName = payload?.get("package")?.jsonPrimitive?.contentOrNull ?: error("اسم حزمة التطبيق غير موجود")
                require(packageName.matches(Regex("[A-Za-z0-9_]+(\\.[A-Za-z0-9_]+)+"))) { "اسم الحزمة غير صالح" }
                val intent = context.packageManager.getLaunchIntentForPackage(packageName) ?: error("التطبيق غير مثبت أو لا يملك شاشة تشغيل")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                waitForScreenReady(packageName)
                "تم فتح التطبيق: $packageName"
            }
            "open_settings" -> {
                val setting = payload?.get("setting")?.jsonPrimitive?.contentOrNull ?: error("صفحة الإعدادات غير محددة")
                openSetting(context, setting)
                "تم فتح إعدادات: $setting"
            }
            "open_chrome" -> { openChrome(context); waitForScreenReady("com.android.chrome"); "تم فتح Chrome" }
            "open_camera" -> { openCamera(context); "تم فتح الكاميرا" }
            "open_url" -> {
                val url = payload?.get("url")?.jsonPrimitive?.contentOrNull ?: error("الرابط غير موجود")
                require(url.startsWith("https://") || url.startsWith("http://")) { "الرابط غير مسموح" }
                openUrl(context, url)
                waitForScreenReady(null)
                "تم فتح الرابط"
            }
            "open_document" -> {
                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    type = payload?.get("mime")?.jsonPrimitive?.contentOrNull ?: "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                "تم فتح منتقي الملفات للقراءة"
            }
            "open_file" -> {
                val raw = payload?.get("uri")?.jsonPrimitive?.contentOrNull ?: error("رابط الملف غير موجود")
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(raw)).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION) }
                require(intent.resolveActivity(context.packageManager) != null) { "لا يوجد تطبيق يفتح هذا الملف" }
                context.startActivity(intent)
                "تم فتح الملف"
            }
            "download_file" -> download(context, payload)
            "speak" -> { VoiceController.speak(context, payload?.get("text")?.jsonPrimitive?.contentOrNull ?: error("النص غير موجود")); "بدأ نطق الرد" }
            "listen" -> { VoiceController.listen(context, record); "بدأ الاستماع لمدة أمر واحد" }
            "back" -> global(context, android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK, "تم الرجوع")
            "home" -> global(context, android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_HOME, "تم فتح الشاشة الرئيسية")
            "recents" -> global(context, android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_RECENTS, "تم فتح التطبيقات الأخيرة")
            "tap_text", "tap_id", "tap_description", "tap_coordinates", "long_press", "type_text", "clear_text", "screenshot", "read_screen", "screen_text", "swipe", "scroll", "wait_for_text", "press_back", "press_home", "open_notifications", "quick_settings" -> {
                val result = CompanionAccessibilityService.instance?.handleScopedCommand(kind, record) ?: error("Accessibility غير مفعّلة")
                if (kind == "read_screen" || kind == "screen_text") result else "تم إرسال أمر $kind"
            }
            "device_inventory" -> DeviceInventory.device(context)
            "app_inventory" -> DeviceInventory.apps(context)
            "app_permissions" -> DeviceInventory.permissions(context, payload?.get("package")?.jsonPrimitive?.contentOrNull)
            "file_inventory" -> DeviceInventory.files(context)
            "file_read" -> readFile(context, payload)
            "notification_inventory" -> {
                require(NotificationInbox.enabled) { "فعّل الوصول إلى الإشعارات أولًا" }
                DeviceInventory.notifications()
            }
            "stop" -> { CompanionRuntime.stop(context); "تم الإيقاف الطارئ" }
            "wait" -> { Thread.sleep((payload?.get("ms")?.jsonPrimitive?.contentOrNull?.toLongOrNull() ?: 1000L).coerceIn(0L, 10000L)); "تم الانتظار" }
            "batch" -> executeBatch(context, payload)
            "workflow" -> executeWorkflow(context, payload)
            else -> error("أمر غير مسموح")
        }
    }

    private fun download(context: Context, payload: JsonObject?): String {
        val url = payload?.get("url")?.jsonPrimitive?.contentOrNull ?: error("رابط التنزيل غير موجود")
        require(url.startsWith("https://")) { "التنزيلات تقتصر على HTTPS" }
        val name = (payload["name"]?.jsonPrimitive?.contentOrNull ?: Uri.parse(url).lastPathSegment ?: "download").replace(Regex("[^A-Za-z0-9._-]"), "_").take(120)
        val request = DownloadManager.Request(Uri.parse(url)).setTitle(name).setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED).setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
        context.getSystemService(DownloadManager::class.java).enqueue(request)
        return "بدأ تنزيل $name، وستظهر حالته في إشعارات Android"
    }

    private fun waitForScreenReady(expectedPackage: String?) {
        val start = System.currentTimeMillis()
        while (System.currentTimeMillis() - start < 6000L) {
            val service = CompanionAccessibilityService.instance
            val current = service?.rootInActiveWindow?.packageName?.toString().orEmpty()
            if (service != null && (expectedPackage == null || current == expectedPackage)) {
                Thread.sleep(450L)
                return
            }
            Thread.sleep(150L)
        }
        Thread.sleep(450L)
    }

    private fun readFile(context: Context, payload: JsonObject?): String {
        val raw = payload?.get("uri")?.jsonPrimitive?.contentOrNull ?: error("رابط الملف غير موجود")
        val stream = if (raw.startsWith("content://")) context.contentResolver.openInputStream(Uri.parse(raw)) else File(raw).inputStream()
        stream.use { input -> return BufferedReader(InputStreamReader(input)).readText().take(20000) }
    }

    private fun executeBatch(context: Context, payload: JsonObject?): String {
        val steps = payload?.get("steps") as? JsonArray ?: error("خطة batch غير موجودة")
        require(steps.size <= 50) { "الخطة أكبر من الحد المسموح" }
        val results = mutableListOf<String>()
        steps.forEachIndexed { index, item ->
            val step = item.jsonObject
            val screen = CompanionAccessibilityService.instance?.readScreen().orEmpty()
            val ifText = step["if_text"]?.jsonPrimitive?.contentOrNull
            val unlessText = step["unless_text"]?.jsonPrimitive?.contentOrNull
            if ((!ifText.isNullOrBlank() && !screen.contains(ifText, ignoreCase = true)) || (!unlessText.isNullOrBlank() && screen.contains(unlessText, ignoreCase = true))) {
                results += "الخطوة ${index + 1}: تم تخطيها بالشرط"
                return@forEachIndexed
            }
            val kind = step["kind"]?.jsonPrimitive?.contentOrNull ?: run { results += "الخطوة ${index + 1} فشلت: الأمر مفقود"; return@forEachIndexed }
            val stepPayload = step["payload"] as? JsonObject ?: kotlinx.serialization.json.buildJsonObject { }
            val repeats = (step["repeat"]?.jsonPrimitive?.contentOrNull?.toIntOrNull() ?: 1).coerceIn(1, 10)
            repeat(repeats) { attempt ->
                results += runCatching { execute(context, kind, kotlinx.serialization.json.buildJsonObject { put("kind", JsonPrimitive(kind)); put("payload", stepPayload) }) }
                    .getOrElse { "الخطوة ${index + 1} المحاولة ${attempt + 1} فشلت: ${it.message}" }
            }
        }
        val summary = results.joinToString("\n")
        if (summary.contains("فشلت") || summary.contains("فشل تنفيذ")) error(summary)
        return summary
    }

    private fun executeWorkflow(context: Context, payload: JsonObject?): String {
        val steps = payload?.get("steps") as? JsonArray ?: error("خطوات workflow غير موجودة")
        require(steps.isNotEmpty() && steps.size <= 50) { "workflow يحتاج من 1 إلى 50 خطوة" }
        val until = payload["until_text"]?.jsonPrimitive?.contentOrNull
        val cycles = (payload["max_cycles"]?.jsonPrimitive?.contentOrNull?.toIntOrNull() ?: 100).coerceIn(1, 100)
        val results = mutableListOf<String>()
        for (cycle in 0 until cycles) {
            val screen = CompanionAccessibilityService.instance?.readScreen().orEmpty()
            if (!until.isNullOrBlank() && screen.contains(until, ignoreCase = true)) {
                results += "تحقق هدف workflow في الدورة ${cycle + 1}: $until"
                break
            }
            val result = executeBatch(context, kotlinx.serialization.json.buildJsonObject { put("steps", steps) })
            results += "الدورة ${cycle + 1}: $result"
            if (until.isNullOrBlank()) break
            Thread.sleep(300L)
        }
        return results.takeLast(100).joinToString("\n")
    }

    private fun global(context: Context, action: Int, message: String): String {
        CompanionAccessibilityService.instance?.performGlobalAction(action) ?: error("Accessibility غير مفعّلة")
        return message
    }

    private fun openSetting(context: Context, setting: String) {
        val action = when (setting) {
            "accessibility" -> Settings.ACTION_ACCESSIBILITY_SETTINGS
            "notifications" -> "android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"
            "usage" -> Settings.ACTION_USAGE_ACCESS_SETTINGS
            "battery" -> Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS
            "wifi" -> Settings.ACTION_WIFI_SETTINGS
            "bluetooth" -> Settings.ACTION_BLUETOOTH_SETTINGS
            "app" -> Settings.ACTION_APPLICATION_DETAILS_SETTINGS
            else -> error("صفحة إعدادات غير مسموحة")
        }
        val intent = Intent(action).apply {
            if (setting == "app") data = Uri.parse("package:${context.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun openChrome(context: Context) {
        val intent = context.packageManager.getLaunchIntentForPackage("com.android.chrome") ?: error("Chrome غير مثبت")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    private fun openCamera(context: Context) {
        val intent = Intent("android.media.action.IMAGE_CAPTURE").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        require(intent.resolveActivity(context.packageManager) != null) { "لا توجد كاميرا متاحة" }
        context.startActivity(intent)
    }

    private fun openUrl(context: Context, url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply { setPackage("com.android.chrome"); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
        context.startActivity(intent)
    }
}
