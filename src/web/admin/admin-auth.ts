const SESSION_KEY = "watcher-admin-local";

export function isAdminSignedIn(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function signInLocal(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function signOutLocal(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
