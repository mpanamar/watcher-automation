import { mapCaseRow, mapWatchCaseToRow } from "../../domain/case-mapper.ts";
import { caseSchema, type WatchCase } from "../../domain/cases.ts";
import { getSupabaseBrowserClient } from "../supabase.ts";

export type AdminCaseSummary = {
  id: string;
  title: string;
  published: boolean;
  still: string;
};

export type AdminCaseRecord = {
  item: WatchCase;
  published: boolean;
  sortOrder: number;
};

export function adminStillPublicUrl(stillKey: string): string {
  if (stillKey.startsWith("http://") || stillKey.startsWith("https://") || stillKey.startsWith("/")) {
    return stillKey;
  }
  const base = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!base) return `/${stillKey.replace(/^\//, "")}`;
  return `${base}/storage/v1/object/public/stills/${stillKey.replace(/^\//, "")}`;
}

function requireClient() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase is not configured.");
  return client;
}

export async function listAdminCases(): Promise<AdminCaseSummary[]> {
  const client = requireClient();
  const { data, error } = await client
    .from("cases")
    .select("id, title, published, still")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminCaseSummary[];
}

export async function fetchAdminCaseRecord(id: string): Promise<AdminCaseRecord | null> {
  const client = requireClient();
  const { data, error } = await client.from("cases").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const item = mapCaseRow(data as Record<string, unknown>);
  if (!item) return null;

  return {
    item,
    published: Boolean((data as { published?: boolean }).published),
    sortOrder: Number((data as { sort_order?: number }).sort_order ?? 0),
  };
}

async function nextSortOrder(): Promise<number> {
  const client = requireClient();
  const { data, error } = await client
    .from("cases")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const current = typeof data?.sort_order === "number" ? data.sort_order : -1;
  return current + 1;
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").trim();
  if (!base || base.includes("..")) throw new Error("Invalid image filename.");
  return base;
}

export async function uploadStillFile(caseId: string, file: File): Promise<string> {
  const client = requireClient();
  const filename = sanitizeFilename(file.name);
  const path = `${caseId}/${filename}`;

  const { error } = await client.storage.from("stills").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function saveAdminCase(
  item: WatchCase,
  options: { published: boolean; isNew: boolean; stillFile?: File | null },
): Promise<void> {
  const client = requireClient();
  const parsed = caseSchema.parse(item);

  let still = parsed.still;
  if (options.stillFile) {
    still = await uploadStillFile(parsed.id, options.stillFile);
  }

  const withStill = { ...parsed, still };
  caseSchema.parse(withStill);

  if (options.isNew) {
    const sort_order = await nextSortOrder();
    const row = mapWatchCaseToRow(withStill, { published: options.published, sort_order });
    const { error } = await client.from("cases").insert(row);
    if (error) throw new Error(error.message);
    return;
  }

  const existing = await fetchAdminCaseRecord(parsed.id);
  if (!existing) throw new Error("Case not found");

  const row = mapWatchCaseToRow(withStill, {
    published: options.published,
    sort_order: existing.sortOrder,
  });
  const { error } = await client.from("cases").update(row).eq("id", parsed.id);
  if (error) throw new Error(error.message);
}
