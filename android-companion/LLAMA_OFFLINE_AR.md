# تشغيل Qwen محليًا بدون إنترنت

تم دمج `llama.cpp` من المصدر الرسمي داخل Android Companion باستخدام CMake وNDK، مع طبقة JNI باسم `libqwen-native.so`.

## مكونات النسخة

- llama.cpp commit: `79e2e74`
- نموذج: `Qwen/Qwen2.5-0.5B-Instruct-GGUF`
- quantization: `Q4_K_M`
- النموذج داخل APK في `assets/models/qwen.gguf`
- المعمارية: `arm64-v8a`
- Android minimum: 8.0 / API 26
- النموذج يُنسخ أول مرة إلى `filesDir` ثم يقرأه JNI محليًا.

## مسار التشغيل

`LocalAgentController` ينفذ الأوامر الحتمية أولًا. إذا لم يطابق الطلب أمرًا معروفًا، ينشئ `QwenEngine` عند الحاجة، ينسخ النموذج من assets، ثم يستدعي llama.cpp محليًا. لا يستخدم هذا المسار HTTP أو Supabase أو Cloudflare.

إذا تعذر تحميل native library أو النموذج، يرجع الوكيل إلى حفظ الطلب محليًا بدل تعطيل التطبيق. عند توفر الشبكة تستمر مسارات Cloudflare وLovable الحالية كمسارات سحابية منفصلة.

## ملاحظة حجم APK

لأن النموذج مدمج داخل الحزمة، حجم APK يقارب 467 MB. هذا متوقع لنموذج GGUF كامل. يلزم هاتف ARM64 ومساحة فارغة كافية أثناء التثبيت والنسخ الأول للنموذج.

## التحقق

تم التحقق من وجود:

- `lib/arm64-v8a/libqwen-native.so`
- `assets/models/qwen.gguf`
- توقيع APK v2
- `native-code: arm64-v8a`

لا يمكن إجراء اختبار توليد فعلي على هاتف من داخل بيئة البناء الحالية لعدم وجود جهاز Android متصل؛ لكن بناء JNI وCMake واحتواء APK للمحرك والنموذج نجح.
