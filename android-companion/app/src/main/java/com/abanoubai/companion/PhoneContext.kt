package com.abanoubai.companion

import android.content.Context
import org.json.JSONObject

/** Bounded local context for planning; no credentials or private app databases are read. */
object PhoneContext {
    fun snapshot(context: Context): String {
        val out = JSONObject(DeviceInventory.device(context))
        val screen = CompanionAccessibilityService.instance?.readScreen().orEmpty()
        out.put("screen", screen.take(30000))
        out.put("context_note", "هذه معلومات الشاشة المرئية والصلاحيات المتاحة فقط؛ لا تحتوي كلمات مرور أو قواعد بيانات التطبيقات الخاصة")
        return out.toString()
    }
}
