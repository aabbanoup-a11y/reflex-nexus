// Browser client bound directly to the AbanoubAI Supabase project.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

// Public Supabase URL and publishable key for this project; both are safe in browser code.
const FALLBACK_URL = "https://wobfdslqlmvlatyrtgkd.supabase.co";
const FALLBACK_KEY = "sb_publishable_mvMX_Ih1Dri5MOmYTq02Gw_2a_iFiwZ";

function make() {
  const url =
    import.meta.env['VITE_SUPABASE_URL'] ||
    (typeof process !== "undefined" ? process.env["SUPABASE_URL"] : undefined) ||
    FALLBACK_URL;
  const key =
    import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
    (typeof process !== "undefined" ? process.env["SUPABASE_PUBLISHABLE_KEY"] : undefined) ||
    FALLBACK_KEY;
  if (!url || !key) throw new Error("Supabase connection is not configured");
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
