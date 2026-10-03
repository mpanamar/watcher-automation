import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../supabase.ts";

export type AdminGateState =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "authenticated"; email: string }
  | { status: "not_admin"; email: string };

async function isEmailInAdmins(client: SupabaseClient): Promise<boolean> {
  const { data, error } = await client.rpc("is_admin");
  if (error) {
    console.warn("[admin] is_admin rpc failed:", error.message);
    return false;
  }
  return data === true;
}

export async function resolveAdminGate(): Promise<AdminGateState> {
  const client = getSupabaseBrowserClient();
  if (!client) return { status: "unconfigured" };

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError || !user?.email) return { status: "anonymous" };

  const email = user.email;
  const allowed = await isEmailInAdmins(client);
  return allowed ? { status: "authenticated", email } : { status: "not_admin", email };
}

export async function signInAdmin(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return { ok: false, message: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY." };
  }

  const { error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function signOutAdmin(): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client) return;
  await client.auth.signOut();
}

export function subscribeAdminAuth(onChange: () => void): () => void {
  const client = getSupabaseBrowserClient();
  if (!client) return () => undefined;

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(() => {
    onChange();
  });
  return () => subscription.unsubscribe();
}
