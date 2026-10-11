# Local model asset

تم تنزيل النموذج محليًا في بيئة البناء:

- Model: `Qwen/Qwen2.5-0.5B-Instruct-GGUF`
- File: `qwen2.5-0.5b-instruct-q4_k_m.gguf`
- Size: حوالي 469 MB
- SHA-256: `74a4da8c9fdbcd15bd1f6d01d621410d31c6fc00986f5eb687824e7b93d7a9db`
- License: Apache-2.0 حسب مستودع النموذج
- Source: https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF

لا يتم إدخال ملف GGUF الكبير في Git. يجب أن يستخدمه runtime Android بعد دمج llama.cpp أو runtime GGUF مكافئ. وجود الملف وحده لا يشغّل نموذجًا داخل APK.

إعادة التنزيل:

```bash
wget -O qwen2.5-0.5b-instruct-q4_k_m.gguf \
  https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf
sha256sum qwen2.5-0.5b-instruct-q4_k_m.gguf
```
