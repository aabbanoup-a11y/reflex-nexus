package com.abanoubai.companion

import android.content.Context
import android.content.SharedPreferences
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.realtime.Realtime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull

object CompanionRuntime {
    private var job: Job? = null
    private var client: io.github.jan.supabase.SupabaseClient? = null
    private lateinit var prefs: SharedPreferences

    fun start(context: Context) {
        if (job != null) return
        prefs = context.getSharedPreferences("companion", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("device_id", null) ?: return
        val url = BuildConfig.SUPABASE_URL
        val key = BuildConfig.SUPABASE_PUBLISHABLE_KEY
        if (url.startsWith("https://YOUR_") || key.startsWith("YOUR_")) return
        val supabase = createSupabaseClient(url, key) { install(Realtime) }
        client = supabase
        val channel = supabase.channel("companion:$deviceId")
        job = channel.postgresChangeFlow<io.github.jan.supabase.realtime.PostgresAction.Insert>(schema = "public") {
            table = "companion_commands"
            filter = "device_id=eq.$deviceId"
        }.onEach { change ->
            val record = change.record
            val kind = record["kind"]?.jsonPrimitive?.contentOrNull ?: return@onEach
            CommandExecutor.execute(context, kind, record)
        }.launchIn(CoroutineScope(Dispatchers.IO))
        CoroutineScope(Dispatchers.IO).launch { supabase.realtime.connect(); channel.subscribe() }
    }

    fun stop(context: Context) {
        job?.cancel(); job = null
        client?.realtime?.disconnect(); client = null
        context.getSharedPreferences("companion", Context.MODE_PRIVATE).edit().putBoolean("enabled", false).apply()
    }
}
