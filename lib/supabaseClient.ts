import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  typeof supabaseAnonKey === "string" &&
  supabaseAnonKey.length > 0;

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export function assertSupabaseConfigured() {
  if (supabase) return supabase;
  throw new Error(
    "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment."
  );
}
