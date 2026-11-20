import {
  resolvePublishableKey,
  resolveServiceRoleKey,
  scopeReadFilters,
  serviceRoleHeaders,
} from "./agent-permissions.ts";

Deno.test("service-role read queries are forced to the signed-in owner", () => {
  const filters = scopeReadFilters("conversations", { status: "active" }, "owner-123");
  if (filters.user_id !== "owner-123" || filters.status !== "active") throw new Error("Owner scope missing");
});

Deno.test("cross-owner filters and unknown tables are rejected", () => {
  let crossOwnerRejected = false;
  try { scopeReadFilters("conversations", { user_id: "other-user" }, "owner-123"); }
  catch (error) { crossOwnerRejected = error instanceof Error && error.message === "OWNER_FILTER_REQUIRED"; }
  if (!crossOwnerRejected) throw new Error("Cross-owner read was not rejected");

  let unknownTableRejected = false;
  try { scopeReadFilters("auth_users", {}, "owner-123"); }
  catch (error) { unknownTableRejected = error instanceof Error && error.message === "TABLE_OWNER_SCOPE_NOT_CONFIGURED"; }
  if (!unknownTableRejected) throw new Error("Unknown table was not rejected");
});

Deno.test("current Supabase named keys and legacy variables are supported", () => {
  const env = (name: string) => name === "SUPABASE_SECRET_KEYS"
    ? JSON.stringify({ default: "sb_secret_server" })
    : name === "SUPABASE_PUBLISHABLE_KEYS"
    ? JSON.stringify({ default: "sb_publishable_client" })
    : undefined;
  if (resolveServiceRoleKey(env) !== "sb_secret_server") throw new Error("Secret key resolution failed");
  if (resolvePublishableKey(env) !== "sb_publishable_client") throw new Error("Publishable key resolution failed");
});

Deno.test("opaque secret keys are not misused as bearer JWTs", () => {
  const headers = serviceRoleHeaders("sb_secret_server");
  if (headers.apikey !== "sb_secret_server" || headers.Authorization !== undefined) {
    throw new Error("Opaque secret key headers are incorrect");
  }
});
