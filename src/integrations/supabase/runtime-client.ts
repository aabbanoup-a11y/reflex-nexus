import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

const supabaseUrl = "https://wobfdslqlmvlatyrtgkd.supabase.co";
const supabasePublishableKey = "sb_publishable_mvMX_Ih1Dri5MOmYTq02Gw_2a_iFiwZ";

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Lovable Cloud connection is not configured");
}

function projectFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (supabasePublishableKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${supabasePublishableKey}`) {
    headers.delete("Authorization");
  }
  headers.set("apikey", supabasePublishableKey);
  return fetch(input, { ...init, headers });
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  global: { fetch: projectFetch },
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
});
