package com.abanoubai.companion

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.content.ContextCompat

class NativeHomeActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (!isLowMemoryDevice()) {
            runCatching { CompanionRuntime.start(this) }
                .onFailure { Log.e("AbanoubAI", "Unable to initialize companion runtime", it) }
        }
        if (getSharedPreferences("companion", MODE_PRIVATE).getBoolean("enabled", false)) {
            runCatching {
                ContextCompat.startForegroundService(
                    this,
                    Intent(this, CompanionForegroundService::class.java)
                )
            }.onFailure {
                Log.e("AbanoubAI", "Unable to resume the enabled companion service", it)
            }
        }

        setContent { NativeWorkspaceScreen() }
    }

    private fun isLowMemoryDevice(): Boolean {
        val manager = getSystemService(ACTIVITY_SERVICE) as? android.app.ActivityManager ?: return false
        val info = android.app.ActivityManager.MemoryInfo()
        manager.getMemoryInfo(info)
        return manager.isLowRamDevice || info.totalMem <= 2_500L * 1024L * 1024L
    }
}
