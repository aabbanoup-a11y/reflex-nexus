package com.abanoubai.companion

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder

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
        startForeground(NOTIFICATION_ID, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        CompanionRuntime.start(this)
        return START_STICKY
    }

    override fun onDestroy() { CompanionRuntime.stop(this); super.onDestroy() }
    override fun onBind(intent: Intent?): IBinder? = null

    companion object { private const val CHANNEL = "abanoubai_companion"; private const val NOTIFICATION_ID = 7101 }
}
