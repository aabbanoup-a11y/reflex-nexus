package com.abanoubai.companion

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Bitmap
import android.graphics.Path
import android.os.Build
import android.os.Bundle
import android.view.Display
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

class CompanionAccessibilityService : AccessibilityService() {
    companion object { var instance: CompanionAccessibilityService? = null }
    override fun onServiceConnected() { instance = this; CompanionRuntime.restart(this) }
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
            "tap_coordinates", "long_press" -> {
                val x = payload["x"]?.jsonPrimitive?.contentOrNull?.toFloatOrNull() ?: error("x مفقود")
                val y = payload["y"]?.jsonPrimitive?.contentOrNull?.toFloatOrNull() ?: error("y مفقود")
                val duration = if (kind == "long_press") 700L else 80L
                val path = Path().apply { moveTo(x, y); lineTo(x, y) }
                val gesture = GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, duration)).build()
                require(dispatchGesture(gesture, null, null)) { "تعذر تنفيذ الضغط" }
            }
            "type_text" -> payload["text"]?.jsonPrimitive?.contentOrNull?.let { text ->
                val node = rootInActiveWindow?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?: error("لم يتم العثور على حقل إدخال")
                val args = Bundle().apply { putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text.take(500)) }
                require(node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) { "تعذر كتابة النص" }
            }
            "swipe" -> {
                val x1 = payload["x1"]?.jsonPrimitive?.contentOrNull?.toFloatOrNull() ?: error("x1 مفقود")
                val y1 = payload["y1"]?.jsonPrimitive?.contentOrNull?.toFloatOrNull() ?: error("y1 مفقود")
                val x2 = payload["x2"]?.jsonPrimitive?.contentOrNull?.toFloatOrNull() ?: error("x2 مفقود")
                val y2 = payload["y2"]?.jsonPrimitive?.contentOrNull?.toFloatOrNull() ?: error("y2 مفقود")
                val duration = (payload["duration"]?.jsonPrimitive?.contentOrNull?.toLongOrNull() ?: 400L).coerceIn(100L, 2000L)
                val path = Path().apply { moveTo(x1, y1); lineTo(x2, y2) }
                val gesture = GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, duration)).build()
                require(dispatchGesture(gesture, null, null)) { "تعذر تنفيذ السحب" }
            }
            "screenshot" -> {
                require(Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) { "لقطة الشاشة تحتاج Android 11 أو أحدث" }
                takeScreenshot(Display.DEFAULT_DISPLAY, mainExecutor, object : TakeScreenshotCallback {
                    override fun onSuccess(result: ScreenshotResult) {
                        val bitmap = Bitmap.wrapHardwareBuffer(result.hardwareBuffer, result.colorSpace)
                            ?: return CompanionRuntime.reportScreenshotError(this@CompanionAccessibilityService, record, "تعذر تحويل لقطة الشاشة")
                        val out = java.io.ByteArrayOutputStream()
                        bitmap.copy(Bitmap.Config.ARGB_8888, false).compress(Bitmap.CompressFormat.JPEG, 65, out)
                        bitmap.recycle()
                        val data = "data:image/jpeg;base64," + android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP)
                        CompanionRuntime.reportScreenshot(this@CompanionAccessibilityService, record, data)
                    }
                    override fun onFailure(errorCode: Int) {
                        CompanionRuntime.reportScreenshotError(this@CompanionAccessibilityService, record, "فشل التقاط الشاشة: $errorCode")
                    }
                })
            }
        }
    }
}
