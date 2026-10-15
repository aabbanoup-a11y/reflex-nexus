import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });
const exists = (relative) => existsSync(join(root, relative));

for (const file of [
  "package.json",
  "src",
  "supabase/migrations",
  "cloudflare-worker/index.ts",
  "cloudflare-worker/wrangler.toml",
  "android-companion/app/build.gradle.kts",
  "android-companion/app/src/main/AndroidManifest.xml",
  "android-companion/app/src/main/java/com/abanoubai/companion/LocalAgentController.kt",
  "android-companion/app/src/main/java/com/abanoubai/companion/OfflinePlan.kt",
  "android-companion/app/src/main/java/com/abanoubai/companion/QwenEngine.kt",
])
  check(`وجود ${file}`, exists(file), exists(file) ? "موجود" : "مفقود");

const gradle = readFileSync(join(root, "android-companion/app/build.gradle.kts"), "utf8");
const modelFile = gradle.includes("qwen2.5-0.5b-instruct-q4_k_m.gguf")
  ? "qwen2.5-0.5b-instruct-q4_k_m.gguf"
  : "cloud-only";
check("وضع نموذج Android", modelFile === "cloud-only", "لا يوجد GGUF داخل APK؛ التخطيط عبر السحابة");
check("إزالة أصل GGUF من البناء", !gradle.includes("LOCAL_MODEL") && !exists("android-companion/app/src/main/assets/models/qwen.gguf"), "لا توجد مهمة نسخ أو asset للنموذج المحلي");
check(
  "اسم إصدار Android موجود",
  /versionName\s*=\s*"[^"]+"/.test(gradle),
  "تم العثور على versionName",
);
check("ABI arm64-v8a مفعّل", /arm64-v8a/.test(gradle), "تم العثور على arm64-v8a");

const manifest = readFileSync(
  join(root, "android-companion/app/src/main/AndroidManifest.xml"),
  "utf8",
);
for (const permission of [
  "BIND_ACCESSIBILITY_SERVICE",
  "FOREGROUND_SERVICE",
  "POST_NOTIFICATIONS",
]) {
  check(
    `صلاحية Android: ${permission}`,
    manifest.includes(permission),
    manifest.includes(permission) ? "موجودة" : "مفقودة",
  );
}

const catalogSource = readFileSync(
  join(root, "supabase/migrations/20261010230000_capability_catalog.sql"),
  "utf8",
);
const catalogBlocks = [
  "insert into public.command_catalog",
  "insert into public.skill_catalog",
  "insert into public.path_catalog",
];
check(
  "كتالوج المصدر يحتوي جداول الأوامر والمهارات والمسارات",
  catalogBlocks.every((block) => catalogSource.includes(block)),
  "تم العثور على كتل الإدراج الثلاث",
);

const failures = checks.filter((item) => !item.ok);
const result = {
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 ? "healthy-source" : "attention-required",
  checks,
  failures,
};
const output = process.env.DIAGNOSTIC_OUTPUT || join(root, "self-diagnostic.json");
writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
