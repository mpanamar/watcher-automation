import { route } from "preact-router";
import { signOutAdmin } from "./admin-auth.ts";

type Props = { email: string };

export function AdminNotAdmin({ email }: Props) {
  async function signOut() {
    await signOutAdmin();
    route("/admin/login");
  }

  return (
    <main class="page admin-page">
      <section class="admin-panel admin-panel--narrow">
        <h1 class="admin-title">Not an admin</h1>
        <p class="admin-lead">
          Signed in as <strong>{email}</strong>, but this account is not on the admin allowlist.
        </p>
        <button type="button" class="fire admin-submit" onClick={() => void signOut()}>
          Sign out
        </button>
      </section>
    </main>
  );
}
