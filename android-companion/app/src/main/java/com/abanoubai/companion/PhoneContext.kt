package com.abanoubai.companion

import android.content.Context
import org.json.JSONObject

/** Minimal local planning context; never reads other-app screens, notifications, files or installed-app lists. */
object PhoneContext {
    fun snapshot(context: Context): String {
        return JSONObject(DeviceInventory.device(context))
            .put("context_note", "معلومات عامة عن الجهاز فقط؛ لا تتضمن نص الشاشة أو الإشعارات أو أسماء التطبيقات أو الملفات.")
            .toString()
    }
}
