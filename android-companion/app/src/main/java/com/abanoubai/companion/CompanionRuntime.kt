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
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull

object CompanionRuntime {
    private val http = OkHttpClient()
    private var socket: WebSocket? = null

    fun start(context: Context) {
        if (socket != null) return
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
                        put("config", JSONObject().put("postgres_changes", org.json.JSONArray().put(JSONObject().apply {
                            put("event", "*"); put("schema", "public"); put("table", "companion_commands"); put("filter", "device_id=eq.$deviceId")
                        })))
                    })
                }.toString()
                webSocket.send(join)
                patchDevice(context, deviceId, accessToken, "online", null)
            }
            override fun onMessage(webSocket: WebSocket, text: String) { handleMessage(context, text) }
            override fun onMessage(webSocket: WebSocket, bytes: ByteString) { handleMessage(context, bytes.utf8()) }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: okhttp3.Response?) { socket = null; patchDevice(context, deviceId, accessToken, "offline", t.message) }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) { socket = null; patchDevice(context, deviceId, accessToken, "offline", reason) }
        })
    }

    private fun handleMessage(context: Context, text: String) {
        runCatching {
            val root = Json.parseToJsonElement(text).jsonObject
            if (root["event"]?.jsonPrimitive?.contentOrNull != "postgres_changes") return
            val record = root["payload"]?.jsonObject?.get("data")?.jsonObject?.get("record")?.jsonObject ?: return
            val kind = record["kind"]?.jsonPrimitive?.contentOrNull ?: return
            val id = record["id"]?.jsonPrimitive?.contentOrNull ?: return
            if (record["status"]?.jsonPrimitive?.contentOrNull != "approved") return
            patchCommand(context, id, "running", null)
            runCatching { CommandExecutor.execute(context, kind, record) }
                .onSuccess { patchCommand(context, id, "succeeded", "تم التنفيذ") ; event(context, record, "done", "تم تنفيذ $kind") }
                .onFailure { patchCommand(context, id, "failed", it.message ?: "فشل التنفيذ"); event(context, record, "error", it.message ?: "فشل التنفيذ") }
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
    private fun event(context: Context, record: JsonObject, type: String, message: String) = context.getSharedPreferences("companion", Context.MODE_PRIVATE).getString("access_token", null)?.let { token -> val deviceId = context.getSharedPreferences("companion", Context.MODE_PRIVATE).getString("device_id", "") ?: ""; request(context, "companion_events", token, "POST", JSONObject().apply { put("command_id", record["id"]?.jsonPrimitive?.contentOrNull); put("device_id", deviceId); put("event_type", type); put("message", message.take(2000)) }) }

    fun stop(context: Context) {
        socket?.close(1000, "user_stop")
        socket = null
        val prefs = context.getSharedPreferences("companion", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("enabled", false).apply()
    }
}
