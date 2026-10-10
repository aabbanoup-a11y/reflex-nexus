import assert from "node:assert/strict";
import fs from "node:fs";

const controller = fs.readFileSync("android-companion/app/src/main/java/com/abanoubai/companion/LocalAgentController.kt", "utf8");
const planner = fs.readFileSync("android-companion/app/src/main/java/com/abanoubai/companion/OfflinePlan.kt", "utf8");
const executor = fs.readFileSync("android-companion/app/src/main/java/com/abanoubai/companion/CommandExecutor.kt", "utf8");
const qwen = fs.readFileSync("android-companion/app/src/main/java/com/abanoubai/companion/QwenEngine.kt", "utf8");
const context = fs.readFileSync("android-companion/app/src/main/java/com/abanoubai/companion/PhoneContext.kt", "utf8");

assert.match(qwen, /fun plan\(request: String, phoneContext: String/);
assert.match(controller, /OfflinePlan\.fromModel\(engine\.plan\(command, PhoneContext\.snapshot\(context\)\)\)/);
assert.match(context, /DeviceInventory\.device/);
assert.match(context, /readScreen/);
assert.match(planner, /"open_note"/);
assert.match(planner, /"press_enter"/);
assert.match(planner, /fun validate\(steps: JsonArray\)/);
assert.match(controller, /put\("return_to_chat", "true"\)/);
assert.match(executor, /"open_note"/);
assert.match(executor, /returnToChat/);
assert.match(executor, /FLAG_ACTIVITY_CLEAR_TOP/);
console.log("offline dynamic planner, validation, note flow, and chat return: PASS");
