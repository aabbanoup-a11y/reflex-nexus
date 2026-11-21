import {
  aiRoutingAllowed,
  externalWritesAllowed,
  isExternalWriteAction,
  loadFeatureFlags,
  parseFeatureFlags,
  scopeReadFilters,
  serviceRoleHeaders,
  resolveServiceRoleKey,
  resolvePublishableKey,
} from "./feature-policy.ts";

function assert(condition: unknown, message = "Assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message = "Values differ") {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertThrows(action: () => unknown, expectedMessage: string) {
  try {
    action();
  } catch (error) {
    assert(error instanceof Error);
    assertEqual(error.message, expectedMessage);
    return;
  }
  throw new Error(`Expected ${expectedMessage}`);
}

async function assertRejects(
  action: () => Promise<unknown>,
  expectedMessage: string,
) {
  try {
    await action();
  } catch (error) {
    assert(error instanceof Error);
    assertEqual(error.message, expectedMessage);
    return;
  }
  throw new Error(`Expected rejected promise: ${expectedMessage}`);
}

const enabledRows = [
  { key: "emergency_kill_switch", value: "false" },
  { key: "enable_ai_routing", value: "true" },
  { key: "enable_external_actions", value: "true" },
];

Deno.test("missing or malformed flags fail closed", () => {
  const missing = parseFeatureFlags([]);
  assertEqual(missing.emergencyKillSwitch, true);
  assertEqual(missing.aiRoutingEnabled, false);
  assertEqual(missing.externalActionsEnabled, false);

  const malformed = parseFeatureFlags([
    { key: "emergency_kill_switch", value: "unknown" },
    { key: "enable_ai_routing", value: "true" },
    { key: "enable_external_actions", value: "true" },
  ]);
  assertEqual(malformed.emergencyKillSwitch, true);
  assertEqual(aiRoutingAllowed(malformed), false);
  assertEqual(externalWritesAllowed(malformed), false);
});

Deno.test("duplicate feature settings fail closed independently", () => {
  const duplicateKillSwitch = parseFeatureFlags([
    { key: "emergency_kill_switch", value: "false" },
    { key: "emergency_kill_switch", value: "false" },
    { key: "enable_ai_routing", value: "true" },
    { key: "enable_external_actions", value: "true" },
  ]);
  assertEqual(duplicateKillSwitch.emergencyKillSwitch, true);
  assertEqual(aiRoutingAllowed(duplicateKillSwitch), false);
  assertEqual(externalWritesAllowed(duplicateKillSwitch), false);

  const duplicateAiFlag = parseFeatureFlags([
    { key: "emergency_kill_switch", value: "false" },
    { key: "enable_ai_routing", value: "true" },
    { key: "enable_ai_routing", value: "true" },
    { key: "enable_external_actions", value: "true" },
  ]);
  assertEqual(duplicateAiFlag.aiRoutingEnabled, false);
  assertEqual(aiRoutingAllowed(duplicateAiFlag), false);
  assertEqual(externalWritesAllowed(duplicateAiFlag), true);

  const duplicateExternalFlag = parseFeatureFlags([
    ...enabledRows,
    { key: "enable_external_actions", value: "true" },
  ]);
  assertEqual(duplicateExternalFlag.externalActionsEnabled, false);
  assertEqual(externalWritesAllowed(duplicateExternalFlag), false);
});

Deno.test("both kill switch and capability flag must permit execution", () => {
  const enabled = parseFeatureFlags(enabledRows);
  assertEqual(aiRoutingAllowed(enabled), true);
  assertEqual(externalWritesAllowed(enabled), true);

  const killSwitchOn = parseFeatureFlags([
    { key: "emergency_kill_switch", value: "true" },
    { key: "enable_ai_routing", value: "true" },
    { key: "enable_external_actions", value: "true" },
  ]);
  assertEqual(aiRoutingAllowed(killSwitchOn), false);
  assertEqual(externalWritesAllowed(killSwitchOn), false);

  const capabilityOff = parseFeatureFlags([
    { key: "emergency_kill_switch", value: "false" },
    { key: "enable_ai_routing", value: "false" },
    { key: "enable_external_actions", value: "false" },
  ]);
  assertEqual(aiRoutingAllowed(capabilityOff), false);
  assertEqual(externalWritesAllowed(capabilityOff), false);
});

Deno.test("write classifier permits only explicit read actions", () => {
  assertEqual(isExternalWriteAction("status"), false);
  assertEqual(isExternalWriteAction("github.read"), false);
  assertEqual(isExternalWriteAction("cloudflare.request", { method: "GET" }), false);
  assertEqual(isExternalWriteAction("cloudflare.request", { method: "get" }), false);
  assertEqual(isExternalWriteAction("supabase.read"), false);

  assertEqual(isExternalWriteAction("github.write"), true);
  assertEqual(isExternalWriteAction("github.delete"), true);
  assertEqual(isExternalWriteAction("github.unknown"), true);
  assertEqual(isExternalWriteAction("cloudflare.request", { method: "POST" }), true);
  assertEqual(isExternalWriteAction("cloudflare.request", { method: "DELETE" }), true);
  assertEqual(isExternalWriteAction("supabase.insert"), true);
  assertEqual(isExternalWriteAction("supabase.update"), true);
  assertEqual(isExternalWriteAction("supabase.delete"), true);
  assertEqual(isExternalWriteAction("supabase.unknown"), true);
});

Deno.test("all service-role read tables are scoped to the authenticated owner", () => {
  const cases: Array<[string, string]> = [
    ["agent_workspace_actions", "user_id"],
    ["artifacts", "user_id"],
    ["daily_reports", "user_id"],
    ["goals", "owner_id"],
    ["knowledge_docs", "created_by"],
    ["notifications", "user_id"],
    ["tasks", "owner_id"],
    ["conversations", "user_id"],
    ["conversation_messages", "user_id"],
    ["memory_entries", "created_by"],
    ["memory_branches", "user_id"],
  ];

  for (const [table, ownerColumn] of cases) {
    const filters = scopeReadFilters(table, { status: "open" }, "user-123");
    assertEqual(filters[ownerColumn], "user-123", `${table} owner filter`);
  }
});

Deno.test("read scope rejects cross-user filters and unknown tables", () => {
  assertThrows(
    () => scopeReadFilters("conversations", { user_id: "other-user" }, "user-123"),
    "OWNER_FILTER_REQUIRED",
  );
  assertThrows(
    () => scopeReadFilters("unlisted_table", {}, "user-123"),
    "TABLE_OWNER_SCOPE_NOT_CONFIGURED",
  );
  assertThrows(
    () => scopeReadFilters("conversations", {}, ""),
    "UNAUTHORIZED",
  );
});

Deno.test("feature flags are loaded only over HTTPS and never returned to callers", async () => {
  const captured: Array<{ url: URL; headers: Headers }> = [];
  const flags = await loadFeatureFlags({
    supabaseUrl: "https://example.supabase.co",
    serviceRoleKey: "server-only-test-secret",
    fetchImpl: async (input, init) => {
      captured.push({ url: new URL(String(input)), headers: new Headers(init?.headers) });
      return new Response(JSON.stringify(enabledRows), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  assertEqual(captured[0]?.url.pathname, "/rest/v1/app_settings");
  assertEqual(
    captured[0]?.url.searchParams.get("key"),
    "in.(emergency_kill_switch,enable_ai_routing,enable_external_actions)",
  );
  assertEqual(captured[0]?.headers.get("Authorization"), "Bearer server-only-test-secret");
  assertEqual(captured[0]?.headers.get("Cache-Control"), "no-store");
  assertEqual(aiRoutingAllowed(flags), true);
  assertEqual(JSON.stringify(flags).includes("server-only-test-secret"), false);
});

Deno.test("service key resolution prefers the new runtime secret dictionary", () => {
  const current = resolveServiceRoleKey((name) =>
    name === "SUPABASE_SECRET_KEYS"
      ? JSON.stringify({ default: "sb_secret_new" })
      : name === "SUPABASE_SERVICE_ROLE_KEY"
      ? "legacy-service-role-jwt"
      : undefined
  );
  assertEqual(current, "sb_secret_new");

  const legacy = resolveServiceRoleKey((name) =>
    name === "SUPABASE_SERVICE_ROLE_KEY" ? "legacy-service-role-jwt" : undefined
  );
  assertEqual(legacy, "legacy-service-role-jwt");

  const malformed = resolveServiceRoleKey((name) =>
    name === "SUPABASE_SECRET_KEYS" ? "not-json" : undefined
  );
  assertEqual(malformed, "");
});

Deno.test("publishable key resolution prefers the current runtime dictionary", () => {
  const current = resolvePublishableKey((name) =>
    name === "SUPABASE_PUBLISHABLE_KEYS"
      ? JSON.stringify({ default: "sb_publishable_new" })
      : name === "SUPABASE_PUBLISHABLE_KEY"
      ? "legacy-publishable-key"
      : name === "SUPABASE_ANON_KEY"
      ? "legacy-anon-key"
      : undefined
  );
  assertEqual(current, "sb_publishable_new");

  const fallback = resolvePublishableKey((name) =>
    name === "SUPABASE_ANON_KEY" ? "legacy-anon-key" : undefined
  );
  assertEqual(fallback, "legacy-anon-key");
});

Deno.test("service-role headers support both legacy JWT and opaque secret keys", () => {
  const legacy = serviceRoleHeaders("legacy-service-role-jwt");
  assertEqual(legacy.apikey, "legacy-service-role-jwt");
  assertEqual(legacy.Authorization, "Bearer legacy-service-role-jwt");

  const opaque = serviceRoleHeaders("sb_secret_server_only");
  assertEqual(opaque.apikey, "sb_secret_server_only");
  assertEqual(opaque.Authorization, undefined);
});

Deno.test("feature policy fails closed for insecure URLs and upstream errors", async () => {
  await assertRejects(
    () => loadFeatureFlags({
      supabaseUrl: "http://example.supabase.co",
      serviceRoleKey: "server-only-test-secret",
    }),
    "FEATURE_POLICY_UNAVAILABLE",
  );

  await assertRejects(
    () => loadFeatureFlags({
      supabaseUrl: "https://example.supabase.co",
      serviceRoleKey: "server-only-test-secret",
      fetchImpl: async () => new Response("unavailable", { status: 503 }),
    }),
    "FEATURE_POLICY_UNAVAILABLE",
  );
});
