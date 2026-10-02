import type { WatchCase } from "../../domain/cases.ts";

const STORAGE_KEY = "watcher-admin-saved-cases";

export function loadSavedCases(): WatchCase[] {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as WatchCase[]) : [];
  } catch {
    return [];
  }
}

export function saveCaseLocally(item: WatchCase): void {
  const list = loadSavedCases().filter((row) => row.id !== item.id);
  list.push(item);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
