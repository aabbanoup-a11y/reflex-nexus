import assert from "node:assert/strict";
import fs from "node:fs";

const companion = fs.readFileSync("src/routes/_authenticated/companion.tsx", "utf8");
const migration = fs.readFileSync("supabase/migrations/20261002152000_companion_control_commands.sql", "utf8");
const android = fs.readFileSync("android-companion/app/src/main/java/com/abanoubai/companion/MainActivity.kt", "utf8");

assert.match(companion, /const SENSITIVE = new Set/);
assert.match(companion, /send\("stop"\)/);
assert.match(companion, /runScan/);
assert.match(companion, /companion_settings/);
assert.match(migration, /'stop'/);
assert.match(migration, /'screenshot'/);
assert.match(android, /setupItem/);
assert.match(android, /ACTION_ACCESSIBILITY_SETTINGS/);
console.log("companion policy smoke test: PASS");
