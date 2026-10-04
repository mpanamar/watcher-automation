import type { SupabaseClient } from "@supabase/supabase-js";

type Session = { user: { id: string; email: string } };

const state = {
  session: null as Session | null,
  signInError: null as string | null,
  adminEmails: new Set<string>(),
  authListeners: [] as (() => void)[],
  cases: [] as Record<string, unknown>[],
};

function notifyAuth() {
  for (const listener of state.authListeners) {
    listener();
  }
}

function sortCases(column: string, ascending: boolean): Record<string, unknown>[] {
  const rows = [...state.cases];
  rows.sort((a, b) => {
    const left = a[column];
    const right = b[column];
    if (typeof left === "number" && typeof right === "number") {
      return ascending ? left - right : right - left;
    }
    return String(left ?? "").localeCompare(String(right ?? ""));
  });
  return rows;
}

function projectColumns(rows: Record<string, unknown>[], columns: string): Record<string, unknown>[] {
  if (columns.trim() === "*") return rows;
  const keys = columns.split(",").map((key) => key.trim());
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const key of keys) out[key] = row[key];
    return out;
  });
}

export function resetSupabaseMock(): void {
  state.session = null;
  state.signInError = null;
  state.adminEmails = new Set();
  state.authListeners = [];
  state.cases = [];
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

export function getSupabaseMockCases(): Record<string, unknown>[] {
  return state.cases;
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
    storage: {
      from: (_bucket: string) => ({
        upload: async (path: string) => {
          if (!path || path.includes("..")) return { error: { message: "Invalid path" } };
          return { error: null };
        },
      }),
    },
    from: (table: string) => {
      if (table === "admins") {
        return {
          select: (_columns: string) => ({
            maybeSingle: async () => {
              if (!state.session?.user.email) return { data: null, error: null };
              const email = state.session.user.email.toLowerCase();
              if (!state.adminEmails.has(email)) return { data: null, error: null };
              return { data: { email: state.session.user.email }, error: null };
            },
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      }

      if (table !== "cases") {
        return {
          select: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
            eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
          }),
          insert: () => Promise.resolve({ error: { message: "Unknown table" } }),
          update: () => ({ eq: () => Promise.resolve({ error: { message: "Unknown table" } }) }),
        };
      }

      return {
        select: (columns: string) => {
          const eq = (column: string, value: string) => ({
            maybeSingle: async () => {
              const row = state.cases.find((item) => String(item[column]) === value);
              if (!row) return { data: null, error: null };
              return { data: projectColumns([row], columns)[0] ?? null, error: null };
            },
          });

          const order = (column: string, opts?: { ascending?: boolean }) => {
            const ascending = opts?.ascending ?? true;
            const sorted = sortCases(column, ascending);
            const rows = projectColumns(sorted, columns);
            const listResult = Promise.resolve({ data: rows, error: null as null });
            return Object.assign(listResult, {
              limit(_count: number) {
                const row = sorted[0] ?? null;
                return {
                  maybeSingle: async () => {
                    if (!row) return { data: null, error: null };
                    return { data: projectColumns([row], columns)[0] ?? null, error: null };
                  },
                };
              },
            });
          };

          return { order, eq };
        },
        insert: (row: Record<string, unknown>) => {
          state.cases.push({ ...row });
          return Promise.resolve({ error: null });
        },
        update: (row: Record<string, unknown>) => ({
          eq: (column: string, value: string) => {
            const index = state.cases.findIndex((item) => String(item[column]) === value);
            if (index >= 0) state.cases[index] = { ...state.cases[index], ...row };
            return Promise.resolve({ error: null });
          },
        }),
      };
    },
  };

  return client as unknown as SupabaseClient;
}
