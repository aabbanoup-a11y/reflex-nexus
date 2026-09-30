// Browser client bound to THIS project's Lovable Cloud backend (from env),
// independent of the stale hardcoded values left in the generated client.ts.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

function make() {
  const url =
    import.meta.env['VITE_SUPABASE_URL'] ||
    (typeof process !== "undefined" ? process.env["SUPABASE_URL"] : undefined);
  const key =
    import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
    (typeof process !== "undefined" ? process.env["SUPABASE_PUBLISHABLE_KEY"] : undefined);
  if (!url || !key) throw new Error("Lovable Cloud connection is not configured");
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined);
        if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: brokeredPreviewStorage(), persistSession: true, autoRefreshToken: true },
  });
}

let client: ReturnType<typeof make> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof make>, {
  get(_, prop, receiver) {
    if (!client) client = make();
    return Reflect.get(client, prop, receiver);
  },
});
