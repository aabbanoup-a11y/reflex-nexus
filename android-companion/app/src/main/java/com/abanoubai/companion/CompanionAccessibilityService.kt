package com.abanoubai.companion

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull

class CompanionAccessibilityService : AccessibilityService() {
    companion object { var instance: CompanionAccessibilityService? = null }
    override fun onServiceConnected() { instance = this }
    override fun onAccessibilityEvent(event: AccessibilityEvent?) { /* Observe only while an approved command is running. */ }
    override fun onInterrupt() { }
    override fun onDestroy() { instance = null; super.onDestroy() }

    fun handleScopedCommand(kind: String, record: JsonObject) {
        if (kind == "stop") return
        val payload = record["payload"] as? JsonObject ?: return
        when (kind) {
            "tap_text" -> payload["text"]?.jsonPrimitive?.contentOrNull?.let { text ->
                rootInActiveWindow?.findAccessibilityNodeInfosByText(text)?.firstOrNull()?.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            }
            "type_text" -> payload["text"]?.jsonPrimitive?.contentOrNull?.let { text ->
                val node = rootInActiveWindow?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?: return
                val args = android.os.Bundle().apply { putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text.take(500)) }
                node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
            }
            "screenshot" -> { /* Capture is intentionally wired through a later signed upload endpoint. */ }
        }
    }
}
