package com.abanoubai.companion

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

/**
 * The app IS the AbanoubAI website. After the user signs in, the page calls
 * AbanoubAI.pairSession(...) so this phone is linked to the account automatically.
 * Commands still require the user to enable Accessibility once, and sensitive ones need approval on the page.
 */
class MainActivity : AppCompatActivity() {
    private lateinit var web: WebView

    inner class Bridge {
        private val prefs get() = getSharedPreferences("companion", MODE_PRIVATE)

        @JavascriptInterface fun getDeviceId(): String = prefs.getString("device_id", "") ?: ""

        @JavascriptInterface fun pairSession(deviceId: String, accessToken: String, refreshToken: String) {
            val changed = prefs.getString("access_token", null) != accessToken || prefs.getString("device_id", null) != deviceId
            prefs.edit().putString("device_id", deviceId).putString("access_token", accessToken)
                .putString("refresh_token", refreshToken).putBoolean("enabled", true).apply()
            if (changed) runOnUiThread { CompanionRuntime.restart(this@MainActivity) }
        }

        @JavascriptInterface fun openAccessibility() = runOnUiThread { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }

        @JavascriptInterface fun isAccessibilityOn(): Boolean = CompanionAccessibilityService.instance != null

        @JavascriptInterface fun stop() = runOnUiThread {
            CompanionRuntime.stop(this@MainActivity)
            prefs.edit().remove("access_token").remove("refresh_token").apply()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        CookieManager.getInstance().setAcceptCookie(true)
        web = WebView(this).apply {
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            addJavascriptInterface(Bridge(), "AbanoubAI")
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                    val host = Uri.parse(url).host.orEmpty()
                    if (host == SITE_HOST || host.endsWith(".lovable.app") || host.endsWith(".lovable.cloud")) return false
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    return true
                }
            }
        }
        setContentView(web)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { if (web.canGoBack()) web.goBack() else finish() }
        })
        CompanionRuntime.start(this)
        web.loadUrl("https://$SITE_HOST/")
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        super.onPause()
    }

    companion object { const val SITE_HOST = "reflex-nexus.lovable.app" }
}
