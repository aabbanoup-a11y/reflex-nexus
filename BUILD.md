# بناء AbanoupAi Companion محليًا

## المتطلبات

- Android Studio حديث.
- JDK 17.
- Android SDK Platform 35 وBuild Tools.
- تفعيل Accessibility وBattery Optimization بعد التثبيت على الهاتف.

## Android Studio

1. افتح مجلد `android-companion` في Android Studio.
2. انسخ `local.properties.example` إلى `local.properties`.
3. عدّل `sdk.dir` إلى مسار Android SDK على جهازك.
4. من Gradle اختر `app > Tasks > build > assembleDebug`.
5. ثبّت `app/build/outputs/apk/debug/app-debug.apk` على الهاتف.
6. افتح التطبيق، فعّل Accessibility، ثم اختر AbanoupAi ضمن استثناء تحسين البطارية.

## سطر الأوامر

```bash
cd android-companion
cp local.properties.example local.properties
# عدّل sdk.dir حسب جهازك
./gradlew compileDebugKotlin
./gradlew assembleDebug
```

لا تضع مفاتيح Supabase الحقيقية داخل Git. مرّرها إلى Gradle عند البناء:

```bash
./gradlew assembleDebug \
  -PSUPABASE_URL=https://your-project.supabase.co \
  -PSUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```
