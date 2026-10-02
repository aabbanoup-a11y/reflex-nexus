package com.abanoubai.companion

import android.content.Context
import android.content.Intent
import android.net.Uri
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

object CommandExecutor {
    fun execute(context: Context, kind: String, record: JsonObject): String {
        return when (kind) {
            "open_chrome" -> { openChrome(context); "تم فتح Chrome" }
            "open_url" -> {
                val url = (record["payload"] as? JsonObject)?.get("url")?.jsonPrimitive?.contentOrNull
                    ?: error("الرابط غير موجود")
                require(url.startsWith("https://") || url.startsWith("http://")) { "الرابط غير مسموح" }
                openUrl(context, url)
                "تم فتح الرابط"
            }
            "back" -> {
                CompanionAccessibilityService.instance?.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
                    ?: error("Accessibility غير مفعّلة")
                "تم الرجوع"
            }
            "tap_text", "type_text", "screenshot" -> {
                CompanionAccessibilityService.instance?.handleScopedCommand(kind, record)
                    ?: error("Accessibility غير مفعّلة")
                "تم إرسال أمر $kind"
            }
            "device_inventory" -> DeviceInventory.device(context)
            "app_inventory" -> DeviceInventory.apps(context)
            "notification_inventory" -> {
                require(NotificationInbox.enabled) { "فعّل الوصول إلى الإشعارات أولًا" }
                DeviceInventory.notifications()
            }
            "stop" -> { CompanionRuntime.stop(context); "تم الإيقاف الطارئ" }
            else -> error("أمر غير مسموح")
        }
    }

    private fun openChrome(context: Context) {
        val intent = context.packageManager.getLaunchIntentForPackage("com.android.chrome") ?: error("Chrome غير مثبت")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    private fun openUrl(context: Context, url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            setPackage("com.android.chrome")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
