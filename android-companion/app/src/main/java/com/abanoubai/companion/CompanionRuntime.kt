package com.abanoubai.companion

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.json.JSONArray
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull
import java.util.concurrent.TimeUnit
import android.os.Handler
import android.os.Looper

object CompanionRuntime {
    private val http = OkHttpClient.Builder().pingInterval(20, TimeUnit.SECONDS).build()
    private var socket: WebSocket? = null
    private var stopped = false
    private val retryHandler = Handler(Looper.getMainLooper())
    private val pollHandler = Handler(Looper.getMainLooper())
    private val seenCommands = mutableSetOf<String>()
    private val commandLock = Any()

    fun start(context: Context) {
        if (socket != null) return
        stopped = false
        val prefs = context.getSharedPreferences("companion", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("device_id", null) ?: return
        val accessToken = prefs.getString("access_token", null) ?: return
        val url = BuildConfig.SUPABASE_URL
        val key = BuildConfig.SUPABASE_PUBLISHABLE_KEY
        if (!url.startsWith("https://") || key.startsWith("YOUR_")) return
        val wsUrl = url.replace("https://", "wss://") + "/realtime/v1/websocket?apikey=$key&vsn=1.0.0"
        val request = Request.Builder().url(wsUrl).build()
        socket = http.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: okhttp3.Response) {
                val join = JSONObject().apply {
                    put("topic", "realtime:companion-$deviceId")
                    put("event", "phx_join")
                    put("ref", "1")
                    put("payload", JSONObject().apply {
                        put("access_token", accessToken)
                        put("config", JSONObject().apply {
                            put("broadcast", JSONObject().put("self", false))
                            put("presence", JSONObject())
                            put("postgres_changes", org.json.JSONArray().put(JSONObject().apply {
                            put("event", "*"); put("schema", "public"); put("table", "companion_commands"); put("filter", "device_id=eq.$deviceId")
                            }))
                        })
                    })
                }.toString()
                webSocket.send(join)
            }
            override fun onMessage(webSocket: WebSocket, text: String) {
                if (text.contains("\"event\":\"phx_reply\"") && text.contains("\"status\":\"ok\"")) {
                    patchDevice(context, deviceId, accessToken, "online", null)
                }
                handleMessage(context, text)
            }
            override fun onMessage(webSocket: WebSocket, bytes: ByteString) { handleMessage(context, bytes.utf8()) }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: okhttp3.Response?) {
                socket = null
                patchDevice(context, deviceId, accessToken, "offline", t.message)
                scheduleRetry(context)
            }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                socket = null
                patchDevice(context, deviceId, accessToken, "offline", reason)
                scheduleRetry(context)
            }
        })
        startApprovedCommandPolling(context.applicationContext)
    }

    private fun startApprovedCommandPolling(context: Context) {
        pollHandler.removeCallbacksAndMessages(null)
        pollHandler.post(object : Runnable {
            override fun run() {
                if (!stopped) {
                    pollApprovedCommands(context)
                    pollHandler.postDelayed(this, 4000)
                }
            }
        })
    }

    private fun pollApprovedCommands(context: Context) {
        val prefs = context.getSharedPreferences("companion", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("device_id", null) ?: return
        val token = prefs.getString("access_token", null) ?: return
        val url = BuildConfig.SUPABASE_URL.trimEnd() + "/rest/v1/companion_commands?device_id=eq.$deviceId&status=eq.approved&order=created_at.asc&limit=10"
        val request = Request.Builder().url(url)
            .get()
            .addHeader("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
            .addHeader("Authorization", "Bearer $token")
            .build()
        http.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: java.io.IOException) = Unit
            override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) {
                response.use {
                    if (!it.isSuccessful) return
                    runCatching {
                        val rows = JSONArray(it.body?.string().orEmpty())
                        for (index in 0 until rows.length()) {
                            val row = rows.getJSONObject(index)
                            val id = row.optString("id")
                            if (id.isBlank() || !seenCommands.add(id)) continue
                            val record = Json.parseToJsonElement(row.toString()).jsonObject
                            val kind = row.optString("kind")
                            executeApproved(context, record)
                        }
                    }
                }
            }
        })
    }

    private fun scheduleRetry(context: Context) {
        if (stopped) return
        retryHandler.removeCallbacksAndMessages(null)
        retryHandler.postDelayed({ if (!stopped) start(context.applicationContext) }, 5000)
    }

    private fun handleMessage(context: Context, text: String) {
        runCatching {
            val root = Json.parseToJsonElement(text).jsonObject
            if (root["event"]?.jsonPrimitive?.contentOrNull != "postgres_changes") return
            val record = root["payload"]?.jsonObject?.get("data")?.jsonObject?.get("record")?.jsonObject ?: return
            val kind = record["kind"]?.jsonPrimitive?.contentOrNull ?: return
            val id = record["id"]?.jsonPrimitive?.contentOrNull ?: return
            if (record["status"]?.jsonPrimitive?.contentOrNull != "approved") return
            if (!seenCommands.add(id)) return
            executeApproved(context, record)
        }
    }

    private fun executeApproved(context: Context, record: JsonObject) {
        synchronized(commandLock) {
            val id = record["id"]?.jsonPrimitive?.contentOrNull ?: return
            val kind = record["kind"]?.jsonPrimitive?.contentOrNull ?: return
            patchCommand(context, id, "running", null)
            runCatching { CommandExecutor.execute(context, kind, record) }
                .onSuccess { result ->
                    patchCommand(context, id, "succeeded", "تم التنفيذ")
                    event(context, record, if (kind.endsWith("inventory")) "inventory" else "done", result.take(12000))
                }
                .onFailure { error ->
                    patchCommand(context, id, "failed", error.message ?: "فشل التنفيذ")
                    event(context, record, "error", error.message ?: "فشل التنفيذ")
                }
        }
    }

    private fun request(context: Context, path: String, token: String, method: String, body: JSONObject) {
        val r = Request.Builder().url(BuildConfig.SUPABASE_URL.trimEnd('/') + "/rest/v1/" + path)
            .method(method, body.toString().toRequestBody("application/json".toMediaType()))
            .addHeader("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "return=minimal").build()
        http.newCall(r).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: java.io.IOException) = Unit
            override fun onResponse(call: okhttp3.Call, response: okhttp3.Response) { response.close() }
        })
    }

    private fun patchDevice(context: Context, deviceId: String, token: String, status: String, error: String?) = request(context, "companion_devices?id=eq.$deviceId", token, "PATCH", JSONObject().apply { put("status", status); put("last_seen_at", java.time.Instant.now().toString()); if (error != null) put("updated_at", java.time.Instant.now().toString()) })
    private fun patchCommand(context: Context, id: String, status: String, error: String?) = context.getSharedPreferences("companion", Context.MODE_PRIVATE).getString("access_token", null)?.let { token -> request(context, "companion_commands?id=eq.$id", token, "PATCH", JSONObject().apply { put("status", status); if (status == "running") put("started_at", java.time.Instant.now().toString()); if (status == "succeeded" || status == "failed") put("finished_at", java.time.Instant.now().toString()); if (error != null) put("error", error.take(1000)) }) }
    private fun event(context: Context, record: JsonObject, type: String, message: String) = context.getSharedPreferences("companion", Context.MODE_PRIVATE).getString("access_token", null)?.let { token -> val deviceId = context.getSharedPreferences("companion", Context.MODE_PRIVATE).getString("device_id", "") ?: ""; request(context, "companion_events", token, "POST", JSONObject().apply { put("command_id", record["id"]?.jsonPrimitive?.contentOrNull); put("device_id", deviceId); userIdFrom(token)?.let { put("user_id", it) }; put("event_type", type); put("message", message.take(if (type == "screenshot") 1_900_000 else 12000)) }) }

    private fun userIdFrom(token: String): String? = runCatching {
        val part = token.split(".")[1]
        JSONObject(String(android.util.Base64.decode(part, android.util.Base64.URL_SAFE or android.util.Base64.NO_PADDING or android.util.Base64.NO_WRAP))).optString("sub").ifBlank { null }
    }.getOrNull()

    fun reportScreenshot(context: Context, record: JsonObject, dataUrl: String) {
        event(context, record, "screenshot", dataUrl.take(1_900_000))
    }

    fun reportScreenshotError(context: Context, record: JsonObject, message: String) {
        event(context, record, "error", message)
    }

    fun reportScreenText(context: Context, record: JsonObject, text: String) {
        event(context, record, "screen_text", text)
    }

    fun reportVoice(context: Context, record: JsonObject, text: String) {
        event(context, record, "voice_transcript", text)
    }

    fun reportVoiceError(context: Context, record: JsonObject, message: String) {
        event(context, record, "error", message)
    }

    fun stop(context: Context) {
        stopped = true
        retryHandler.removeCallbacksAndMessages(null)
        pollHandler.removeCallbacksAndMessages(null)
        seenCommands.clear()
        socket?.close(1000, "user_stop")
        socket = null
        val prefs = context.getSharedPreferences("companion", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("enabled", false).apply()
    }

    fun restart(context: Context) {
        socket?.cancel()
        socket = null
        start(context)
    }
}
