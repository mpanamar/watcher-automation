import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mapCaseRow } from "../domain/case-mapper.ts";
import type { WatchCase } from "../domain/cases.ts";
import { resolvePublicStill } from "./still-url.ts";
import { getSeedCaseById, seedCases } from "./seed-cases.ts";

export class CatalogUnavailableError extends Error {
  constructor(message = "Catalog unavailable") {
    super(message);
    this.name = "CatalogUnavailableError";
  }
}

export type CatalogMode = "seed" | "storage";

export type Catalog = {
  mode: CatalogMode;
  list(): Promise<WatchCase[]>;
  get(id: string): Promise<WatchCase | undefined>;
};

export type CatalogClient = Pick<SupabaseClient, "from">;

function withPublicStill(item: WatchCase, mode: CatalogMode, supabaseUrl?: string): WatchCase {
  return {
    ...item,
    still: resolvePublicStill(item, mode, supabaseUrl),
  };
}

function mapRows(rows: unknown[], mode: CatalogMode, supabaseUrl?: string, logInvalid = false): WatchCase[] {
  const cases: WatchCase[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const mapped = mapCaseRow(row as Record<string, unknown>);
    if (!mapped) {
      if (logInvalid) console.warn("[catalog] skipped invalid case row");
      continue;
    }
    cases.push(withPublicStill(mapped, mode, supabaseUrl));
  }
  return cases;
}

export function createSeedCatalog(): Catalog {
  return {
    mode: "seed",
    async list() {
      return seedCases.map((item) => withPublicStill(item, "seed"));
    },
    async get(id: string) {
      const item = getSeedCaseById(id);
      return item ? withPublicStill(item, "seed") : undefined;
    },
  };
}

export function createSupabaseCatalog(client: CatalogClient, supabaseUrl: string): Catalog {
  return {
    mode: "storage",
    async list() {
      const { data, error } = await client
        .from("cases")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });

      if (error) throw new CatalogUnavailableError(error.message);
      return mapRows(data ?? [], "storage", supabaseUrl, true);
    },
    async get(id: string) {
      const { data, error } = await client.from("cases").select("*").eq("id", id).eq("published", true).maybeSingle();

      if (error) throw new CatalogUnavailableError(error.message);
      if (!data) return undefined;
      const mapped = mapCaseRow(data as Record<string, unknown>);
      if (!mapped) {
        console.warn("[catalog] skipped invalid case row", id);
        return undefined;
      }
      return withPublicStill(mapped, "storage", supabaseUrl);
    },
  };
}

export function resolveCatalogFromEnv(env: NodeJS.ProcessEnv = process.env): Catalog {
  const url = env.SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return createSeedCatalog();

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return createSupabaseCatalog(client, url);
}
