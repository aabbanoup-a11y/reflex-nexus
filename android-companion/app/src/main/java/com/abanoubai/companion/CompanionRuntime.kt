package com.abanoubai.companion

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import okio.ByteString
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
        val deviceId = context.getSharedPreferences("companion", Context.MODE_PRIVATE).getString("device_id", null) ?: return
        val url = BuildConfig.SUPABASE_URL
        val key = BuildConfig.SUPABASE_PUBLISHABLE_KEY
        if (!url.startsWith("https://") || key.startsWith("YOUR_")) return
        val wsUrl = url.replace("https://", "wss://") + "/realtime/v1/websocket?apikey=$key&vsn=1.0.0"
        val request = Request.Builder().url(wsUrl).build()
        socket = http.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: okhttp3.Response) {
                val join = "{\"topic\":\"realtime:public\",\"event\":\"phx_join\",\"payload\":{\"config\":{\"postgres_changes\":[{\"event\":\"INSERT\",\"schema\":\"public\",\"table\":\"companion_commands\",\"filter\":\"device_id=eq.$deviceId\"}]}},\"ref\":\"1\"}"
                webSocket.send(join)
            }
            override fun onMessage(webSocket: WebSocket, text: String) { handleMessage(context, text) }
            override fun onMessage(webSocket: WebSocket, bytes: ByteString) { handleMessage(context, bytes.utf8()) }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: okhttp3.Response?) { socket = null }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) { socket = null }
        })
    }

    private fun handleMessage(context: Context, text: String) {
        runCatching {
            val root = Json.parseToJsonElement(text).jsonObject
            if (root["event"]?.jsonPrimitive?.contentOrNull != "postgres_changes") return
            val record = root["payload"]?.jsonObject?.get("data")?.jsonObject?.get("record")?.jsonObject ?: return
            val kind = record["kind"]?.jsonPrimitive?.contentOrNull ?: return
            CommandExecutor.execute(context, kind, record)
        }
    }

    fun stop(context: Context) {
        socket?.close(1000, "user_stop")
        socket = null
        context.getSharedPreferences("companion", Context.MODE_PRIVATE).edit().putBoolean("enabled", false).apply()
    }
}
