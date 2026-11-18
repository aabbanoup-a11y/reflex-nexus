plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("org.jetbrains.kotlin.plugin.compose")
}

val supabaseUrl = providers.gradleProperty("SUPABASE_URL")
    .getOrElse("https://wobfdslqlmvlatyrtgkd.supabase.co")
val supabasePublishableKey = providers.gradleProperty("SUPABASE_PUBLISHABLE_KEY")
    .getOrElse("sb_publishable_mvMX_Ih1Dri5MOmYTq02Gw_2a_iFiwZ")

// A debug keystore is intentionally never used for a release build.
// Supply these values through a secure local/CI environment when a real
// upload key has been created. Values are never written to the repository.
val releaseSigningInputs = mapOf(
    "ABANOUBAI_RELEASE_STORE_FILE" to providers.environmentVariable("ABANOUBAI_RELEASE_STORE_FILE").orNull,
    "ABANOUBAI_RELEASE_STORE_PASSWORD" to providers.environmentVariable("ABANOUBAI_RELEASE_STORE_PASSWORD").orNull,
    "ABANOUBAI_RELEASE_KEY_ALIAS" to providers.environmentVariable("ABANOUBAI_RELEASE_KEY_ALIAS").orNull,
    "ABANOUBAI_RELEASE_KEY_PASSWORD" to providers.environmentVariable("ABANOUBAI_RELEASE_KEY_PASSWORD").orNull
)
val hasReleaseSigning = releaseSigningInputs.values.all { !it.isNullOrBlank() }

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
        buildConfigField("String", "SUPABASE_URL", "\"$supabaseUrl\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"$supabasePublishableKey\"")
        ndk { abiFilters += listOf("arm64-v8a") }
    }
    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(requireNotNull(releaseSigningInputs["ABANOUBAI_RELEASE_STORE_FILE"]))
                storePassword = requireNotNull(releaseSigningInputs["ABANOUBAI_RELEASE_STORE_PASSWORD"])
                keyAlias = requireNotNull(releaseSigningInputs["ABANOUBAI_RELEASE_KEY_ALIAS"])
                keyPassword = requireNotNull(releaseSigningInputs["ABANOUBAI_RELEASE_KEY_PASSWORD"])
            }
        }
    }
    buildTypes {
        debug {
            applicationIdSuffix = ".test"
            versionNameSuffix = "-test"
            resValue("string", "app_label", "AbanoubAI Companion (اختبار)")
        }
        release {
            isMinifyEnabled = false
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
            resValue("string", "app_label", "AbanoubAI Companion")
        }
    }
    buildFeatures {
        buildConfig = true
        compose = true
    }
}

val verifyReleaseSigning = tasks.register("verifyReleaseSigning") {
    group = "verification"
    description = "Ensures a release build uses a separately provisioned private upload key."
    doLast {
        val missing = releaseSigningInputs.filterValues { it.isNullOrBlank() }.keys
        check(missing.isEmpty()) {
            "Release signing is blocked. Configure the required values in a secure local/CI environment: ${missing.joinToString()}. Do not commit keystores or passwords."
        }
        val storeFilePath = requireNotNull(releaseSigningInputs["ABANOUBAI_RELEASE_STORE_FILE"])
        check(file(storeFilePath).isFile) {
            "Release signing is blocked because the configured keystore file is not available in this build environment."
        }
    }
}

tasks.configureEach {
    if (name == "assembleRelease" || name == "bundleRelease") {
        dependsOn(verifyReleaseSigning)
    }
}

kotlin { jvmToolchain(17) }

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    val composeBom = platform("androidx.compose:compose-bom:2025.12.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    debugImplementation("androidx.compose.ui:ui-tooling")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
