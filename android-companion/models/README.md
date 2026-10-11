# نماذج AbanoupAi المحلية

تم تنزيل ملفات GGUF الرسمية/الموثوقة التالية محليًا. ملفات `.gguf` مستبعدة من Git لأنها كبيرة؛ يتم تضمين النموذج المختار داخل APK أثناء البناء.

| المستوى | الملف المحلي | المصدر | الاستخدام | RAM المقترحة |
|---:|---|---|---|---|
| 1 | `smollm2-135m-q4_k_m.gguf` | [Unsloth](https://huggingface.co/unsloth/SmolLM2-135M-Instruct-GGUF) | Lite | 512 MB+ |
| 2 | `smollm2-360m-q4_k_m.gguf` | [Bartowski](https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF) | الافتراضي والمتوازن لـ OPPO A15 | 1 GB+ |
| 3 | `qwen2.5-0.5b-q2_k.gguf` | [Qwen](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF) | دقة أعلى | 1.5 GB+ |
| 4 | `qwen2.5-0.5b-q3_k_m.gguf` | [Qwen](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF) | دقة أعلى | 1.5 GB+ |
| 5 | `smollm2-1.7b-q2_k.gguf` | [Bartowski](https://huggingface.co/bartowski/SmolLM2-1.7B-Instruct-GGUF) | Pro، ليس مناسبًا عادةً لـ2GB | 3 GB+ |

الأحجام الفعلية:

- 135M: حوالي 100 MB
- 360M: حوالي 258 MB
- Qwen Q2: حوالي 396 MB
- Qwen Q3: حوالي 412 MB
- 1.7B Q2: حوالي 643 MB

## ميزات المستوى 6–10

- `training_data.json`: 100 مثال عربي إلى خطة JSON.
- `LocalLearning`: ذاكرة محلية محدودة للخطط الناجحة وجهات الاتصال المهمة.
- RAG: يمرر أمثلة الطلبات الناجحة المشابهة إلى المخطط.
- Self-correction: يعيد التخطيط عند فشل التحقق أو فشل تنفيذ الخطة.
- Multi-step verification: يفحص النموذج الخطة محليًا قبل إرسالها إلى المنفذ.

## البناء

```bash
./gradlew assembleDebug -PLOCAL_MODEL=lite
./gradlew assembleDebug -PLOCAL_MODEL=balanced
./gradlew assembleDebug -PLOCAL_MODEL=pro
```

اختر النموذج من وضع Settings المحلي؛ الافتراضي هو SmolLM2 360M.
