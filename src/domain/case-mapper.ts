import { caseSchema, type WatchCase } from "./cases.ts";

export type CaseRow = Record<string, unknown>;

function readString(row: CaseRow, key: string): string | undefined {
  const value = row[key];
  return typeof value === "string" ? value : undefined;
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
  };

  const result = caseSchema.safeParse(candidate);
  return result.success ? result.data : undefined;
}
