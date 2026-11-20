const MAX_SCHEDULES = 25;
const SAFE_STATUSES = new Set([
  "queued",
  "running",
  "waiting_approval",
  "succeeded",
  "success",
  "failed",
  "cancelled",
  "skipped",
]);

function cleanText(value, maxLength) {
  if (typeof value !== "string") return null;
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength);
}

function safeTimestamp(value) {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function normalizeSchedule(row) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const id = cleanText(row.id, 64);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;

  const rawStatus = cleanText(row.last_status, 32);
  return {
    id,
    name: cleanText(row.name, 80) ?? "Unnamed schedule",
    enabled: row.enabled === true,
    cron: cleanText(row.cron, 100),
    timezone: cleanText(row.timezone, 64) ?? "Africa/Cairo",
    next_run_at: safeTimestamp(row.next_run_at),
    last_run_at: safeTimestamp(row.last_run_at),
    last_status: rawStatus && SAFE_STATUSES.has(rawStatus) ? rawStatus : "unknown",
  };
}

function result(status, body) {
  return { status, body };
}

export function buildScheduledJobsUrl(supabaseUrl) {
  const url = new URL("/rest/v1/scheduled_jobs", supabaseUrl);
  url.searchParams.set(
    "select",
    "id,name,enabled,cron,timezone,next_run_at,last_run_at,last_status",
  );
  url.searchParams.set("order", "next_run_at.asc");
  url.searchParams.set("limit", String(MAX_SCHEDULES));
  return url;
}

export async function readAgentStatus({
  supabaseUrl,
  publishableKey,
  authorization,
  fetchImpl = fetch,
  now = () => new Date(),
}) {
  if (!supabaseUrl || !publishableKey) {
    return result(503, { error: "STATUS_CONFIGURATION_UNAVAILABLE" });
  }

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ") ||
    authorization.length > 8192
  ) {
    return result(401, { error: "UNAUTHORIZED" });
  }

  try {
    const authResponse = await fetchImpl(new URL("/auth/v1/user", supabaseUrl), {
      method: "GET",
      headers: {
        apikey: publishableKey,
        Authorization: authorization,
      },
    });

    if (!authResponse.ok) return result(401, { error: "UNAUTHORIZED" });

    const user = await authResponse.json().catch(() => null);
    if (!user || typeof user.id !== "string" || !user.id) {
      return result(401, { error: "UNAUTHORIZED" });
    }

    const schedulesResponse = await fetchImpl(
      buildScheduledJobsUrl(supabaseUrl),
      {
        method: "GET",
        headers: {
          apikey: publishableKey,
          Authorization: authorization,
          Accept: "application/json",
        },
      },
    );

    if (!schedulesResponse.ok) {
      return result(503, { error: "SCHEDULE_STATUS_UNAVAILABLE" });
    }

    const rows = await schedulesResponse.json().catch(() => null);
    if (!Array.isArray(rows)) {
      return result(503, { error: "SCHEDULE_STATUS_UNAVAILABLE" });
    }

    const schedules = rows
      .slice(0, MAX_SCHEDULES)
      .map(normalizeSchedule)
      .filter(Boolean);

    return result(200, {
      runtime: {
        state: "not_configured",
        durable_execution: false,
        note: "The current Worker is a chat gateway; durable job execution is not deployed.",
      },
      scheduled_job_definitions: schedules,
      generated_at: now().toISOString(),
    });
  } catch {
    return result(503, { error: "AGENT_STATUS_TEMPORARILY_UNAVAILABLE" });
  }
}
