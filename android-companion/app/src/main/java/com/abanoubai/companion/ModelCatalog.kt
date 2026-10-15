package com.abanoubai.companion

/** Cloud-only catalog: no local model is bundled in the lightweight APK. */
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
    val all: List<LocalModel> = emptyList()
    val recommended = LocalModel(
        id = "cloud-only",
        fileName = "",
        label = "النماذج السحابية",
        level = 0,
        sizeLabel = "0 MB داخل التطبيق",
        ramLabel = "RAM منخفضة",
        systemPrompt = "يتم التخطيط عبر بوابة AbanoubAI السحابية.",
    )
    fun byId(id: String): LocalModel = recommended
}
