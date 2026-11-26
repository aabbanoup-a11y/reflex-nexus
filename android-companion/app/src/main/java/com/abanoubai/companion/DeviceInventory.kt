package com.abanoubai.companion

import android.content.Context
import android.net.ConnectivityManager
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import org.json.JSONObject

/** Returns bounded device facts only; it never enumerates other apps, files or notifications. */
object DeviceInventory {
    fun device(context: Context): String {
        val battery = context.getSystemService(BatteryManager::class.java)
        val connectivity = context.getSystemService(ConnectivityManager::class.java)
        val data = StatFs(Environment.getDataDirectory().path)
        return JSONObject()
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
            .toString()
    }
}
