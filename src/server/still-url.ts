/** Resolves a still reference for public API JSON (absolute URL or root-relative path). */
export function resolveStillForPublic(still: string, mode: "seed" | "storage", supabaseUrl?: string): string {
  if (still.startsWith("/") || still.startsWith("http://") || still.startsWith("https://")) {
    return still;
  }

  if (mode === "seed") {
    return still.startsWith("stills/") ? `/${still}` : `/stills/${still}`;
  }

  const base = supabaseUrl?.replace(/\/$/, "");
  if (!base) return still;
  return `${base}/storage/v1/object/public/stills/${still.replace(/^\//, "")}`;
}

export function resolvePublicStill(item: { still: string }, catalogMode: "seed" | "storage", supabaseUrl?: string): string {
  return resolveStillForPublic(item.still, catalogMode, supabaseUrl);
}
