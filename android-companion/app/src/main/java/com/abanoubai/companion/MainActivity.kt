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
        val title = TextView(this).apply { text = "AbanoubAI Companion\n\nأدخل Device ID ورمز الجلسة المؤقت من لوحة AbanoubAI، ثم فعّل خدمة الوصول يدويًا."; textSize = 18f; setPadding(32, 48, 32, 24) }
        val deviceId = EditText(this).apply { hint = "Device ID"; setText(prefs.getString("device_id", "")); setPadding(32, 12, 32, 12) }
        val accessToken = EditText(this).apply { hint = "Access token (يُحفظ محليًا فقط)"; setSingleLine(true); setText(prefs.getString("access_token", "")); setPadding(32, 12, 32, 12) }
        val connect = Button(this).apply { text = "حفظ والاتصال"; setOnClickListener { val id = deviceId.text.toString().trim(); val token = accessToken.text.toString().trim(); if (id.isEmpty() || token.isEmpty()) { title.text = "أدخل Device ID وAccess token أولًا." } else { prefs.edit().putString("device_id", id).putString("access_token", token).putBoolean("enabled", true).apply(); CompanionRuntime.start(this@MainActivity); title.text = "تم حفظ البيانات محليًا. فعّل Accessibility ثم اختبر أمرًا آمنًا." } } }
        val settings = Button(this).apply { text = "فتح إعدادات إمكانية الوصول"; setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) } }
        val stop = Button(this).apply { text = "إيقاف الاتصال"; setOnClickListener { CompanionRuntime.stop(this@MainActivity); title.text = "تم إيقاف الاتصال. لا ينفذ التطبيق أي أمر الآن." } }
        setContentView(LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; addView(title); addView(deviceId); addView(accessToken); addView(connect); addView(settings); addView(stop) })
    }
}
