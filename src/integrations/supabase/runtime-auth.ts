import { createClient } from "@supabase/supabase-js";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "./types";

export const requireCloudAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  const authorization = request?.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Unauthorized");

  const token = authorization.slice(7);
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Lovable Cloud connection is not configured");

  const userClient = createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized");

  return next({
    context: {
      supabase: userClient,
      userId: data.user.id,
      claims: data.user,
      accessToken: token,
    },
  });
});
