import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { signOutAdmin } from "./admin-auth.ts";
import { AdminNotAdmin } from "./AdminNotAdmin.tsx";
import { loadSavedCases } from "./admin-storage.ts";
import { adminMockCaseCard } from "./mock-case.ts";
import { useAdminGate } from "./useAdminGate.ts";

export function AdminList(_props: { path?: string }) {
  const gate = useAdminGate();
  const [saved, setSaved] = useState(loadSavedCases());

  useEffect(() => {
    if (gate.status === "anonymous" || gate.status === "unconfigured") {
      route("/admin/login", true);
    }
  }, [gate.status]);

  if (gate.status === "loading") {
    return <p class="load-error">Loading…</p>;
  }

  if (gate.status === "anonymous" || gate.status === "unconfigured") {
    return null;
  }

  if (gate.status === "not_admin") {
    return <AdminNotAdmin email={gate.email} />;
  }

  function refresh() {
    setSaved(loadSavedCases());
  }

  async function signOut() {
    await signOutAdmin();
    route("/admin/login");
  }

  return (
    <main class="page admin-page">
      <section class="admin-panel">
        <div class="admin-head">
          <div>
            <h1 class="admin-title">Cases</h1>
            <p class="admin-lead">Draft and publish watch stills for the quiz.</p>
          </div>
          <div class="admin-head-actions">
            <button type="button" class="fire" onClick={() => route("/admin/cases/new")}>
              New case
            </button>
            <button type="button" class="admin-ghost" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>

        {saved.length === 0 ? <p class="admin-empty">No cases</p> : null}

        <ul class="admin-case-list">
          {saved.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                class="admin-case-card"
                onClick={() => route(`/admin/cases/${item.id}`)}
              >
                <span class="admin-case-id">{item.id}</span>
                <span class="admin-case-title">{item.title}</span>
                <span class={`admin-badge ${item.published ? "is-live" : "is-draft"}`}>
                  {item.published ? "Published" : "Draft"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <h2 class="admin-subtitle">Layout preview</h2>
        <ul class="admin-case-list">
          <li>
            <div class="admin-case-card admin-case-card--static" aria-hidden="false">
              <span class="admin-case-id">{adminMockCaseCard.id}</span>
              <span class="admin-case-title">{adminMockCaseCard.title}</span>
              <span class={`admin-badge ${adminMockCaseCard.published ? "is-live" : "is-draft"}`}>
                {adminMockCaseCard.published ? "Published" : "Draft"}
              </span>
            </div>
          </li>
        </ul>

        <button type="button" class="sr" onClick={refresh}>
          Refresh list
        </button>
      </section>
    </main>
  );
}
