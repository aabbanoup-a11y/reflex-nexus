import assert from "node:assert/strict";
import fs from "node:fs";

const companion = fs.readFileSync("src/routes/_authenticated/companion.tsx", "utf8");
const network = fs.readFileSync("src/lib/network.functions.ts", "utf8");
const migration = fs.readFileSync("supabase/migrations/20261002152000_companion_control_commands.sql", "utf8");
const universalMigration = fs.readFileSync("supabase/migrations/20261007010000_companion_universal_commands.sql", "utf8");
const android = fs.readFileSync("android-companion/app/src/main/java/com/abanoubai/companion/MainActivity.kt", "utf8");

assert.match(companion, /requires_approval: false/);
assert.match(companion, /status: "approved"/);
assert.match(network, /type_text_submit/);
assert.match(network, /searchIntent/);
assert.match(companion, /send\("stop"\)/);
assert.match(companion, /runScan/);
assert.match(companion, /companion_settings/);
assert.match(migration, /'stop'/);
assert.match(migration, /'screenshot'/);
assert.match(universalMigration, /'batch'/);
assert.match(universalMigration, /'file_inventory'/);
assert.match(android, /setupItem/);
assert.match(android, /ACTION_ACCESSIBILITY_SETTINGS/);
console.log("companion auto-execution and YouTube search smoke test: PASS");
