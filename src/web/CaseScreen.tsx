import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { inlineStillBackgroundPosition, inlineStillBackgroundSize } from "../domain/inline-still-focus.ts";
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
    verdict === "correct" ? "is-correct" : "",
    verdict === "incorrect" ? "is-incorrect" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div class="sr" aria-live="polite">
        {live}
      </div>
      <main class="page">
        <section class="salon">
          <div class="copy">
            <h1 id="console-title">
              Name the{" "}
              <span
                class="inline-still"
                aria-hidden="true"
                style={{
                  backgroundImage: `url("${stillSrc(caseItem.still)}")`,
                  ...(inlineStillBackgroundPosition(caseItem)
                    ? { backgroundPosition: inlineStillBackgroundPosition(caseItem) }
                    : {}),
                  ...(inlineStillBackgroundSize(caseItem)
                    ? { backgroundSize: inlineStillBackgroundSize(caseItem) }
                    : {}),
                }}
              />{" "}
              watch
            </h1>
            <p class="lead">{caseItem.question}</p>
            <dl class="facts">
              <div>
                <dt>Source</dt>
                <dd>{caseItem.source}</dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{caseItem.subject}</dd>
              </div>
              <div>
                <dt>Frame</dt>
                <dd>{caseItem.frame}</dd>
              </div>
            </dl>
            <div class="options" role="group" aria-label="Choices">
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
              <label for="command">Watch name</label>
              <input
                id="command"
                name="command"
                autocomplete="off"
                spellcheck={false}
                aria-describedby="hint"
                value={guess}
                disabled={locked}
                onInput={(event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
                  setGuess(event.currentTarget.value);
                  clearFeedback();
                }}
              />
              <p class={hintClass} id="hint" role="status">
                {formError
                  ? formError
                  : verdict === "correct"
                    ? "Correct"
                    : verdict === "incorrect"
                      ? `Incorrect. ${hint}`
                      : null}
              </p>
              <button class="fire" type="submit" disabled={locked}>
                Confirm
              </button>
            </form>
            <p class="lamp">
              <span>Status</span> <output class={locked ? "status-lock" : undefined}>{status}</output>
            </p>
            <nav class="queue" aria-label="Case queue">
              <button type="button" onClick={() => go(-1)}>
                Previous
              </button>
              <p class="score">
                <span class="score-label">Identified</span>
                <data value={session?.identified ?? 0}>
                  {session?.identified ?? 0} / {session?.total ?? cases.length}
                </data>
              </p>
              <button type="button" onClick={() => go(1)}>
                Next
              </button>
            </nav>
          </div>
          <figure class="frame">
            <img src={stillSrc(caseItem.still)} alt={caseItem.stillAlt} width={1600} height={1066} />
          </figure>
        </section>

        {dossier ? (
          <section class="dossier is-open" aria-live="polite">
            <h2>{dossier.title}</h2>
            <p class="ref">
              Reference <data>{dossier.ref}</data>
            </p>
            <p class="history">{dossier.history}</p>
            <footer class="buys">
              <a href={dossier.buyNew} target="_blank" rel="noreferrer">
                Official catalogue
              </a>
              <a href={dossier.buyUsed} target="_blank" rel="noreferrer">
                Chrono24 market
              </a>
            </footer>
          </section>
        ) : null}
      </main>
    </>
  );
}
