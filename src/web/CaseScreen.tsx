import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import {
  postIdent,
  stillSrc,
  type Dossier,
  type PublicWatchCase,
  type SessionResponse,
} from "./watcher-api.ts";

type CaseScreenProps = {
  path?: string;
  id?: string;
  cases: PublicWatchCase[];
  session: SessionResponse | null;
  dossiers: Record<string, Dossier>;
  onIdentified: (id: string, dossier: Dossier) => Promise<void>;
  onNeedDossier: (id: string) => Promise<void>;
};

export function CaseScreen({
  id,
  cases,
  session,
  dossiers,
  onIdentified,
  onNeedDossier,
}: CaseScreenProps) {
  const item = cases.find((entry) => entry.id === id);
  const locked = Boolean(id && session?.locked.includes(id));
  const dossier = id ? dossiers[id] : undefined;
  const index = item ? cases.findIndex((entry) => entry.id === item.id) : 0;

  const [guess, setGuess] = useState("");
  const [selected, setSelected] = useState("");
  const [hint, setHint] = useState("");
  const [formError, setFormError] = useState("");
  const [verdict, setVerdict] = useState<"" | "correct" | "incorrect">("");
  const [live, setLive] = useState("");

  useEffect(() => {
    setGuess("");
    setSelected("");
    setHint("");
    setFormError("");
    setVerdict("");
    setLive("");
  }, [id]);

  function clearFeedback() {
    setHint("");
    setFormError("");
    setVerdict("");
  }

  useEffect(() => {
    if (id && locked && !dossier) {
      void onNeedDossier(id);
    }
  }, [id, locked, dossier]);

  if (!cases.length) {
    return <p class="load-error">Loading cases</p>;
  }

  if (!item || !id) {
    return <p class="load-error">Case not found</p>;
  }

  const caseItem = item;

  function go(delta: number) {
    const next = cases[(index + delta + cases.length) % cases.length];
    route(`/case/${next.id}`);
  }

  async function confirm(event: Event) {
    event.preventDefault();
    if (locked) return;
    const value = guess.trim();
    if (!value) {
      setFormError("Select a line or type a name.");
      setHint("");
      setVerdict("");
      setLive("Missing guess.");
      return;
    }
    const result = await postIdent(caseItem.id, value);
    if (result.correct) {
      setFormError("");
      setHint("");
      setVerdict("correct");
      setLive(`Correct. ${result.dossier.title} locked.`);
      await onIdentified(caseItem.id, result.dossier);
      return;
    }
    setFormError("");
    setVerdict("incorrect");
    setHint(result.hint);
    setLive("Incorrect. Hint issued.");
  }

  const status = locked ? "Identified" : "Open";
  const feedbackVisible = Boolean(formError || verdict);
  const hintClass = [
    "hint",
    feedbackVisible ? "is-on" : "",
    verdict === "correct" ? "hint--correct" : "",
    verdict === "incorrect" ? "hint--incorrect" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div class="sr" aria-live="polite">
        {live}
      </div>
      <main class="stage">
        <section class="still-wrap">
          <figure class="frame">
            <img src={stillSrc(caseItem.still)} alt={caseItem.stillAlt} width={1600} height={1066} />
          </figure>
          <div class="still-meta">
            <p>
              <span class="k">Source</span>
              <data>{caseItem.source}</data>
            </p>
            <p>
              <span class="k">Subject</span>
              <data>{caseItem.subject}</data>
            </p>
            <p>
              <span class="k">Frame</span>
              <data>{caseItem.frame}</data>
            </p>
          </div>
        </section>

        <section class="console" aria-labelledby="console-title">
          <h1 id="console-title">Name the watch</h1>
          <p class="lead">{caseItem.question}</p>
          <div class="options">
            {caseItem.options.map((option) => (
              <button
                key={option.key}
                type="button"
                class="opt"
                aria-pressed={selected === option.label}
                disabled={locked}
                onClick={() => {
                  setSelected(option.label);
                  setGuess(option.label);
                  clearFeedback();
                }}
              >
                <kbd>{option.key}</kbd>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
          <form class="ident" onSubmit={confirm}>
            <div class="field">
              <label for="command">Watch name</label>
              <p class="help" id="command-help">
                Choose a line, or type the model.
              </p>
              <input
                id="command"
                name="command"
                autocomplete="off"
                spellcheck={false}
                aria-describedby="command-help hint"
                value={guess}
                disabled={locked}
                onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
                  setGuess(event.currentTarget.value);
                  clearFeedback();
                }}
              />
              <p class={hintClass} id="hint" role="status">
                {formError ? (
                  formError
                ) : verdict === "correct" ? (
                  "Correct"
                ) : verdict === "incorrect" ? (
                  <>
                    <strong>Incorrect</strong>
                    {hint ? `. ${hint}` : null}
                  </>
                ) : null}
              </p>
            </div>
            <button class="fire" type="submit" disabled={locked}>
              Confirm
            </button>
          </form>
          <p class="lock-line">
            <span class="k">Status</span>
            <output class={locked ? "status-lock" : undefined}>{status}</output>
          </p>
        </section>
      </main>

      {dossier ? (
        <section class="dossier is-open" aria-live="polite">
          <article class="history">
            <h2>{dossier.title}</h2>
            <p class="ref">
              <span class="k">Reference</span>
              <data>{dossier.ref}</data>
            </p>
            <p class="history-body">{dossier.history}</p>
          </article>
          <aside class="procure">
            <a class="buy" href={dossier.buyNew} target="_blank" rel="noreferrer">
              Official catalogue
            </a>
            <a class="buy" href={dossier.buyUsed} target="_blank" rel="noreferrer">
              Chrono24 market
            </a>
          </aside>
        </section>
      ) : null}

      <nav class="nav-cases" aria-label="Case queue">
        <button type="button" onClick={() => go(-1)}>
          Previous
        </button>
        <p class="score">
          Identified
          <data value={session?.identified ?? 0}>
            {session?.identified ?? 0} / {session?.total ?? cases.length}
          </data>
        </p>
        <button type="button" onClick={() => go(1)}>
          Next
        </button>
      </nav>
    </>
  );
}
