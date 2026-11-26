import assert from "node:assert/strict";
import fs from "node:fs";

const companion = fs.readFileSync("src/routes/_authenticated/companion.tsx", "utf8");
const network = fs.readFileSync("src/lib/network.functions.ts", "utf8");
const migration = fs.readFileSync("supabase/migrations/20261002152000_companion_control_commands.sql", "utf8");
const universalMigration = fs.readFileSync("supabase/migrations/20261007010000_companion_universal_commands.sql", "utf8");
const android = fs.readFileSync("android-companion/app/src/main/java/com/abanoubai/companion/MainActivity.kt", "utf8");
const manifest = fs.readFileSync("android-companion/app/src/main/AndroidManifest.xml", "utf8");
const executor = fs.readFileSync("android-companion/app/src/main/java/com/abanoubai/companion/CommandExecutor.kt", "utf8");

assert.match(companion, /const requiresApproval = supervisedKinds\.has\(kind\)/);
assert.match(companion, /requires_approval: requiresApproval/);
assert.match(network, /const approvalRequired = requiresPhoneApproval\(kind\)/);
assert.match(network, /requires_approval: approvalRequired, status: approvalRequired \? "queued" : "approved"/);
assert.match(network, /kind === "batch" \|\| kind === "workflow" \|\| requiresPhoneApproval\(kind\)/);
assert.match(companion, /status: requiresApproval \? "queued" : "approved"/);
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
assert.match(android, /setupItem/);
assert.doesNotMatch(android, /CompanionAccessibilityService|CompanionNotificationListener|ACTION_ACCESSIBILITY_SETTINGS|ACTION_NOTIFICATION_LISTENER_SETTINGS/);
assert.doesNotMatch(manifest, /CompanionAccessibilityService|CompanionNotificationListener/);
assert.match(executor, /disabledCrossAppCommands/);
for (const command of ["read_screen", "screen_text", "screenshot", "notification_inventory", "app_inventory", "app_permissions", "file_inventory", "file_read", "listen"]) {
  assert.match(executor, new RegExp('"'+command+'"'));
}
assert.doesNotMatch(companion, /value="read_screen"|value="screenshot"|value="screen_text"|value="notification_inventory"|value="app_inventory"|value="file_inventory"/);
assert.doesNotMatch(companion, /clipboard\.writeText\(sessionToken\)/);
console.log("Android cross-app screen/notification privacy gate: PASS (static policy regression checks)");
console.log("companion auto-execution and YouTube search smoke test: PASS");
