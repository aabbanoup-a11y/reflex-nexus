import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const helperSource = fs.readFileSync("src/lib/chat-attachment-policy.ts", "utf8");
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { isOwnedChatAttachmentPath } = await import(
  \`data:text/javascript;base64,\${Buffer.from(compiled).toString("base64")}\`
);

// Positive cases: only keys below the authenticated user's prefix.
assert.equal(isOwnedChatAttachmentPath("u/user-123/image.png", "user-123"), true);
assert.equal(isOwnedChatAttachmentPath("u/user-123/2026/10/file.pdf", "user-123"), true);

// Negative cases: cross-user, prefix spoofing, empty/dot segments and ambiguous paths.
for (const path of [
  "u/other-user/secret.png",
  "u/user-123-evil/secret.png",
  "u/user-123/",
  "u/user-123//secret.png",
  "u/user-123/../other-user/secret.png",
  "u/user-123/folder/./secret.png",
  String.raw\`u/user-123/folder\\secret.png\`,
  "u/user-123/secret\\u0000.png",
  "u/user-123/" + "x".repeat(2050),
]) {
  assert.equal(isOwnedChatAttachmentPath(path, "user-123"), false, \`should reject \${JSON.stringify(path)}\`);
}
assert.equal(isOwnedChatAttachmentPath("u/user-123/file.png", ""), false);
assert.equal(isOwnedChatAttachmentPath(null, "user-123"), false);

// Structural integration checks: the browser attaches a session token globally,
// the server validates it, and chat checks ownership before any privileged storage call.
const start = fs.readFileSync("src/start.ts", "utf8");
const clientAuth = fs.readFileSync("src/integrations/supabase/runtime-attacher.ts", "utf8");
const serverAuth = fs.readFileSync("src/integrations/supabase/runtime-auth.ts", "utf8");
const chat = fs.readFileSync("src/lib/chat.functions.ts", "utf8");

assert.match(start, /functionMiddleware:\s*\[attachCloudAuth\]/);
assert.match(clientAuth, /supabase\.auth\.getSession\(\)/);
assert.match(clientAuth, /Authorization:\s*\`Bearer \${token}\`/);
assert.match(serverAuth, /request\?\.headers\.get\("authorization"\)/);
assert.match(serverAuth, /await userClient\.auth\.getUser\(token\)/);
assert.ok(serverAuth.indexOf("await userClient.auth.getUser(token)") < serverAuth.indexOf("return next("));
assert.match(chat, /\.middleware\(\[requireCloudAuth\]\)/);
assert.match(chat, /isOwnedChatAttachmentPath\(a\.path, context\.userId\)/);
const ownershipCheck = chat.indexOf("isOwnedChatAttachmentPath(a.path, context.userId)");
const firstStorageAccess = chat.indexOf('supabaseAdmin.storage.from("chat-uploads")');
assert.ok(ownershipCheck >= 0 && firstStorageAccess > ownershipCheck);
console.log("chat auth wiring + attachment ownership policy: PASS (structural integration checks; not an end-to-end HTTP test)");
