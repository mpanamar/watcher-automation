export type IdentTarget = {
  answer: string;
  aliases: readonly string[];
};

export function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function isMatch(input: string, item: IdentTarget): boolean {
  const normalized = normalize(input);
  if (!normalized) return false;
  if (normalized === normalize(item.answer)) return true;
  return item.aliases.some((alias) => {
    const needle = normalize(alias);
    return normalized === needle || normalized.includes(needle);
  });
}
