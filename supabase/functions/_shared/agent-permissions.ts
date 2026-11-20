/** Server-only helpers for authenticated owner-scoped agent operations. */
const READ_OWNER_COLUMNS: Readonly<Record<string, string>> = Object.freeze({
  agent_workspace_actions: "user_id",
  artifacts: "user_id",
  daily_reports: "user_id",
  goals: "owner_id",
  knowledge_docs: "created_by",
  notifications: "user_id",
  tasks: "owner_id",
  conversations: "user_id",
  conversation_messages: "user_id",
  memory_entries: "created_by",
  memory_branches: "user_id",
});

export function scopeReadFilters(
  table: string,
  filters: Record<string, unknown>,
  userId: string,
): Record<string, unknown> {
  const ownerColumn = READ_OWNER_COLUMNS[table];
  if (!ownerColumn) throw new Error("TABLE_OWNER_SCOPE_NOT_CONFIGURED");
  if (!userId) throw new Error("UNAUTHORIZED");
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    throw new Error("INVALID_FILTER");
  }
  const requestedOwner = filters[ownerColumn];
  if (requestedOwner !== undefined && requestedOwner !== userId) {
    throw new Error("OWNER_FILTER_REQUIRED");
  }
  return { ...filters, [ownerColumn]: userId };
}

/** Support both current Supabase named keys and legacy runtime variables. */
export function resolveServiceRoleKey(
  readEnv: (name: string) => string | undefined,
): string {
  const raw = readEnv("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const value = JSON.parse(raw)?.default;
      if (typeof value === "string" && value.trim()) return value.trim();
    } catch {
      // Continue to the legacy variable.
    }
  }
  return readEnv("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
}

export function resolvePublishableKey(
  readEnv: (name: string) => string | undefined,
): string {
  const raw = readEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    try {
      const value = JSON.parse(raw)?.default;
      if (typeof value === "string" && value.trim()) return value.trim();
    } catch {
      // Continue to legacy variables.
    }
  }
  return readEnv("SUPABASE_PUBLISHABLE_KEY")?.trim() ||
    readEnv("SUPABASE_ANON_KEY")?.trim() || "";
}

export function serviceRoleHeaders(
  key: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = { apikey: key, ...extra };
  // Opaque sb_secret_ keys are API keys, not JWT bearer tokens.
  if (!key.startsWith("sb_secret_") && !key.startsWith("sb_publishable_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}
