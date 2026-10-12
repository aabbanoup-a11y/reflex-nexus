package com.abanoubai.companion

/** Models bundled/selected for low-memory Android devices. */
data class LocalModel(
    val id: String,
    val fileName: String,
    val label: String,
    val level: Int,
    val sizeLabel: String,
    val ramLabel: String,
    val systemPrompt: String,
)

object ModelCatalog {
    val all = listOf(
        LocalModel("smollm2-135m", "smollm2-135m-q4_k_m.gguf", "SmolLM2 135M", 1, "100 MB", "512 MB+", "You are a JSON planner. Output only JSON."),
        LocalModel("smollm2-360m", "smollm2-360m-q4_k_m.gguf", "SmolLM2 360M", 2, "258 MB", "1 GB+", "You are a JSON planner. Output only JSON."),
        LocalModel("qwen2.5-0.5b-q2", "qwen2.5-0.5b-q2_k.gguf", "Qwen2.5 0.5B Q2", 3, "396 MB", "1.5 GB+", "أنت مساعد ذكي يحول طلبات المستخدم العربي لخطط JSON دقيقة. مثال: افتح واتساب -> [{\"action\":\"open_app\",\"app\":\"whatsapp\"}]"),
        LocalModel("qwen2.5-0.5b-q3", "qwen2.5-0.5b-q3_k_m.gguf", "Qwen2.5 0.5B Q3", 4, "412 MB", "1.5 GB+", "أنت مساعد ذكي يحول طلبات المستخدم العربي لخطط JSON دقيقة. مثال: افتح واتساب -> [{\"action\":\"open_app\",\"app\":\"whatsapp\"}]"),
        LocalModel("smollm2-1.7b", "smollm2-1.7b-q2_k.gguf", "SmolLM2 1.7B Q2", 5, "643 MB", "3 GB+", "أنت مساعد ذكي يحول طلبات المستخدم العربي لخطط JSON دقيقة. مثال: افتح واتساب -> [{\"action\":\"open_app\",\"app\":\"whatsapp\"}]"),
    )
    val recommended = LocalModel("qwen2.5-0.5b-q4", "qwen2.5-0.5b-instruct-q4_k_m.gguf", "Qwen2.5 0.5B Instruct Q4 (مضمّن)", 4, "469 MB", "1.5 GB+", "أنت مساعد ذكي يحول طلبات المستخدم العربي لخطط JSON دقيقة. أخرج JSON فقط.")
    fun byId(id: String): LocalModel = all.firstOrNull { it.id == id } ?: recommended
}
