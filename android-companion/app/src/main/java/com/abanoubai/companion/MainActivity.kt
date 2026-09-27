package com.abanoubai.companion

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = getSharedPreferences("companion", MODE_PRIVATE)
        val title = TextView(this).apply { text = "AbanoubAI Companion\n\nأدخل Device ID الذي تنشئه لوحة AbanoubAI، ثم فعّل خدمة الوصول يدويًا."; textSize = 18f; setPadding(32, 48, 32, 24) }
        val deviceId = EditText(this).apply { hint = "Device ID"; setText(prefs.getString("device_id", "")); setPadding(32, 12, 32, 12) }
        val connect = Button(this).apply { text = "حفظ والاتصال"; setOnClickListener { prefs.edit().putString("device_id", deviceId.text.toString().trim()).putBoolean("enabled", true).apply(); CompanionRuntime.start(this@MainActivity); title.text = "تم حفظ Device ID. فعّل Accessibility ثم اختبر أمرًا آمنًا." } }
        val settings = Button(this).apply { text = "فتح إعدادات إمكانية الوصول"; setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) } }
        val stop = Button(this).apply { text = "إيقاف الاتصال"; setOnClickListener { CompanionRuntime.stop(this@MainActivity); title.text = "تم إيقاف الاتصال. لا ينفذ التطبيق أي أمر الآن." } }
        setContentView(LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; addView(title); addView(deviceId); addView(connect); addView(settings); addView(stop) })
    }
}
