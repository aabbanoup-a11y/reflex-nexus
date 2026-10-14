package com.abanoubai.companion

import android.content.Context
import android.app.ActivityManager
import java.io.File
import org.json.JSONObject

/** Local-only multi-model GGUF engine. Models are copied from the selected app asset. */
class QwenEngine(private val context: Context) {
    companion object { private const val PREFS = "companion"; private const val MODEL_KEY = "local_model_id"; init { System.loadLibrary("qwen-native") } }
    @Volatile private var loaded = false
    @Volatile private var loadedId = ""
    private val prefs get() = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private val selected: LocalModel get() = ModelCatalog.byId(prefs.getString(MODEL_KEY, ModelCatalog.recommended.id) ?: ModelCatalog.recommended.id)
    private val modelFile: File get() = File(context.filesDir, selected.fileName)

    @Synchronized fun selectModel(id: String): String {
        val model = ModelCatalog.byId(id)
        if (loadedId != model.id) { close(); prefs.edit().putString(MODEL_KEY, model.id).apply() }
        return model.id
    }
    fun selectedModel(): LocalModel = selected

    @Synchronized fun load(): Boolean {
        val model = selected
        if (loaded && loadedId == model.id) return true
        // OPPO A15-class devices commonly expose about 2 GB RAM. The bundled
        // 0.5B GGUF needs substantially more than the Android heap alone;
        // refusing the load is safer than killing the whole process with OOM.
        val memory = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val info = ActivityManager.MemoryInfo()
        memory?.getMemoryInfo(info)
        if (memory?.isLowRamDevice == true || info.availMem < 1_200L * 1024L * 1024L) return false
        return runCatching {
            if (!modelFile.exists() || modelFile.length() < 50_000_000L) {
                context.assets.open("models/qwen.gguf").use { input -> modelFile.outputStream().use { output -> input.copyTo(output, 1024 * 1024) } }
            }
            loaded = nativeLoad(modelFile.absolutePath); loadedId = if (loaded) model.id else ""; loaded
        }.getOrElse { false }
    }

    @Synchronized fun chat(prompt: String): String {
        if (!load()) return ""
        val formatted = "<|im_start|>system\n${selected.systemPrompt}\nأجب بالعربية باختصار.<|im_end|>\n<|im_start|>user\n$prompt<|im_end|>\n<|im_start|>assistant\n"
        return runCatching { nativeGenerate(formatted, 192).trim() }.getOrDefault("")
    }

    @Synchronized fun plan(request: String, phoneContext: String = "{}", rag: String = ""): String {
        if (!load()) return ""
        val prompt = OfflinePlan.prompt(request, phoneContext, rag)
        val formatted = "<|im_start|>system\n${selected.systemPrompt}\nأنت مخطط هاتف محلي. أخرج JSON فقط ولا تدّع نجاحًا لم يحدث.<|im_end|>\n<|im_start|>user\n$prompt<|im_end|>\n<|im_start|>assistant\n"
        return runCatching { nativeGenerate(formatted, 512).trim() }.getOrDefault("")
    }

    @Synchronized fun verifyPlan(request: String, plan: String, phoneContext: String): Boolean {
        if (!load()) return true
        val prompt = "راجع الخطة التالية للهاتف. أجب بكلمة YES إذا كانت مناسبة للطلب والحالة، أو NO فقط إذا فيها خطوة غير ممكنة.\nالطلب: $request\nالحالة: $phoneContext\nالخطة: $plan"
        val formatted = "<|im_start|>system\n${selected.systemPrompt}<|im_end|>\n<|im_start|>user\n$prompt<|im_end|>\n<|im_start|>assistant\n"
        return runCatching { nativeGenerate(formatted, 12).trim().uppercase().contains("YES") }.getOrDefault(true)
    }

    fun isReady(): Boolean = loaded
    fun status(): String {
        val memory = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val info = ActivityManager.MemoryInfo()
        memory?.getMemoryInfo(info)
        return JSONObject().put("model", selected.label).put("model_id", selected.id)
            .put("loaded", loaded).put("size_bytes", if (modelFile.exists()) modelFile.length() else 0)
            .put("network_required", false).put("safe_mode", memory?.isLowRamDevice == true || info.availMem < 1_200L * 1024L * 1024L)
            .put("message", if (memory?.isLowRamDevice == true || info.availMem < 1_200L * 1024L * 1024L) "تم تعطيل النموذج مؤقتًا لحماية الهاتف من الإغلاق؛ الأوامر الأساسية تعمل محليًا." else "النموذج جاهز عند الطلب.").toString()
    }
    fun close() { runCatching { nativeShutdown() }; loaded = false; loadedId = "" }
    private external fun nativeLoad(path: String): Boolean
    private external fun nativeGenerate(prompt: String, maxTokens: Int): String
    private external fun nativeShutdown()
}
