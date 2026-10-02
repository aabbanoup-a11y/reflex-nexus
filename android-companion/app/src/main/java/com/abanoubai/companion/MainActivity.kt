package com.abanoubai.companion

import android.annotation.SuppressLint
import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/**
 * AbanoubAI Companion starts with a local setup hub. The hub only opens Android's
 * own settings pages; the user remains in control of every sensitive permission.
 * The dashboard is opened explicitly after setup.
 */
class MainActivity : AppCompatActivity() {
    private lateinit var web: WebView
    private var showingDashboard = false

    inner class Bridge {
        private val prefs get() = getSharedPreferences("companion", MODE_PRIVATE)

        @JavascriptInterface fun getDeviceId(): String = prefs.getString("device_id", "") ?: ""

        @JavascriptInterface fun pairSession(deviceId: String, accessToken: String, refreshToken: String) {
            val changed = prefs.getString("access_token", null) != accessToken || prefs.getString("device_id", null) != deviceId
            prefs.edit().putString("device_id", deviceId).putString("access_token", accessToken)
                .putString("refresh_token", refreshToken).putBoolean("enabled", true).apply()
            if (changed) runOnUiThread { CompanionRuntime.restart(this@MainActivity) }
        }

        @JavascriptInterface fun openAccessibility() = runOnUiThread { openSettings(Settings.ACTION_ACCESSIBILITY_SETTINGS) }

        @JavascriptInterface fun isAccessibilityOn(): Boolean = CompanionAccessibilityService.instance != null

        @JavascriptInterface fun stop() = runOnUiThread {
            CompanionRuntime.stop(this@MainActivity)
            prefs.edit().remove("access_token").remove("refresh_token").apply()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showSetupHub()
        CompanionRuntime.start(this)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (showingDashboard && web.canGoBack()) web.goBack()
                else if (showingDashboard) showSetupHub()
                else finish()
            }
        })
    }

    private fun openSettings(action: String, data: Uri? = null) {
        runCatching {
            val intent = Intent(action).apply { if (data != null) this.data = data }
            startActivity(intent)
        }.onFailure {
            startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName")))
        }
    }

    private fun button(label: String, onClick: () -> Unit): Button = Button(this).apply {
        text = label
        textSize = 16f
        isAllCaps = false
        setPadding(20, 14, 20, 14)
        setOnClickListener { onClick() }
        layoutParams = LinearLayout.LayoutParams(-1, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            setMargins(0, 8, 0, 8)
        }
    }

    private fun showSetupHub() {
        showingDashboard = false
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(28, 24, 28, 24)
            setBackgroundColor(ContextCompat.getColor(this@MainActivity, android.R.color.background_dark))
        }
        val title = TextView(this).apply {
            text = "AbanoubAI Companion"
            textSize = 28f
            gravity = Gravity.CENTER
            setTextColor(ContextCompat.getColor(this@MainActivity, android.R.color.white))
            setPadding(0, 12, 0, 8)
        }
        val subtitle = TextView(this).apply {
            text = "مركز إعداد الهاتف\nفعّل ما تحتاجه فقط، وستظل كل الموافقات بيدك."
            textSize = 17f
            gravity = Gravity.CENTER
            setTextColor(0xffdddddd.toInt())
            setPadding(0, 0, 0, 18)
        }
        root.addView(title)
        root.addView(subtitle)
        root.addView(button("1  تفعيل Accessibility (مطلوب للتحكم)") {
            openSettings(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        })
        root.addView(button("2  إعداد البطارية والعمل في الخلفية") {
            openSettings(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        })
        root.addView(button("3  التشغيل التلقائي وإعدادات التطبيق") {
            openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
        })
        root.addView(button("4  الوصول إلى الإشعارات (اختياري وحساس)") {
            openSettings("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
        })
        root.addView(button("5  Usage Access — إحصاءات استخدام التطبيقات (اختياري)") {
            openSettings(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        })
        root.addView(button("6  الملفات والصور — اختيار يدوي من النظام") {
            startActivity(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                type = "*/*"
                addCategory(Intent.CATEGORY_OPENABLE)
            })
        })
        root.addView(button("7  السماح بالكاميرا — عند الحاجة فقط") {
            requestPermissions(arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA)
        })
        root.addView(button("8  السماح بالميكروفون — عند الحاجة فقط") {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST_MIC)
        })
        root.addView(button("9  السماح بالموقع — عند الحاجة فقط") {
            requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), REQUEST_LOCATION)
        })
        val note = TextView(this).apply {
            text = "مهم: لا توجد صلاحية واحدة تمنح تحكمًا كاملًا. لا تمنح الإشعارات أو الموقع أو الكاميرا أو الميكروفون إلا عند الحاجة. التطبيق لا يطلب قراءة كلمات المرور أو بيانات التطبيقات الخاصة."
            textSize = 14f
            setTextColor(0xffffd180.toInt())
            setPadding(0, 18, 0, 12)
        }
        root.addView(note)
        root.addView(button("فتح لوحة AbanoubAI وتسجيل الدخول") { showDashboard() })
        root.addView(button("فتح إعدادات التطبيق مباشرة") {
            openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
        })
        val scroll = ScrollView(this).apply { addView(root) }
        setContentView(scroll)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        val label = when (requestCode) {
            REQUEST_CAMERA -> "الكاميرا"
            REQUEST_MIC -> "الميكروفون"
            REQUEST_LOCATION -> "الموقع"
            else -> "الصلاحية"
        }
        Toast.makeText(this, if (grantResults.firstOrNull() == android.content.pm.PackageManager.PERMISSION_GRANTED) "تم السماح بـ $label" else "لم يتم السماح بـ $label", Toast.LENGTH_SHORT).show()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun showDashboard() {
        showingDashboard = true
        CookieManager.getInstance().setAcceptCookie(true)
        web = WebView(this).apply {
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.userAgentString = settings.userAgentString.replace("; wv)", ")").replace(Regex("Version/\\S+ "), "")
            settings.javaScriptCanOpenWindowsAutomatically = true
            addJavascriptInterface(Bridge(), "AbanoubAI")
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                    val host = Uri.parse(url).host.orEmpty()
                    val keep = host == SITE_HOST || host.endsWith(".lovable.app") || host.endsWith(".lovable.cloud") ||
                        host.endsWith(".lovable.dev") || host == "lovable.dev" || host == "accounts.google.com" ||
                        host.endsWith(".google.com") || host.endsWith(".gstatic.com") || host.endsWith(".googleusercontent.com")
                    if (keep) return false
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    return true
                }
            }
        }
        setContentView(web)
        web.loadUrl("https://$SITE_HOST/")
    }

    override fun onPause() {
        if (::web.isInitialized) CookieManager.getInstance().flush()
        super.onPause()
    }

    companion object {
        const val SITE_HOST = "reflex-nexus.lovable.app"
        private const val REQUEST_CAMERA = 1001
        private const val REQUEST_MIC = 1002
        private const val REQUEST_LOCATION = 1003
    }
}
