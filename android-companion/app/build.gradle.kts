plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "com.abanoubai.companion"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.abanoubai.companion"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        buildConfigField("String", "SUPABASE_URL", "\"${project.findProperty("SUPABASE_URL") ?: "https://YOUR_PROJECT.supabase.co"}\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"${project.findProperty("SUPABASE_PUBLISHABLE_KEY") ?: "YOUR_PUBLISHABLE_KEY"}\"")
    }
    buildTypes { release { isMinifyEnabled = false } }
    buildFeatures { buildConfig = true }
}

kotlin { jvmToolchain(17) }

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("io.github.jan-tennert.supabase:postgrest-kt:3.1.4")
    implementation("io.github.jan-tennert.supabase:realtime-kt:3.1.4")
    implementation("io.ktor:ktor-client-okhttp:3.0.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}
