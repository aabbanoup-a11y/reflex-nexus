package com.abanoubai.companion

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class CompanionBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
        val prefs = context.getSharedPreferences("companion", Context.MODE_PRIVATE)
        if (!prefs.getBoolean("enabled", false)) return
        ContextCompat.startForegroundService(context, Intent(context, CompanionForegroundService::class.java))
    }
}
