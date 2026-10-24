package com.abanoubai.companion

import android.annotation.SuppressLint
import android.Manifest
import android.app.AppOpsManager
import android.app.ActivityManager
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Bundle
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.PermissionRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import org.json.JSONObject
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/**
 * AbanoupAi is one Android app containing the existing Lovable dashboard.
 * The dashboard is the launch screen; the local hub is only a fallback when
 * the remote page cannot load, so the user does not navigate between apps.
 */
class MainActivity : AppCompatActivity() {
    private lateinit var web: WebView
    private var showingDashboard = false
    private var showingOfflineHub = false

    inner class Bridge {
        private val prefs get() = getSharedPreferences("companion", MODE_PRIVATE)

        @JavascriptInterface fun getDeviceId(): String = prefs.getString("device_id", "") ?: ""

        @JavascriptInterface fun pairSession(deviceId: String, accessToken: String, refreshToken: String) {
            val changed = prefs.getString("access_token", null) != accessToken || prefs.getString("device_id", null) != deviceId
            prefs.edit().putString("device_id", deviceId).putString("access_token", accessToken)
                .putString("refresh_token", refreshToken).putBoolean("enabled", true).apply()
            // Pairing can happen through the WebView bridge. Keep an OS-level
            // foreground-service startup failure from escaping this bridge call
            // and taking down the dashboard; the pairing state is still saved.
            runCatching {
                ContextCompat.startForegroundService(this@MainActivity, Intent(this@MainActivity, CompanionForegroundService::class.java))
            }.onFailure { error ->
                android.util.Log.e("AbanoubAICompanion", "Unable to start companion service after pairing", error)
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "تعذر تشغيل الاتصال في الخلفية؛ ستظل الواجهة متاحة.", Toast.LENGTH_LONG).show()
                }
            }
            if (changed) runOnUiThread { CompanionRuntime.restart(this@MainActivity) }
        }

        @JavascriptInterface fun openAccessibility() = runOnUiThread { openSettings(Settings.ACTION_ACCESSIBILITY_SETTINGS) }

        @JavascriptInterface fun isAccessibilityOn(): Boolean = CompanionAccessibilityService.instance != null

        @JavascriptInterface fun stop() = runOnUiThread {
            CompanionRuntime.stop(this@MainActivity)
            prefs.edit().remove("access_token").remove("refresh_token").apply()
        }

        @JavascriptInterface fun listenLocalAgent() = runOnUiThread { this@MainActivity.listenLocalAgent() }

        @JavascriptInterface fun startVoiceRecognition() = runOnUiThread {
            if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST_MIC)
                return@runOnUiThread
            }
            runCatching {
                VoiceController.listenLocal(this@MainActivity, { spoken ->
                    if (::web.isInitialized) web.evaluateJavascript("window.__abanoupaiVoiceResult(${JSONObject.quote(spoken)})", null)
                }, { error ->
                    if (::web.isInitialized) web.evaluateJavascript("window.__abanoupaiVoiceError(${JSONObject.quote(error)})", null)
                })
            }.onFailure { error ->
                if (::web.isInitialized) web.evaluateJavascript("window.__abanoupaiVoiceError(${JSONObject.quote(error.message ?: "تعذر تشغيل الصوت")})", null)
            }
        }

        @JavascriptInterface fun stopVoiceRecognition() = VoiceController.stop()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Keep the Companion lightweight: complex planning is cloud-first and
        // the dashboard opens in the external browser on low-RAM devices.
        if (isLowMemoryDevice()) {
            showOfflineHub()
            if (isNetworkAvailable()) openDashboardExternal()
        } else showDashboard()
        // Keep the dashboard usable even if background companion initialization fails.
        if (!isLowMemoryDevice()) {
            runCatching { CompanionRuntime.start(this) }
                .onFailure { android.util.Log.e("AbanoubAICompanion", "Unable to initialize the companion runtime", it) }
        }
        if (getSharedPreferences("companion", MODE_PRIVATE).getBoolean("enabled", false)) {
            runCatching {
                ContextCompat.startForegroundService(this, Intent(this, CompanionForegroundService::class.java))
            }.onFailure {
                android.util.Log.e("AbanoubAICompanion", "Unable to start the background companion service", it)
                Toast.makeText(this, "تعذر تشغيل الاتصال في الخلفية؛ ستظل الواجهة متاحة.", Toast.LENGTH_LONG).show()
            }
        }
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (showingDashboard && web.canGoBack()) web.goBack()
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

    private fun setupItem(title: String, detail: String, enabled: Boolean?, onClick: () -> Unit): View {
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 10, 16, 10)
            setBackgroundColor(0xff202124.toInt())
            layoutParams = LinearLayout.LayoutParams(-1, LinearLayout.LayoutParams.WRAP_CONTENT).apply { setMargins(0, 8, 0, 8) }
        }
        val state = when (enabled) { true -> "الحالة: مفعّل"; false -> "الحالة: غير مفعّل"; null -> "الحالة: غير قابل للتحقق تلقائيًا" }
        box.addView(TextView(this).apply { text = "$title\n$state"; textSize = 17f; setTextColor(if (enabled == true) 0xff9be7a1.toInt() else 0xffffd180.toInt()) })
        box.addView(TextView(this).apply { text = detail; textSize = 13f; setTextColor(0xffdddddd.toInt()); setPadding(0, 6, 0, 4) })
        box.addView(button("فتح إعداد $title") { onClick() })
        return box
    }

    private fun notificationAccessOn(): Boolean {
        val component = ComponentName(this, CompanionNotificationListener::class.java).flattenToString()
        return Settings.Secure.getString(contentResolver, "enabled_notification_listeners").orEmpty().split(':').contains(component)
    }

    private fun usageAccessOn(): Boolean {
        val appOps = getSystemService(APP_OPS_SERVICE) as AppOpsManager
        @Suppress("DEPRECATION")
        return appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName) == AppOpsManager.MODE_ALLOWED
    }

    private fun mediaAccessOn(): Boolean {
        val permission = if (Build.VERSION.SDK_INT >= 33) Manifest.permission.READ_MEDIA_IMAGES else Manifest.permission.READ_EXTERNAL_STORAGE
        return ContextCompat.checkSelfPermission(this, permission) == android.content.pm.PackageManager.PERMISSION_GRANTED
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
        root.addView(setupItem("1  Accessibility", "مطلوبة للتحكم المرئي: فتح التطبيقات، الضغط، الكتابة والتنقل. لا يتم تفعيلها من التطبيق.", CompanionAccessibilityService.instance != null) {
            openSettings(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        })
        val power = getSystemService(POWER_SERVICE) as PowerManager
        root.addView(setupItem("2  البطارية والعمل في الخلفية", "تمنع Oppo من إيقاف الاتصال. اختر AbanoubAI يدويًا ثم اجعله بدون قيود.", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) power.isIgnoringBatteryOptimizations(packageName) else null) {
            openSettings(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        })
        root.addView(setupItem("3  التشغيل التلقائي وإعدادات التطبيق", "التشغيل التلقائي خاص بـ ColorOS وقد لا يمكن للتطبيق قراءته. فعّله يدويًا من App Launch.", null) {
            openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
        })
        root.addView(setupItem("4  الوصول إلى الإشعارات", "اختياري وحساس: يسمح بقراءة الإشعارات التي يختار Android تمريرها. لا يتم تفعيله تلقائيًا.", notificationAccessOn()) {
            openSettings("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
        })
        root.addView(setupItem("5  Usage Access", "اختياري: يعرض إحصاءات استخدام التطبيقات فقط، ولا يمنح قراءة كلمات المرور أو قواعد بيانات التطبيقات.", usageAccessOn()) {
            openSettings(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        })
        root.addView(setupItem("6  الملفات والصور", "لا يوجد وصول شامل تلقائي. يفتح Android منتقي الملفات ويختار المستخدم الملف يدويًا.", null) {
            startActivity(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                type = "*/*"
                addCategory(Intent.CATEGORY_OPENABLE)
            })
        })
        root.addView(setupItem("6 أ  فهرس الوسائط", "اختياري: يسمح بفهرسة أسماء الصور والفيديو والصوت والملفات التي يعرضها MediaStore فقط.", mediaAccessOn()) {
            val permissions = if (Build.VERSION.SDK_INT >= 33) arrayOf(Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO, Manifest.permission.READ_MEDIA_AUDIO) else arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
            requestPermissions(permissions, REQUEST_MEDIA)
        })
        root.addView(setupItem("7  الكاميرا", "تُطلب عند فتح الكاميرا فقط، ويمكن إيقافها من إعدادات التطبيق في أي وقت.", ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA)
        })
        root.addView(setupItem("8  الميكروفون", "مطلوب للاستماع الصوتي عند تشغيله فقط. لا يتم تسجيل الصوت من دون تشغيل وضع الاستماع.", ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST_MIC)
        })
        root.addView(button("استدعاء AbanoupAi صوتيًا — أمر واحد") { listenLocalAgent() })
        root.addView(setupItem("9  الموقع", "اختياري ولا علاقة له بالتحكم المرئي. فعّله فقط إذا أضفت ميزة تعتمد على الموقع.", ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), REQUEST_LOCATION)
        })
        root.addView(setupItem("10  إدارة الجهاز (Device Admin)", "ليست تجاوزًا لحماية Android. هذا مسار مؤسسي اختياري، ولا نفعّله لأن التطبيق لا يحتاج امتلاك الهاتف أو منع إزالته.", null) {
            openSettings("android.app.action.DEVICE_ADMIN_SETTINGS")
        })
        val note = TextView(this).apply {
            text = "مهم: العناصر أعلاه لا تُفعّل تلقائيًا؛ الحالة المعروضة تقرأ ما فعّلته أنت في Android. لا توجد صلاحية واحدة تمنح تحكمًا كاملًا. لا تمنح الإشعارات أو الموقع أو الكاميرا أو الميكروفون إلا عند الحاجة. التطبيق لا يقرأ كلمات المرور أو قواعد بيانات التطبيقات الخاصة."
            textSize = 14f
            setTextColor(0xffffd180.toInt())
            setPadding(0, 18, 0, 12)
        }
        root.addView(note)
        root.addView(button("فتح الصفحة عند توفر الإنترنت — الوضع المحلي عند عدم الاتصال") {
            if (isNetworkAvailable()) openDashboardExternal()
            else {
                Toast.makeText(this, "لا يوجد إنترنت؛ الوضع المحلي جاهز الآن.", Toast.LENGTH_LONG).show()
                showOfflineHub()
            }
        })
        root.addView(button("فتح إعدادات التطبيق مباشرة") {
            openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
        })
        val scroll = ScrollView(this).apply { addView(root) }
        setContentView(scroll)
    }

    private fun listenLocalAgent() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST_MIC)
            return
        }
        Toast.makeText(this, "أبانوباي يستمع لأمر واحد فقط…", Toast.LENGTH_SHORT).show()
        runCatching {
            VoiceController.listenLocal(
                this,
                { spoken ->
                    val result = runCatching { LocalAgentController.handle(this, spoken) }.getOrElse { it.message ?: "تعذر تنفيذ الأمر" }
                    runOnUiThread { Toast.makeText(this, result, Toast.LENGTH_LONG).show() }
                },
                { error -> runOnUiThread { Toast.makeText(this, error, Toast.LENGTH_LONG).show() } },
            )
        }.onFailure { Toast.makeText(this, it.message ?: "تعذر تشغيل الميكروفون", Toast.LENGTH_LONG).show() }
    }

    private fun showOfflineHub() {
        showingDashboard = false
        showingOfflineHub = true
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 24)
            setBackgroundColor(ContextCompat.getColor(this@MainActivity, android.R.color.background_dark))
        }
        root.addView(TextView(this).apply {
            text = "AbanoupAi — الوضع المحلي"
            textSize = 26f
            gravity = Gravity.CENTER
            setTextColor(ContextCompat.getColor(this@MainActivity, android.R.color.white))
        })
        root.addView(TextView(this).apply {
            text = "لا يوجد اتصال بالإنترنت. يمكنك تنفيذ أوامر الهاتف الأساسية هنا. النماذج السحابية ستعود تلقائيًا عند رجوع الاتصال."
            textSize = 16f
            setTextColor(0xffffd180.toInt())
            setPadding(0, 12, 0, 16)
        })
        root.addView(TextView(this).apply {
            text = "النموذج المحلي مفصول — التطبيق خفيف، والتخطيط يتم عبر النماذج السحابية عند الاتصال"
            textSize = 18f
            setTextColor(0xff9be7a1.toInt())
            setPadding(0, 12, 0, 8)
        })
        val selectedModel = getSharedPreferences("companion", MODE_PRIVATE).getString("local_model_id", ModelCatalog.recommended.id)
        ModelCatalog.all.forEach { model ->
            root.addView(button("المستوى ${model.level}: ${model.label} — ${model.sizeLabel} — RAM ${model.ramLabel}${if (model.id == selectedModel) " ✓" else ""}") {
                val id = LocalAgentController.selectModel(this, model.id)
                Toast.makeText(this, "تم اختيار ${ModelCatalog.byId(id).label}", Toast.LENGTH_SHORT).show()
                showOfflineHub()
            })
        }
        val input = EditText(this).apply {
            hint = "اكتب: أبانوباي افتح Chrome"
            setTextColor(ContextCompat.getColor(this@MainActivity, android.R.color.white))
            setHintTextColor(0xffbbbbbb.toInt())
            minLines = 2
            setPadding(16, 12, 16, 12)
        }
        val reply = TextView(this).apply {
            text = "جاهز. الأوامر المحلية: فتح تطبيق، فتح رابط، رجوع، الرئيسية، التطبيقات الأخيرة."
            textSize = 16f
            setTextColor(0xff9be7a1.toInt())
            setPadding(0, 16, 0, 16)
        }
        fun submit() {
            val command = input.text.toString().trim()
            if (command.isBlank()) return
            reply.text = runCatching { LocalAgentController.handle(this, command) }.getOrElse { it.message ?: "تعذر تنفيذ الأمر" }
            input.text.clear()
        }
        root.addView(input)
        root.addView(reply)
        root.addView(button("تنفيذ الأمر المحلي") { submit() })
        root.addView(button("استمع لأمر صوتي واحد") {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST_MIC)
            } else {
                reply.text = "أبانوباي يستمع…"
                runCatching {
                    VoiceController.listenLocal(this, { spoken ->
                        val result = runCatching { LocalAgentController.handle(this, spoken) }.getOrElse { it.message ?: "تعذر تنفيذ الأمر" }
                        runOnUiThread { reply.text = "قلت: $spoken\n\n$result" }
                    }, { error -> runOnUiThread { reply.text = error } })
                }.onFailure { reply.text = it.message ?: "تعذر تشغيل الميكروفون" }
            }
        })
        root.addView(button("فتح صفحة AbanoupAi عند توفر الإنترنت") {
            if (isNetworkAvailable()) openDashboardExternal()
            else Toast.makeText(this, "لا يوجد إنترنت؛ الأوامر الهاتفية الأساسية فقط تعمل محليًا.", Toast.LENGTH_LONG).show()
        })
        setContentView(ScrollView(this).apply { addView(root) })
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        val label = when (requestCode) {
            REQUEST_CAMERA -> "الكاميرا"
            REQUEST_MIC -> "الميكروفون"
            REQUEST_LOCATION -> "الموقع"
            REQUEST_MEDIA -> "الوسائط"
            else -> "الصلاحية"
        }
        Toast.makeText(this, if (grantResults.firstOrNull() == android.content.pm.PackageManager.PERMISSION_GRANTED) "تم السماح بـ $label" else "لم يتم السماح بـ $label", Toast.LENGTH_SHORT).show()
    }

    override fun onResume() {
        super.onResume()
        if (!showingDashboard && !showingOfflineHub && !::web.isInitialized) showSetupHub()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun showDashboard() {
        if (isLowMemoryDevice()) {
            openDashboardExternal()
            return
        }
        if (!isNetworkAvailable()) {
            showOfflineHub()
            return
        }
        showingDashboard = true
        showingOfflineHub = false
        CookieManager.getInstance().setAcceptCookie(true)
        web = WebView(this).apply {
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.userAgentString = settings.userAgentString.replace("; wv)", ")").replace(Regex("Version/\\S+ "), "")
            settings.javaScriptCanOpenWindowsAutomatically = true
            addJavascriptInterface(Bridge(), "AbanoubAI")
            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        val allowed = request.resources.filter { it == PermissionRequest.RESOURCE_AUDIO_CAPTURE }.toTypedArray()
                        if (allowed.isNotEmpty()) request.grant(allowed) else request.deny()
                    }
                }
            }
            webViewClient = object : WebViewClient() {
                @Suppress("DEPRECATION")
                override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                    super.onReceivedError(view, errorCode, description, failingUrl)
                    if (failingUrl?.contains(SITE_HOST) == true) runOnUiThread { showOfflineHub() }
                }
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

    private fun openDashboardExternal() {
        runCatching {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://$SITE_HOST/")))
            Toast.makeText(this, "تم فتح صفحة AbanoupAi في المتصفح لتقليل استهلاك ذاكرة التطبيق.", Toast.LENGTH_LONG).show()
        }.onFailure {
            Toast.makeText(this, "تعذر فتح المتصفح؛ استخدم الوضع المحلي داخل التطبيق.", Toast.LENGTH_LONG).show()
        }
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
        private const val REQUEST_MEDIA = 1004
    }

    private fun isNetworkAvailable(): Boolean {
        val manager = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = manager.activeNetwork ?: return false
        val caps = manager.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    private fun isLowMemoryDevice(): Boolean {
        val manager = getSystemService(ACTIVITY_SERVICE) as? ActivityManager ?: return false
        val info = ActivityManager.MemoryInfo()
        manager.getMemoryInfo(info)
        return manager.isLowRamDevice || info.totalMem <= 2_500L * 1024L * 1024L
    }
}
