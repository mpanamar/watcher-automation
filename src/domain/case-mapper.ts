import { caseSchema, type WatchCase } from "./cases.ts";

export type CaseRow = Record<string, unknown>;

function readString(row: CaseRow, key: string): string | undefined {
  const value = row[key];
  return typeof value === "string" ? value : undefined;
}

function readPercent(row: CaseRow, key: string): number | undefined {
  const value = row[key];
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) return parsed;
  }
  return undefined;
}

/** Maps a Supabase `cases` row (snake_case) to a domain case, or undefined if invalid. */
export function mapCaseRow(row: CaseRow): WatchCase | undefined {
  const options = row.options;
  const aliases = row.aliases;

  const candidate = {
    id: readString(row, "id"),
    still: readString(row, "still"),
    stillAlt: readString(row, "still_alt"),
    source: readString(row, "source"),
    subject: readString(row, "subject"),
    frame: readString(row, "frame"),
    question: readString(row, "question"),
    options: Array.isArray(options) ? options : undefined,
    answer: readString(row, "answer"),
    aliases: Array.isArray(aliases) ? aliases.filter((item): item is string => typeof item === "string") : undefined,
    hint: readString(row, "hint"),
    title: readString(row, "title"),
    ref: readString(row, "ref"),
    history: readString(row, "history"),
    buyNew: readString(row, "buy_new"),
    buyUsed: readString(row, "buy_used"),
    inlineStillX: readPercent(row, "inline_still_x"),
    inlineStillY: readPercent(row, "inline_still_y"),
    inlineStillZoom: readPercent(row, "inline_still_zoom"),
  };

  const result = caseSchema.safeParse(candidate);
  return result.success ? result.data : undefined;
}

export function mapWatchCaseToRow(
  item: WatchCase,
  extra: { published: boolean; sort_order: number },
): Record<string, unknown> {
  return {
    id: item.id,
    still: item.still,
    still_alt: item.stillAlt,
    source: item.source,
    subject: item.subject,
    frame: item.frame,
    question: item.question,
    options: item.options,
    answer: item.answer,
    aliases: item.aliases,
    hint: item.hint,
    title: item.title,
    ref: item.ref,
    history: item.history,
    buy_new: item.buyNew,
    buy_used: item.buyUsed,
    inline_still_x: item.inlineStillX ?? null,
    inline_still_y: item.inlineStillY ?? null,
    inline_still_zoom: item.inlineStillZoom ?? null,
    published: extra.published,
    sort_order: extra.sort_order,
    updated_at: new Date().toISOString(),
  };
}
