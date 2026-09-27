package com.abanoubai.companion

import android.content.Context
import android.content.Intent
import android.net.Uri
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull

object CommandExecutor {
    fun execute(context: Context, kind: String, record: JsonObject) {
        when (kind) {
            "open_chrome" -> openChrome(context)
            "open_url" -> record["payload"]?.let { payload ->
                val url = (payload as? JsonObject)?.get("url")?.jsonPrimitive?.contentOrNull ?: return
                if (url.startsWith("https://") || url.startsWith("http://")) openUrl(context, url)
            }
            "back" -> CompanionAccessibilityService.instance?.performGlobalAction(android.accessibilityservice.AccessibilityService.GLOBAL_ACTION_BACK)
            "tap_text", "type_text", "screenshot", "stop" -> CompanionAccessibilityService.instance?.handleScopedCommand(kind, record)
        }
    }

    private fun openChrome(context: Context) {
        val intent = context.packageManager.getLaunchIntentForPackage("com.android.chrome") ?: return
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
