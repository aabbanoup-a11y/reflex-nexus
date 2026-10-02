package com.abanoubai.companion

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import androidx.core.content.ContextCompat
import java.util.Locale

object VoiceController {
    private var tts: TextToSpeech? = null
    private var recognizer: SpeechRecognizer? = null

    fun speak(context: Context, text: String) {
        val bounded = text.take(4000)
        val current = tts
        if (current != null) { current.speak(bounded, TextToSpeech.QUEUE_FLUSH, null, "abanoubai-${System.currentTimeMillis()}"); return }
        tts = TextToSpeech(context.applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) { tts?.language = Locale.getDefault(); tts?.speak(bounded, TextToSpeech.QUEUE_FLUSH, null, "abanoubai-${System.currentTimeMillis()}") }
        }
    }

    fun listen(context: Context, record: kotlinx.serialization.json.JsonObject) {
        require(ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) { "فعّل إذن الميكروفون أولًا" }
        require(SpeechRecognizer.isRecognitionAvailable(context)) { "خدمة التعرف الصوتي غير متاحة" }
        recognizer?.destroy()
        recognizer = SpeechRecognizer.createSpeechRecognizer(context.applicationContext).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onResults(results: android.os.Bundle) {
                    val text = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                    CompanionRuntime.reportVoice(context, record, text.ifBlank { "لم يتم التعرف على كلام" })
                    destroy(); recognizer = null
                }
                override fun onError(error: Int) { CompanionRuntime.reportVoiceError(context, record, "فشل التعرف الصوتي: $error"); destroy(); recognizer = null }
                override fun onReadyForSpeech(params: android.os.Bundle?) = Unit
                override fun onBeginningOfSpeech() = Unit
                override fun onRmsChanged(rmsdB: Float) = Unit
                override fun onBufferReceived(buffer: ByteArray?) = Unit
                override fun onEndOfSpeech() = Unit
                override fun onPartialResults(partialResults: android.os.Bundle?) = Unit
                override fun onEvent(eventType: Int, params: android.os.Bundle?) = Unit
            })
            startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            })
        }
    }

    fun stop() { tts?.stop(); recognizer?.stopListening() }
    fun shutdown() { tts?.shutdown(); tts = null; recognizer?.destroy(); recognizer = null }
}
