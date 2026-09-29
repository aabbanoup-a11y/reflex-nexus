// Keep one Supabase client for browser auth, database, and realtime.
// The generated client preserves Request headers required by Supabase Auth.
export { supabase } from "./client";
