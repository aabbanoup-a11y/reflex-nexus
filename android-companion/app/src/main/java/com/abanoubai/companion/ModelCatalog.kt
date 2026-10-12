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
        LocalModel("qwen2.5-0.5b-q4", "qwen2.5-0.5b-instruct-q4_k_m.gguf", "Qwen2.5 0.5B Instruct Q4 (مضمّن فعليًا)", 4, "469 MB", "1.5 GB+", "أنت مساعد ذكي يحول طلبات المستخدم العربي لخطط JSON دقيقة. أخرج JSON فقط.")
    )
    val recommended = all.first()
    fun byId(id: String): LocalModel = all.firstOrNull { it.id == id } ?: recommended
}
