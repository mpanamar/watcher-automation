import type { SupabaseClient } from "@supabase/supabase-js";

type Session = { user: { id: string; email: string } };

const state = {
  session: null as Session | null,
  signInError: null as string | null,
  adminEmails: new Set<string>(),
  authListeners: [] as (() => void)[],
};

function notifyAuth() {
  for (const listener of state.authListeners) {
    listener();
  }
}

export function resetSupabaseMock(): void {
  state.session = null;
  state.signInError = null;
  state.adminEmails = new Set();
  state.authListeners = [];
}

export function setSupabaseMockSession(session: Session | null): void {
  state.session = session;
  notifyAuth();
}

export function setSupabaseMockAdminEmails(emails: string[]): void {
  state.adminEmails = new Set(emails.map((email) => email.toLowerCase()));
}

export function setSupabaseMockSignInError(message: string | null): void {
  state.signInError = message;
}

export function createSupabaseMockClient(): SupabaseClient {
  const client = {
    auth: {
      getSession: async () => ({ data: { session: state.session }, error: null }),
      getUser: async () => ({
        data: { user: state.session?.user ?? null },
        error: null,
      }),
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        void password;
        if (state.signInError) {
          return { data: { session: null, user: null }, error: { message: state.signInError } };
        }
        state.session = { user: { id: "test-user-id", email } };
        notifyAuth();
        return { data: { session: state.session, user: state.session.user }, error: null };
      },
      signOut: async () => {
        state.session = null;
        notifyAuth();
        return { error: null };
      },
      onAuthStateChange: (callback: () => void) => {
        state.authListeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                state.authListeners = state.authListeners.filter((item) => item !== callback);
              },
            },
          },
        };
      },
    },
    rpc: (fn: string) => {
      if (fn !== "is_admin") {
        return Promise.resolve({ data: null, error: { message: `Unknown rpc: ${fn}` } });
      }
      const email = state.session?.user.email?.toLowerCase() ?? "";
      const allowed = Boolean(email && state.adminEmails.has(email));
      return Promise.resolve({ data: allowed, error: null });
    },
    from: (table: string) => ({
      select: (_columns: string) => ({
        maybeSingle: async () => {
          if (table !== "admins" || !state.session?.user.email) {
            return { data: null, error: null };
          }
          const email = state.session.user.email.toLowerCase();
          if (!state.adminEmails.has(email)) {
            return { data: null, error: null };
          }
          return { data: { email: state.session.user.email }, error: null };
        },
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  };

  return client as unknown as SupabaseClient;
}
