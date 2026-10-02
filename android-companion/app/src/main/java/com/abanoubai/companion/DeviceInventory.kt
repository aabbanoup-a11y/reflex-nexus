package com.abanoubai.companion

import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import org.json.JSONArray
import org.json.JSONObject

/** Returns bounded, non-secret device facts. It intentionally omits identifiers, credentials and private app data. */
object DeviceInventory {
    fun device(context: Context): String {
        val battery = context.getSystemService(BatteryManager::class.java)
        val connectivity = context.getSystemService(ConnectivityManager::class.java)
        val data = StatFs(Environment.getDataDirectory().path)
        val out = JSONObject()
            .put("kind", "device_inventory")
            .put("manufacturer", Build.MANUFACTURER)
            .put("model", Build.MODEL)
            .put("android", Build.VERSION.RELEASE)
            .put("sdk", Build.VERSION.SDK_INT)
            .put("battery_percent", battery?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1)
            .put("charging", battery?.isCharging ?: false)
            .put("network_available", connectivity?.activeNetwork != null)
            .put("storage_free_bytes", data.availableBytes)
            .put("storage_total_bytes", data.totalBytes)
            .put("accessibility_enabled", CompanionAccessibilityService.instance != null)
            .put("notifications_listener_enabled", NotificationInbox.enabled)
        return out.toString()
    }

    fun apps(context: Context): String {
        val pm = context.packageManager
        val list = JSONArray()
        pm.getInstalledApplications(PackageManager.GET_META_DATA)
            .asSequence()
            .filter { pm.getLaunchIntentForPackage(it.packageName) != null }
            .sortedBy { pm.getApplicationLabel(it).toString().lowercase() }
            .take(300)
            .forEach { app ->
                list.put(JSONObject()
                    .put("name", pm.getApplicationLabel(app).toString())
                    .put("package", app.packageName)
                    .put("system", (app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0))
            }
        return JSONObject().put("kind", "app_inventory").put("count", list.length()).put("apps", list).toString()
    }

    fun notifications(): String = JSONObject()
        .put("kind", "notification_inventory")
        .put("enabled", NotificationInbox.enabled)
        .put("items", NotificationInbox.snapshot())
        .toString()
}

object NotificationInbox {
    @Volatile var enabled: Boolean = false
    private val items = ArrayDeque<JSONObject>()

    @Synchronized fun add(packageName: String, title: String, text: String) {
        enabled = true
        items.addFirst(JSONObject().put("package", packageName).put("title", title.take(200)).put("text", text.take(1000)))
        while (items.size > 50) items.removeLast()
    }

    @Synchronized fun snapshot(): JSONArray = JSONArray(items.map { it.toString() })
}
