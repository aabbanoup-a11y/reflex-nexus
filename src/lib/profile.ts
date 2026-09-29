import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/runtime-client";

export async function ensureUserProfile(user: User) {
  const displayName =
    (typeof user.user_metadata?.["display_name"] === "string" && user.user_metadata["display_name"].trim()) ||
    (typeof user.user_metadata?.["full_name"] === "string" && user.user_metadata["full_name"].trim()) ||
    user.email?.split("@")[0] ||
    "مستخدم AbanoubAI";
  const avatarUrl =
    typeof user.user_metadata?.["avatar_url"] === "string" ? user.user_metadata["avatar_url"] : null;

  const { error } = await supabase.from("profiles").upsert(
    { id: user.id, display_name: displayName, avatar_url: avatarUrl },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw error;
}
