import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { route } from "preact-router";
import { isAdminSignedIn, signInLocal } from "./admin-auth.ts";

export function AdminLogin(_props: { path?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isAdminSignedIn()) {
    route("/admin", true);
    return null;
  }

  function submit(event: JSX.TargetedEvent<HTMLFormElement, Event>) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Enter email and password.");
      return;
    }
    signInLocal();
    route("/admin");
  }

  return (
    <main class="page admin-page">
      <section class="admin-panel admin-panel--narrow">
        <h1 class="admin-title">Admin sign in</h1>
        <p class="admin-lead">Local shell only. Supabase auth arrives in a later sprint.</p>
        <form class="admin-form" onSubmit={submit} noValidate>
          <label class="admin-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="admin-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            />
          </label>
          {error ? (
            <p class="admin-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" class="fire admin-submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
