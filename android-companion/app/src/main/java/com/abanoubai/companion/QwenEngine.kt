package com.abanoubai.companion

import android.content.Context
import org.json.JSONObject

/**
 * Cloud-first adapter. The Android Companion deliberately contains no GGUF
 * model and no native llama.cpp runtime; complex planning stays in the web
 * app/cloud gateway while deterministic phone handlers remain available here.
 */
class QwenEngine(private val context: Context) {
    fun load(): Boolean = false
    fun selectModel(id: String): String = "cloud-only"
    fun selectedModel(): LocalModel = ModelCatalog.recommended
    fun chat(prompt: String): String = ""
    fun plan(request: String, phoneContext: String = "{}", rag: String = ""): String = ""
    fun verifyPlan(request: String, plan: String, phoneContext: String): Boolean = true
    fun isReady(): Boolean = false
    fun status(): String = JSONObject()
        .put("model", "Cloud gateway")
        .put("model_id", "cloud-only")
        .put("loaded", false)
        .put("size_bytes", 0)
        .put("network_required", true)
        .put("message", "النموذج المحلي مفصول لتقليل حجم التطبيق؛ التخطيط يتم عبر النماذج السحابية عند الاتصال.")
        .toString()
    fun close() = Unit
}
