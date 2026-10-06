package com.abanoubai.companion

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Bitmap
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.os.Bundle
import android.view.Display
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import org.json.JSONArray
import org.json.JSONObject

class CompanionAccessibilityService : AccessibilityService() {
    companion object { var instance: CompanionAccessibilityService? = null }
    override fun onServiceConnected() { instance = this; CompanionRuntime.restart(this) }
    override fun onAccessibilityEvent(event: AccessibilityEvent?) { }
    override fun onInterrupt() { }
    override fun onDestroy() { instance = null; super.onDestroy() }

    private fun roots(): List<AccessibilityNodeInfo> {
        val list = windows.mapNotNull { it.root }.toMutableList()
        rootInActiveWindow?.let { if (list.none { r -> r == it }) list.add(0, it) }
        return list
    }

    /** Reads every visible element (text, description, bounds, clickable) so models can "see" the screen. */
    fun readScreen(): String {
        val items = JSONArray()
        val pkg = rootInActiveWindow?.packageName?.toString().orEmpty()
        fun walk(n: AccessibilityNodeInfo?, depth: Int) {
            if (n == null || depth > 40 || items.length() >= 250) return
            val text = n.text?.toString().orEmpty().trim()
            val desc = n.contentDescription?.toString().orEmpty().trim()
            if ((text.isNotEmpty() || desc.isNotEmpty() || n.isEditable) && n.isVisibleToUser) {
                val r = Rect(); n.getBoundsInScreen(r)
                items.put(JSONObject().put("t", text.take(160)).put("d", desc.take(120))
                    .put("x", r.centerX()).put("y", r.centerY())
                    .put("click", n.isClickable || n.parent?.isClickable == true)
                    .put("edit", n.isEditable).put("id", n.viewIdResourceName?.substringAfter("/") ?: ""))
            }
            for (i in 0 until n.childCount) walk(n.getChild(i), depth + 1)
        }
        roots().forEach { walk(it, 0) }
        val dm = resources.displayMetrics
        return JSONObject().put("app", pkg).put("w", dm.widthPixels).put("h", dm.heightPixels).put("items", items).toString()
    }

    private fun find(text: String): AccessibilityNodeInfo? {
        val q = text.trim().lowercase()
        var best: AccessibilityNodeInfo? = null
        fun walk(n: AccessibilityNodeInfo?, depth: Int) {
            if (n == null || depth > 40 || best != null) return
            val t = n.text?.toString()?.lowercase().orEmpty()
            val d = n.contentDescription?.toString()?.lowercase().orEmpty()
            val id = n.viewIdResourceName?.lowercase().orEmpty()
            if (n.isVisibleToUser && (t == q || d == q || t.contains(q) || d.contains(q) || id.endsWith("/$q"))) { best = n; return }
            for (i in 0 until n.childCount) walk(n.getChild(i), depth + 1)
        }
        roots().forEach { walk(it, 0) }
        return best
    }

    private fun tapAt(x: Float, y: Float, duration: Long = 80L) {
        val path = Path().apply { moveTo(x, y); lineTo(x, y) }
        val g = GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, duration)).build()
        require(dispatchGesture(g, null, null)) { "تعذر تنفيذ الضغط" }
    }

    private fun clickNode(node: AccessibilityNodeInfo): String {
        var n: AccessibilityNodeInfo? = node
        while (n != null) {
            if (n.isClickable && n.performAction(AccessibilityNodeInfo.ACTION_CLICK)) return "ضغطت على: ${node.text ?: node.contentDescription}"
            n = n.parent
        }
        val r = Rect(); node.getBoundsInScreen(r)
        tapAt(r.exactCenterX(), r.exactCenterY())
        return "ضغطت على موقع العنصر (${r.centerX()},${r.centerY()})"
    }

    fun handleScopedCommand(kind: String, record: JsonObject): String {
        val payload = record["payload"] as? JsonObject
        fun s(k: String) = payload?.get(k)?.jsonPrimitive?.contentOrNull
        fun f(k: String) = s(k)?.toFloatOrNull() ?: error("$k مفقود")
        return when (kind) {
            "read_screen" -> readScreen()
            "screen_text" -> {
                CompanionRuntime.reportScreenText(this, record, readScreen())
                "جاري إرسال النص الظاهر"
            }
            "tap_text" -> {
                val text = s("text") ?: error("النص مفقود")
                clickNode(find(text) ?: error("لم أجد \"$text\" على الشاشة"))
            }
            "tap_id", "tap_description" -> {
                val target = s("id") ?: s("text") ?: s("description") ?: error("هدف الضغط مفقود")
                clickNode(find(target) ?: error("لم أجد العنصر \"$target\" على الشاشة"))
            }
            "tap_coordinates", "long_press" -> { tapAt(f("x"), f("y"), if (kind == "long_press") 700L else 80L); "تم الضغط" }
            "type_text" -> {
                val text = (s("text") ?: error("النص مفقود")).take(1000)
                val target = s("target")?.let { find(it) }
                var node = target ?: rootInActiveWindow?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
                if (node == null) {
                    fun firstEdit(n: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
                        if (n == null) return null
                        if (n.isEditable) return n
                        for (i in 0 until n.childCount) firstEdit(n.getChild(i))?.let { return it }
                        return null
                    }
                    node = roots().firstNotNullOfOrNull { firstEdit(it) }
                }
                node ?: error("لا يوجد حقل كتابة على الشاشة")
                node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                val args = Bundle().apply { putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text) }
                require(node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) { "تعذر كتابة النص" }
                if (s("submit") == "true") node.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_IME_ENTER.id)
                "كتبت: $text"
            }
            "clear_text" -> {
                val target = s("target")?.let { find(it) }
                val node = target ?: rootInActiveWindow?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?: error("لا يوجد حقل كتابة على الشاشة")
                val args = Bundle().apply { putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, "") }
                require(node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) { "تعذر مسح الحقل" }
                "تم مسح الحقل"
            }
            "wait_for_text" -> {
                val text = s("text") ?: error("النص المطلوب انتظاره مفقود")
                val timeout = (s("timeout_ms")?.toLongOrNull() ?: 10000L).coerceIn(250L, 30000L)
                val start = System.currentTimeMillis()
                while (System.currentTimeMillis() - start < timeout) {
                    if (find(text) != null) return "ظهر العنصر: $text"
                    Thread.sleep(250L)
                }
                error("لم يظهر العنصر خلال المهلة: $text")
            }
            "scroll" -> {
                val dm = resources.displayMetrics
                val w = dm.widthPixels.toFloat(); val h = dm.heightPixels.toFloat()
                val dir = s("dir") ?: "down"
                val (x1, y1, x2, y2) = when (dir) {
                    "up" -> listOf(w / 2, h * 0.3f, w / 2, h * 0.75f)
                    "left" -> listOf(w * 0.2f, h / 2, w * 0.8f, h / 2)
                    "right" -> listOf(w * 0.8f, h / 2, w * 0.2f, h / 2)
                    else -> listOf(w / 2, h * 0.75f, w / 2, h * 0.3f)
                }
                swipe(x1, y1, x2, y2, 350L); "سحبت $dir"
            }
            "swipe" -> { swipe(f("x1"), f("y1"), f("x2"), f("y2"), (s("duration")?.toLongOrNull() ?: 400L).coerceIn(100L, 2000L)); "تم السحب" }
            "press_back" -> { performGlobalAction(GLOBAL_ACTION_BACK); "تم الرجوع" }
            "press_home" -> { performGlobalAction(GLOBAL_ACTION_HOME); "تم فتح الشاشة الرئيسية" }
            "open_notifications" -> { performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS); "تم فتح الإشعارات" }
            "quick_settings" -> { performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS); "تم فتح الإعدادات السريعة" }
            "screenshot" -> {
                require(Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) { "لقطة الشاشة تحتاج Android 11 أو أحدث" }
                takeScreenshot(Display.DEFAULT_DISPLAY, mainExecutor, object : TakeScreenshotCallback {
                    override fun onSuccess(result: ScreenshotResult) {
                        val bitmap = Bitmap.wrapHardwareBuffer(result.hardwareBuffer, result.colorSpace)
                            ?: return CompanionRuntime.reportScreenshotError(this@CompanionAccessibilityService, record, "تعذر تحويل لقطة الشاشة")
                        val soft = bitmap.copy(Bitmap.Config.ARGB_8888, false)
                        val scaled = Bitmap.createScaledBitmap(soft, soft.width / 2, soft.height / 2, true)
                        val out = java.io.ByteArrayOutputStream()
                        scaled.compress(Bitmap.CompressFormat.JPEG, 55, out)
                        bitmap.recycle()
                        val data = "data:image/jpeg;base64," + android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP)
                        CompanionRuntime.reportScreenshot(this@CompanionAccessibilityService, record, data)
                    }
                    override fun onFailure(errorCode: Int) {
                        CompanionRuntime.reportScreenshotError(this@CompanionAccessibilityService, record, "فشل التقاط الشاشة: $errorCode")
                    }
                })
                "جاري التقاط الشاشة"
            }
            else -> error("أمر غير معروف")
        }
    }

    private fun swipe(x1: Float, y1: Float, x2: Float, y2: Float, d: Long) {
        val path = Path().apply { moveTo(x1, y1); lineTo(x2, y2) }
        val g = GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, d)).build()
        require(dispatchGesture(g, null, null)) { "تعذر تنفيذ السحب" }
    }
}
