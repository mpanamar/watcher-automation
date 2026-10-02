import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import Router, { route } from "preact-router";
import {
  getCases,
  getSession,
  postIdent,
  type Dossier,
  type PublicWatchCase,
  type SessionResponse,
} from "./watcher-api.ts";
import { applyTheme, readTheme, type Theme } from "./theme";
import { CaseScreen } from "./CaseScreen.tsx";

export function App() {
  const [cases, setCases] = useState<PublicWatchCase[]>([]);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [dossiers, setDossiers] = useState<Record<string, Dossier>>({});
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [path, setPath] = useState(
    typeof window === "undefined" ? "/" : window.location.pathname,
  );

  useEffect(() => {
    const next = readTheme();
    setTheme(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    Promise.all([getCases(), getSession()])
      .then(([list, current]) => {
        setCases(list);
        setSession(current);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Could not load Watcher");
      });
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  async function rememberIdent(id: string, dossier: Dossier) {
    setDossiers((current) => ({ ...current, [id]: dossier }));
    setSession(await getSession());
  }

  async function resumeDossier(caseId: string) {
    const result = await postIdent(caseId, "resume");
    if (result.correct) {
      setDossiers((current) => ({ ...current, [caseId]: result.dossier }));
    }
  }

  const currentId = path.split("/").pop();
  const currentIndex = Math.max(
    0,
    cases.findIndex((item) => item.id === currentId),
  );

  return (
    <>
      <header class="nav">
        <a
          class="wordmark"
          href="/"
          onClick={(event: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            if (cases[0]) route(`/case/${cases[0].id}`);
          }}
        >
          Watcher
        </a>
        <div class="nav-end">
          <span>{cases.length ? `${currentIndex + 1} of ${cases.length}` : ""}</span>
          <button type="button" aria-pressed={theme === "dark"} onClick={toggleTheme}>
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {error ? <p class="load-error">{error}</p> : null}

      <Router onChange={(event) => setPath(event.url)}>
        <Home path="/" cases={cases} />
        <CaseScreen
          path="/case/:id"
          cases={cases}
          session={session}
          dossiers={dossiers}
          onIdentified={rememberIdent}
          onNeedDossier={resumeDossier}
        />
      </Router>
    </>
  );
}

function Home({ cases }: { cases: PublicWatchCase[]; path?: string }) {
  useEffect(() => {
    if (cases[0]) route(`/case/${cases[0].id}`, true);
  }, [cases]);
  return <p class="load-error">Loading cases</p>;
}
