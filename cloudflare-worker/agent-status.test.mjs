import assert from "node:assert/strict";
import test from "node:test";
import { readAgentStatus } from "./agent-status.mjs";

const USER_ID = "6c7a9c34-2d10-4e9c-9e31-7a8c5d8f0011";
const JOB_ID = "a1b2c3d4-e5f6-4789-8abc-1234567890ab";
const AUTHORIZATION = "Bearer test-user-session";
const SUPABASE_URL = "https://example.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_test";

function response(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    },
  };
}

function baseOptions(fetchImpl) {
  return {
    supabaseUrl: SUPABASE_URL,
    publishableKey: PUBLISHABLE_KEY,
    authorization: AUTHORIZATION,
    fetchImpl,
    now: () => new Date("2026-11-17T18:00:00.000Z"),
  };
}

test("rejects missing bearer credentials without making a network request", async () => {
  let calls = 0;
  const result = await readAgentStatus({
    ...baseOptions(async () => {
      calls += 1;
      return response(200, {});
    }),
    authorization: "",
  });

  assert.equal(result.status, 401);
  assert.deepEqual(result.body, { error: "UNAUTHORIZED" });
  assert.equal(calls, 0);
});

test("rejects invalid sessions before querying user-owned schedules", async () => {
  const paths = [];
  const result = await readAgentStatus(
    baseOptions(async (url) => {
      paths.push(new URL(url).pathname);
      return response(401, { message: "private auth detail" });
    }),
  );

  assert.equal(result.status, 401);
  assert.deepEqual(paths, ["/auth/v1/user"]);
});

test("uses the verified user session and RLS for a bounded, redacted schedule list", async () => {
  const calls = [];
  const result = await readAgentStatus({
    ...baseOptions(async (url, init) => {
      const parsed = new URL(url);
      calls.push({ url: parsed, init });

      if (parsed.pathname === "/auth/v1/user") {
        return response(200, { id: USER_ID });
      }

      return response(200, [
        {
          id: JOB_ID,
          name: "Daily project review",
          enabled: true,
          cron: "0 20 * * *",
          timezone: "Africa/Cairo",
          next_run_at: "2026-11-18T18:00:00.000Z",
          last_run_at: "2026-11-17T18:00:00.000Z",
          last_status: "succeeded",
          user_id: USER_ID,
          instruction: "must not be returned",
          command: "must not be returned",
          last_result: "must not be returned",
        },
      ]);
    }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.runtime.durable_execution, false);
  assert.equal(result.body.runtime.state, "not_configured");
  assert.equal(result.body.scheduled_job_definitions.length, 1);
  assert.deepEqual(result.body.scheduled_job_definitions[0], {
    id: JOB_ID,
    name: "Daily project review",
    enabled: true,
    cron: "0 20 * * *",
    timezone: "Africa/Cairo",
    next_run_at: "2026-11-18T18:00:00.000Z",
    last_run_at: "2026-11-17T18:00:00.000Z",
    last_status: "succeeded",
  });

  const authCall = calls[0];
  const dataCall = calls[1];
  assert.equal(authCall.url.pathname, "/auth/v1/user");
  assert.equal(dataCall.url.pathname, "/rest/v1/scheduled_jobs");
  assert.equal(dataCall.url.searchParams.get("user_id"), null);
  assert.equal(dataCall.url.searchParams.get("limit"), "25");
  assert.equal(
    dataCall.url.searchParams.get("select"),
    "id,name,enabled,cron,timezone,next_run_at,last_run_at,last_status",
  );
  assert.equal(dataCall.init.headers.Authorization, AUTHORIZATION);
  assert.equal(dataCall.init.headers.apikey, PUBLISHABLE_KEY);
  assert.equal("service_role" in dataCall.init.headers, false);
  assert.equal(JSON.stringify(result.body).includes("must not be returned"), false);
  assert.equal(result.body.generated_at, "2026-11-17T18:00:00.000Z");
});

test("bounds the response and drops malformed rows and unrecognized status values", async () => {
  const rows = Array.from({ length: 30 }, (_, index) => ({
    id: index === 0 ? "invalid" : `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    name: `Schedule ${index}`,
    enabled: true,
    last_status: "arbitrary-user-content",
    instruction: "private",
  }));

  const result = await readAgentStatus(
    baseOptions(async (url) =>
      new URL(url).pathname === "/auth/v1/user"
        ? response(200, { id: USER_ID })
        : response(200, rows),
    ),
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.scheduled_job_definitions.length, 24);
  assert.equal(result.body.scheduled_job_definitions[0].last_status, "unknown");
  assert.equal("instruction" in result.body.scheduled_job_definitions[0], false);
});

test("returns a generic unavailable response when schedule storage fails", async () => {
  const result = await readAgentStatus(
    baseOptions(async (url) =>
      new URL(url).pathname === "/auth/v1/user"
        ? response(200, { id: USER_ID })
        : response(500, { message: "private database details" }),
    ),
  );

  assert.equal(result.status, 503);
  assert.deepEqual(result.body, { error: "SCHEDULE_STATUS_UNAVAILABLE" });
});

test("fails closed when the auth response does not identify a user", async () => {
  let dataApiCalls = 0;
  const result = await readAgentStatus(
    baseOptions(async (url) => {
      if (new URL(url).pathname === "/auth/v1/user") {
        return response(200, { id: null });
      }
      dataApiCalls += 1;
      return response(200, []);
    }),
  );

  assert.equal(result.status, 401);
  assert.equal(dataApiCalls, 0);
});
