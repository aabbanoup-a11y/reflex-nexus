package com.abanoubai.companion

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/** Enabled only after the user manually grants Notification Access in Android settings. */
class CompanionNotificationListener : NotificationListenerService() {
    override fun onListenerConnected() { NotificationInbox.enabled = true }
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val extras = sbn.notification.extras
        val title = extras.getCharSequence("android.title")?.toString().orEmpty()
        val text = extras.getCharSequence("android.text")?.toString().orEmpty()
        if (title.isNotBlank() || text.isNotBlank()) NotificationInbox.add(sbn.packageName, title, text)
    }
    override fun onNotificationRemoved(sbn: StatusBarNotification) = Unit
    override fun onListenerDisconnected() { NotificationInbox.enabled = false }
}
