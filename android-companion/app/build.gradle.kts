plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.abanoubai.companion"
    compileSdk = 35
    ndkVersion = "27.2.12479018"
    defaultConfig {
        applicationId = "com.abanoubai.companion"
        minSdk = 26
        targetSdk = 35
        versionCode = 23
        versionName = "0.9.0"
        buildConfigField("String", "SUPABASE_URL", "\"${project.findProperty("SUPABASE_URL")?.toString()?.takeIf { it.isNotBlank() } ?: "https://wobfdslqlmvlatyrtgkd.supabase.co"}\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"${project.findProperty("SUPABASE_PUBLISHABLE_KEY")?.toString()?.takeIf { it.isNotBlank() } ?: ""}\"")
        ndk { abiFilters += listOf("arm64-v8a") }
    }
    signingConfigs {
        create("release") {
            // Reuse the local debug keystore so this release can update the APK already built
            // in this project without requiring a user-supplied signing secret.
            storeFile = file(System.getProperty("user.home") + "/.android/debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }
    buildTypes {
        debug {
            // Keep the diagnostic build installable beside the existing app so
            // testing a crash fix does not erase the user's stored pairing data.
            applicationIdSuffix = ".test"
            versionNameSuffix = "-test"
            resValue("string", "app_label", "AbanoubAI Companion (اختبار)")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
            resValue("string", "app_label", "AbanoubAI Companion")
        }
    }
    buildFeatures { buildConfig = true }
}

kotlin { jvmToolchain(17) }

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}
