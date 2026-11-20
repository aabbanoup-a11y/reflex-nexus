package com.abanoubai.companion

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.content.ContextCompat
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class NativeHomeActivity : ComponentActivity() {
    private val http = OkHttpClient.Builder()
        .callTimeout(35, TimeUnit.SECONDS)
        .build()

    private val prefs by lazy { getSharedPreferences("companion", MODE_PRIVATE) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (!isLowMemoryDevice()) {
            runCatching { CompanionRuntime.start(this) }
                .onFailure { Log.e("AbanoubAI", "Unable to initialize companion runtime", it) }
        }
        if (prefs.getBoolean("enabled", false)) {
            runCatching {
                ContextCompat.startForegroundService(
                    this,
                    Intent(this, CompanionForegroundService::class.java)
                )
            }.onFailure {
                Log.e("AbanoubAI", "Unable to resume the enabled companion service", it)
            }
        }

        val initiallyAuthenticated = !prefs.getString("access_token", null).isNullOrBlank()
        setContent {
            NativeWorkspaceScreen(
                initialAuthenticated = initiallyAuthenticated,
                onSignIn = { email, password, complete -> signIn(email, password, complete) },
                onSendMessage = { prompt, history, complete -> sendMessage(prompt, history, complete) }
            )
        }
    }

    private fun signIn(email: String, password: String, complete: (Result<Unit>) -> Unit) {
        Thread {
            val result = runCatching {
                require(email.isNotBlank() && password.isNotBlank()) { "أدخل البريد الإلكتروني وكلمة المرور." }
                val body = JSONObject().put("email", email).put("password", password)
                    .toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("${BuildConfig.SUPABASE_URL.trimEnd('/')}/auth/v1/token?grant_type=password")
                    .header("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                    .post(body)
                    .build()
                http.newCall(request).execute().use { response ->
                    val raw = response.body?.string().orEmpty()
                    val payload = runCatching { JSONObject(raw) }.getOrNull()
                    if (!response.isSuccessful) {
                        throw IOException(payload?.optString("msg")
                            ?.takeIf { it.isNotBlank() }
                            ?: payload?.optString("message")?.takeIf { it.isNotBlank() }
                            ?: "تعذر تسجيل الدخول (HTTP ${response.code}).")
                    }
                    val access = payload?.optString("access_token").orEmpty()
                    val refresh = payload?.optString("refresh_token").orEmpty()
                    if (access.isBlank()) throw IOException("لم يُرجع خادم المصادقة جلسة صالحة.")
                    prefs.edit()
                        .putString("access_token", access)
                        .putString("refresh_token", refresh)
                        .apply()
                }
            }
            runOnUiThread { complete(result) }
        }.start()
    }

    private fun sendMessage(
        prompt: String,
        history: List<ChatTurn>,
        complete: (Result<String>) -> Unit
    ) {
        Thread {
            val result = runCatching {
                val token = prefs.getString("access_token", null)
                    ?.takeIf { it.isNotBlank() }
                    ?: throw IOException("سجّل الدخول أولًا.")
                val messages = JSONArray()
                history.takeLast(12).forEach { turn ->
                    if (turn.role == "user" || turn.role == "assistant") {
                        messages.put(JSONObject().put("role", turn.role).put("content", turn.content.take(6000)))
                    }
                }
                val taskType = when {
                    prompt.contains("كود") || prompt.contains("برمج") || prompt.contains("code", true) -> "coding"
                    prompt.contains("بحث عميق") || prompt.contains("حلل بعمق") || prompt.contains("research", true) -> "deep-reasoning"
                    else -> "general"
                }
                val body = JSONObject()
                    .put("message", prompt)
                    .put("history", messages)
                    .put("taskType", taskType)
                    .toString()
                    .toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("${BuildConfig.SUPABASE_URL.trimEnd('/')}/functions/v1/reflex-nexus-chat")
                    .header("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
                    .header("Authorization", "Bearer $token")
                    .post(body)
                    .build()
                http.newCall(request).execute().use { response ->
                    val raw = response.body?.string().orEmpty()
                    val payload = runCatching { JSONObject(raw) }.getOrNull()
                    if (!response.isSuccessful) {
                        val error = payload?.optString("error")?.takeIf { it.isNotBlank() } ?: "CHAT_REQUEST_FAILED"
                        val detail = payload?.optString("detail")?.takeIf { it.isNotBlank() }
                        throw IOException(if (detail != null) "$error: $detail" else "$error (HTTP ${response.code})")
                    }
                    payload?.optString("answer")?.takeIf { it.isNotBlank() }
                        ?: throw IOException("وصل رد غير مكتمل من خدمة الذكاء الاصطناعي.")
                }
            }
            runOnUiThread { complete(result) }
        }.start()
    }

    private fun isLowMemoryDevice(): Boolean {
        val manager = getSystemService(ACTIVITY_SERVICE) as? android.app.ActivityManager ?: return false
        val info = android.app.ActivityManager.MemoryInfo()
        manager.getMemoryInfo(info)
        return manager.isLowRamDevice || info.totalMem <= 2_500L * 1024L * 1024L
    }
}
