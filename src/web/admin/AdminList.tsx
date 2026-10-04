import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { signOutAdmin } from "./admin-auth.ts";
import { adminStillPublicUrl, listAdminCases, type AdminCaseSummary } from "./admin-cases.ts";
import { AdminNotAdmin } from "./AdminNotAdmin.tsx";
import { useAdminGate } from "./useAdminGate.ts";

export function AdminList(_props: { path?: string }) {
  const gate = useAdminGate();
  const [cases, setCases] = useState<AdminCaseSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gate.status === "anonymous" || gate.status === "unconfigured") {
      route("/admin/login", true);
    }
  }, [gate.status]);

  useEffect(() => {
    if (gate.status !== "authenticated") return;
    setLoading(true);
    listAdminCases()
      .then((rows) => {
        setCases(rows);
        setError("");
      })
      .catch((reason: unknown) => {
        setCases([]);
        setError(reason instanceof Error ? reason.message : "Could not load cases");
      })
      .finally(() => setLoading(false));
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

        {loading ? <p class="admin-empty">Loading cases…</p> : null}
        {error ? (
          <p class="admin-error" role="alert">
            {error}
          </p>
        ) : null}
        {!loading && !error && cases.length === 0 ? <p class="admin-empty">No cases</p> : null}

        <ul class="admin-case-list">
          {cases.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                class="admin-case-card"
                onClick={() => route(`/admin/cases/${item.id}`)}
              >
                {item.still ? (
                  <img
                    class="admin-case-thumb"
                    src={adminStillPublicUrl(item.still)}
                    alt=""
                    width={48}
                    height={48}
                  />
                ) : null}
                <span class="admin-case-id">{item.id}</span>
                <span class="admin-case-title">{item.title || "Untitled"}</span>
                <span class={`admin-badge ${item.published ? "is-live" : "is-draft"}`}>
                  {item.published ? "Published" : "Draft"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
