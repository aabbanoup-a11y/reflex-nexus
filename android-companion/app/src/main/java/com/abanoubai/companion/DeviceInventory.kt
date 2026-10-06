package com.abanoubai.companion

import android.content.Context
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.provider.MediaStore
import android.net.Uri
import java.util.Locale
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
            .sortedBy { pm.getApplicationLabel(it).toString().lowercase() }
            .take(300)
            .forEach { app ->
                list.put(JSONObject()
                    .put("name", pm.getApplicationLabel(app).toString())
                    .put("package", app.packageName)
                    .put("launchable", pm.getLaunchIntentForPackage(app.packageName) != null)
                    .put("system", (app.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0))
            }
        return JSONObject().put("kind", "app_inventory").put("count", list.length()).put("apps", list).toString()
    }

    fun notifications(): String = JSONObject()
        .put("kind", "notification_inventory")
        .put("enabled", NotificationInbox.enabled)
        .put("items", NotificationInbox.snapshot())
        .toString()

    fun files(context: Context): String {
        val rows = JSONArray()
        val projection = arrayOf(MediaStore.Files.FileColumns.DISPLAY_NAME, MediaStore.Files.FileColumns.MIME_TYPE, MediaStore.Files.FileColumns.SIZE, MediaStore.Files.FileColumns.DATE_MODIFIED, MediaStore.Files.FileColumns.DATA)
        runCatching {
            context.contentResolver.query(MediaStore.Files.getContentUri("external"), projection, null, null, "${MediaStore.Files.FileColumns.DATE_MODIFIED} DESC")?.use { c ->
                val name = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DISPLAY_NAME)
                val mime = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MIME_TYPE)
                val size = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.SIZE)
                val modified = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATE_MODIFIED)
                val data = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATA)
                var count = 0
                while (c.moveToNext() && count++ < 500) rows.put(JSONObject()
                    .put("name", c.getString(name) ?: "")
                    .put("mime", c.getString(mime) ?: "application/octet-stream")
                    .put("size", c.getLong(size))
                    .put("modified", c.getLong(modified))
                    .put("path", c.getString(data) ?: ""))
            }
        }
        return JSONObject().put("kind", "file_inventory").put("count", rows.length()).put("files", rows).put("note", "النتيجة تتبع ما يسمح به Android وMediaStore فقط").toString()
    }

    fun permissions(context: Context, packageName: String?): String {
        val pm = context.packageManager
        val apps = if (!packageName.isNullOrBlank()) listOfNotNull(runCatching { pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS) }.getOrNull()) else pm.getInstalledPackages(PackageManager.GET_PERMISSIONS).take(300)
        val out = JSONArray()
        apps.forEach { info ->
            val perms = JSONArray()
            info.requestedPermissions?.forEachIndexed { i, p ->
                val granted = info.requestedPermissionsFlags?.getOrNull(i)?.and(android.content.pm.PackageInfo.REQUESTED_PERMISSION_GRANTED) != 0
                perms.put(JSONObject().put("name", p).put("granted", granted))
            }
            out.put(JSONObject().put("package", info.packageName).put("permissions", perms))
        }
        return JSONObject().put("kind", "app_permissions").put("apps", out).toString()
    }
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
