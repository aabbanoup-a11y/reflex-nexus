import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

export const cloud = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  global: { fetch: projectFetch },
  auth: {
    storage: brokeredPreviewStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
});