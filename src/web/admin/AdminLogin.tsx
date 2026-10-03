import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { signInAdmin } from "./admin-auth.ts";
import { useAdminGate } from "./useAdminGate.ts";

export function AdminLogin(_props: { path?: string }) {
  const gate = useAdminGate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (gate.status === "authenticated") {
      route("/admin", true);
    }
  }, [gate.status]);

  if (gate.status === "loading" || gate.status === "authenticated") {
    return <p class="load-error">Loading…</p>;
  }

  async function submit(event: JSX.TargetedEvent<HTMLFormElement, Event>) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Enter email and password.");
      return;
    }

    setSubmitting(true);
    const result = await signInAdmin(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    route("/admin");
  }

  const configHint =
    gate.status === "unconfigured"
      ? "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env, then restart Vite."
      : "Sign in with your Supabase Auth user.";

  return (
    <main class="page admin-page">
      <section class="admin-panel admin-panel--narrow">
        <h1 class="admin-title">Admin sign in</h1>
        <p class="admin-lead">{configHint}</p>
        <form class="admin-form" onSubmit={(event) => void submit(event)} noValidate>
          <label class="admin-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              disabled={submitting || gate.status === "unconfigured"}
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
              disabled={submitting || gate.status === "unconfigured"}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            />
          </label>
          {error ? (
            <p class="admin-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" class="fire admin-submit" disabled={submitting || gate.status === "unconfigured"}>
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
