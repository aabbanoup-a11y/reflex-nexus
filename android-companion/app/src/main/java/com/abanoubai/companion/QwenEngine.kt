package com.abanoubai.companion

import android.content.Context
import java.io.File

/** Local-only Qwen GGUF engine. It never performs network access. */
class QwenEngine(private val context: Context) {
    companion object {
        private const val MODEL_ASSET = "models/qwen.gguf"
        private const val MODEL_FILE = "qwen2.5-0.5b-instruct-q4_k_m.gguf"
        init { System.loadLibrary("qwen-native") }
    }

    @Volatile private var loaded = false
    private val modelFile: File get() = File(context.filesDir, MODEL_FILE)

    @Synchronized
    fun load(): Boolean {
        if (loaded) return true
        return runCatching {
            if (!modelFile.exists() || modelFile.length() < 100_000_000L) {
                context.assets.open(MODEL_ASSET).use { input ->
                    modelFile.outputStream().use { output -> input.copyTo(output, 1024 * 1024) }
                }
            }
            loaded = nativeLoad(modelFile.absolutePath)
            loaded
        }.getOrElse { false }
    }

    @Synchronized
    fun chat(prompt: String): String {
        if (!load()) return ""
        val formatted = "<|im_start|>system\nأنت مساعد محلي يعمل بدون إنترنت. أجب بالعربية باختصار، ولا تذكر أنك نموذج سحابي.<|im_end|>\n<|im_start|>user\n$prompt<|im_end|>\n<|im_start|>assistant\n"
        return runCatching { nativeGenerate(formatted, 192).trim() }.getOrDefault("")
    }

    /** Generates a constrained action proposal; OfflinePlan validates it before execution. */
    @Synchronized
    fun plan(request: String): String {
        if (!load()) return ""
        val formatted = "<|im_start|>system\nأنت مخطط أوفلاين للهاتف. أخرج JSON فقط ولا تضف أي شرح.<|im_end|>\n<|im_start|>user\n${OfflinePlan.prompt(request)}<|im_end|>\n<|im_start|>assistant\n"
        return runCatching { nativeGenerate(formatted, 512).trim() }.getOrDefault("")
    }

    fun isReady(): Boolean = loaded
    fun close() { runCatching { nativeShutdown() }; loaded = false }

    private external fun nativeLoad(path: String): Boolean
    private external fun nativeGenerate(prompt: String, maxTokens: Int): String
    private external fun nativeShutdown()
}
