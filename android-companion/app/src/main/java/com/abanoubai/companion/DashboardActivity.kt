package com.abanoubai.companion

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.JavascriptInterface
import android.content.Intent
import android.net.Uri
import androidx.appcompat.app.AppCompatActivity

class DashboardActivity : AppCompatActivity() {
    class PairingBridge(private val activity: DashboardActivity) {
        @JavascriptInterface
        fun savePairing(deviceId: String, accessToken: String) {
            activity.runOnUiThread {
                activity.startActivity(Intent(activity, MainActivity::class.java).apply {
                    putExtra("device_id", deviceId)
                    putExtra("access_token", accessToken)
                    addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                })
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        title = "لوحة AbanoubAI"
        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadsImagesAutomatically = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            addJavascriptInterface(PairingBridge(this@DashboardActivity), "AbanoubAI")
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                    val host = Uri.parse(url).host.orEmpty()
                    if (host == "reflex-nexus.lovable.app" || host.endsWith(".lovable.app")) return false
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    return true
                }
            }
            webChromeClient = WebChromeClient()
        }
        setContentView(webView)
        webView.loadUrl("https://reflex-nexus.lovable.app/auth")
    }
}
