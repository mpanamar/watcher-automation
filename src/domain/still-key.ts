/** Storage object key for bucket `stills` (not a public URL). */
export function isStillStorageKey(value: string): boolean {
  const key = value.trim();
  if (!key) return false;
  if (key.includes("..") || key.includes('"') || key.includes("'")) return false;
  if (/^https?:\/\//i.test(key)) return false;
  return true;
}
