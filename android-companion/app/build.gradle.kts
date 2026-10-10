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
        versionCode = 19
        versionName = "0.8.3"
        buildConfigField("String", "SUPABASE_URL", "\"${project.findProperty("SUPABASE_URL") ?: "https://wobfdslqlmvlatyrtgkd.supabase.co"}\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"${project.findProperty("SUPABASE_PUBLISHABLE_KEY") ?: "sb_publishable_mvMX_Ih1Dri5MOmYTq02Gw_2a_iFiwZ"}\"")
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
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }
    buildFeatures { buildConfig = true }
    externalNativeBuild {
        cmake { path = file("src/main/cpp/CMakeLists.txt") }
    }
}

val copyQwenModel by tasks.registering(Copy::class) {
    from("../models/qwen2.5-0.5b-instruct-q4_k_m.gguf")
    into("src/main/assets/models")
    rename { "qwen.gguf" }
}

tasks.named("preBuild") { dependsOn(copyQwenModel) }

kotlin { jvmToolchain(17) }

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}
