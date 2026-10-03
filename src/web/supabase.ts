import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let testOverride: SupabaseClient | null | undefined;
let singleton: SupabaseClient | null = null;

/** Test-only: inject a client or `null`. Pass `undefined` to reset. */
export function __setSupabaseClientForTests(client: SupabaseClient | null | undefined): void {
  testOverride = client;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (testOverride !== undefined) return testOverride;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;

  if (!singleton) {
    singleton = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return singleton;
}
