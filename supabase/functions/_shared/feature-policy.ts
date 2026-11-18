export interface FeatureFlags {
  emergencyKillSwitch: boolean;
  aiRoutingEnabled: boolean;
  externalActionsEnabled: boolean;
}

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

function readBooleanSetting(
  rows: unknown[],
  key: string,
  fallback: boolean,
): boolean {
  const matches = rows.filter(
    (row) => row !== null && typeof row === "object" &&
      !Array.isArray(row) && (row as Record<string, unknown>).key === key,
  );
  if (matches.length !== 1) return fallback;

  const value = (matches[0] as Record<string, unknown>).value;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

/**
 * Missing, duplicate, malformed, or unknown settings fail closed.
 * The kill switch defaults to on; capability flags default to off.
 */
export function parseFeatureFlags(rows: unknown): FeatureFlags {
  const settings = Array.isArray(rows) ? rows : [];
  return {
    emergencyKillSwitch: readBooleanSetting(
      settings,
      "emergency_kill_switch",
      true,
    ),
    aiRoutingEnabled: readBooleanSetting(
      settings,
      "enable_ai_routing",
      false,
    ),
    externalActionsEnabled: readBooleanSetting(
      settings,
      "enable_external_actions",
      false,
    ),
  };
}

export function aiRoutingAllowed(flags: FeatureFlags): boolean {
  return !flags.emergencyKillSwitch && flags.aiRoutingEnabled;
}

export function externalWritesAllowed(flags: FeatureFlags): boolean {
  return !flags.emergencyKillSwitch && flags.externalActionsEnabled;
}

/** Treat unknown write-like action names as writes, not as harmless reads. */
export function isExternalWriteAction(
  action: string,
  input: Record<string, unknown> = {},
): boolean {
  if (action === "github.read" || action === "supabase.read") return false;
  if (action.startsWith("github.")) return true;
  if (action === "cloudflare.request") {
    return String(input.method ?? "GET").toUpperCase() !== "GET";
  }
  if (action.startsWith("supabase.")) return true;
  return false;
}

/**
 * Service-role reads must be explicitly scoped to the authenticated user.
 * Reject a caller-supplied owner mismatch rather than silently overriding it.
 */
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

/** Supabase's newer sb_secret_ keys are API keys, not JWT bearer tokens. */
export function serviceRoleHeaders(
  serviceRoleKey: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    ...extra,
  };
  if (
    !serviceRoleKey.startsWith("sb_secret_") &&
    !serviceRoleKey.startsWith("sb_publishable_")
  ) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }
  return headers;
}

export async function loadFeatureFlags(options: {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<FeatureFlags> {
  const { supabaseUrl, serviceRoleKey, fetchImpl = fetch } = options;
  const timeoutMs = options.timeoutMs ?? 5_000;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("FEATURE_POLICY_UNAVAILABLE");
  }

  let base: URL;
  try {
    base = new URL(supabaseUrl);
  } catch {
    throw new Error("FEATURE_POLICY_UNAVAILABLE");
  }
  if (
    base.protocol !== "https:" || base.username || base.password ||
    base.search || base.hash || base.pathname !== "/"
  ) {
    throw new Error("FEATURE_POLICY_UNAVAILABLE");
  }

  const settingsUrl = new URL("/rest/v1/app_settings", base.origin);
  settingsUrl.searchParams.set(
    "key",
    "in.(emergency_kill_switch,enable_ai_routing,enable_external_actions)",
  );
  settingsUrl.searchParams.set("select", "key,value");

  let response: Response;
  try {
    response = await fetchImpl(settingsUrl, {
      method: "GET",
      headers: serviceRoleHeaders(serviceRoleKey, {
        Accept: "application/json",
        "Cache-Control": "no-store",
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error("FEATURE_POLICY_UNAVAILABLE");
  }

  if (!response.ok) throw new Error("FEATURE_POLICY_UNAVAILABLE");
  const rows = await response.json().catch(() => null);
  if (!Array.isArray(rows)) throw new Error("FEATURE_POLICY_UNAVAILABLE");
  return parseFeatureFlags(rows);
}
