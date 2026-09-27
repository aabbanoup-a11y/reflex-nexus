package com.abanoubai.companion

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val title = TextView(this).apply { text = "AbanoubAI Companion\n\nاربط الهاتف من لوحة AbanoubAI، ثم فعّل خدمة الوصول يدويًا."; textSize = 18f; setPadding(32, 48, 32, 24) }
        val settings = Button(this).apply { text = "فتح إعدادات إمكانية الوصول"; setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) } }
        val stop = Button(this).apply { text = "إيقاف الاتصال"; setOnClickListener { CompanionRuntime.stop(this@MainActivity); title.text = "تم إيقاف الاتصال. لا ينفذ التطبيق أي أمر الآن." } }
        setContentView(LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; addView(title); addView(settings); addView(stop) })
        CompanionRuntime.start(this)
    }
}
