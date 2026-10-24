package com.abanoubai.companion

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log

class CompanionForegroundService : Service() {
    override fun onCreate() {
        super.onCreate()
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(NotificationChannel(CHANNEL, "AbanoubAI Companion", NotificationManager.IMPORTANCE_LOW).apply {
                description = "اتصال الهاتف وتنفيذ أوامر AbanoubAI مع الإيقاف الطارئ"
            })
        }
        val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL).setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle("AbanoubAI Companion يعمل").setContentText("التنفيذ التلقائي تحت إشرافك ويمكن إيقافه طارئًا").setOngoing(true).build()
        } else Notification.Builder(this).setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle("AbanoubAI Companion يعمل").setOngoing(true).build()

        // Android 14+ requires an explicit foreground-service type. This
        // persistent, user-enabled companion connection is not a time-limited
        // data-sync job, so it uses the special-use type declared in the manifest.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        runCatching { CompanionRuntime.start(this) }
            .onFailure { Log.e(TAG, "Could not start companion connection; keeping service alive", it) }
        return START_STICKY
    }

    override fun onDestroy() { CompanionRuntime.stop(this); super.onDestroy() }
    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "AbanoubAICompanion"
        private const val CHANNEL = "abanoubai_companion"
        private const val NOTIFICATION_ID = 7101
    }
}
