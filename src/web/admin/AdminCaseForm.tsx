import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { adminStillPublicUrl, fetchAdminCaseRecord, saveAdminCase } from "./admin-cases.ts";
import { AdminNotAdmin } from "./AdminNotAdmin.tsx";
import {
  canAttemptSave,
  emptyCaseForm,
  parseCaseForm,
  watchCaseToFormState,
  type CaseFormState,
} from "./case-form-state.ts";
import { AdminHeadlineCropEditor } from "./AdminHeadlineCropEditor.tsx";
import { useAdminGate } from "./useAdminGate.ts";

type Props = { id?: string; path?: string };

export function AdminCaseForm(props: Props) {
  const gate = useAdminGate();
  const caseId = props.id ?? "new";
  const isNew = caseId === "new";
  const [form, setForm] = useState<CaseFormState>(() => {
    const base = emptyCaseForm();
    if (!isNew) base.id = caseId;
    return base;
  });
  const [stillPreview, setStillPreview] = useState("");
  const [stillFile, setStillFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [loadingCase, setLoadingCase] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (gate.status === "anonymous" || gate.status === "unconfigured") {
      route("/admin/login", true);
    }
  }, [gate.status]);

  useEffect(() => {
    if (isNew || gate.status !== "authenticated") return;
    setLoadingCase(true);
    fetchAdminCaseRecord(caseId)
      .then((record) => {
        if (!record) {
          setFormError("Case not found");
          return;
        }
        setForm(watchCaseToFormState(record.item, record.published));
        setStillPreview(adminStillPublicUrl(record.item.still));
      })
      .catch((reason: unknown) => {
        setFormError(reason instanceof Error ? reason.message : "Could not load case");
      })
      .finally(() => setLoadingCase(false));
  }, [caseId, isNew, gate.status]);

  if (gate.status === "loading") {
    return <p class="load-error">Loading…</p>;
  }

  if (gate.status === "anonymous" || gate.status === "unconfigured") {
    return null;
  }

  if (gate.status === "not_admin") {
    return <AdminNotAdmin email={gate.email} />;
  }

  if (loadingCase) {
    return <p class="load-error">Loading case…</p>;
  }

  function patch(partial: Partial<CaseFormState>) {
    setForm((current) => ({ ...current, ...partial }));
    setSavedNotice("");
  }

  function setOption(index: number, field: "key" | "label", value: string) {
    setForm((current) => {
      const options = current.options.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      );
      return { ...current, options };
    });
    setSavedNotice("");
  }

  function addOption() {
    setForm((current) => ({
      ...current,
      options: [...current.options, { key: String.fromCharCode(65 + current.options.length), label: "" }],
    }));
  }

  function removeOption(index: number) {
    setForm((current) => ({
      ...current,
      options: current.options.filter((_, i) => i !== index),
    }));
    setSavedNotice("");
  }

  function setAlias(index: number, value: string) {
    setForm((current) => {
      const aliases = [...current.aliases];
      aliases[index] = value;
      return { ...current, aliases };
    });
    setSavedNotice("");
  }

  function addAlias() {
    setForm((current) => ({ ...current, aliases: [...current.aliases, ""] }));
  }

  function removeAlias(index: number) {
    setForm((current) => ({
      ...current,
      aliases: current.aliases.filter((_, i) => i !== index),
    }));
    setSavedNotice("");
  }

  function onStillFile(event: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setStillFile(file);
    setStillPreview(URL.createObjectURL(file));
    const basename = file.name.replace(/^.*[/\\]/, "");
    if (form.id.trim()) {
      patch({ still: `${form.id.trim()}/${basename}` });
    }
  }

  async function submit(event: JSX.TargetedEvent<HTMLFormElement, Event>) {
    event.preventDefault();
    setFormError("");
    setSavedNotice("");
    if (!canAttemptSave(form, isNew)) {
      setFormError("Add a case id, question, and at least two options before saving.");
      return;
    }
    const basename = stillFile?.name.replace(/^.*[/\\]/, "") ?? "";
    const formForParse =
      stillFile && form.id.trim() && !form.still.trim()
        ? { ...form, still: `${form.id.trim()}/${basename}` }
        : form;
    const parsed = parseCaseForm(formForParse);
    if (!parsed.ok) {
      setFormError(parsed.message);
      return;
    }
    if (isNew && !stillFile) {
      setFormError("Upload a still image for a new case.");
      return;
    }

    setSaving(true);
    try {
      await saveAdminCase(parsed.data, {
        published: form.published,
        isNew,
        stillFile,
      });
      setSavedNotice("Saved");
      route("/admin");
    } catch (reason: unknown) {
      setFormError(reason instanceof Error ? reason.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const saveDisabled = !canAttemptSave(form, isNew) || saving;
  const headlineStillSrc =
    stillPreview || (form.still.trim() ? adminStillPublicUrl(form.still) : "");

  return (
    <main class="page admin-page">
      <section class="admin-panel">
        <div class="admin-head">
          <div>
            <h1 class="admin-title">{isNew ? "New case" : `Edit ${caseId}`}</h1>
            <p class="admin-lead">Fields mirror the domain case schema.</p>
          </div>
          <button type="button" class="admin-ghost" onClick={() => route("/admin")}>
            Back to list
          </button>
        </div>

        <form class="admin-form admin-form--wide" onSubmit={(event) => void submit(event)} noValidate>
          <div class="admin-form-grid">
            <label class="admin-field">
              <span>Case id</span>
              <input
                value={form.id}
                disabled={!isNew}
                onInput={(e) => patch({ id: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="admin-field admin-field--check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => patch({ published: (e.target as HTMLInputElement).checked })}
              />
              <span>Published</span>
            </label>
          </div>

          <label class="admin-field">
            <span>Still image</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onStillFile} />
          </label>
          {stillPreview || form.still ? (
            <figure class="admin-still-preview">
              <img
                src={stillPreview || adminStillPublicUrl(form.still)}
                alt=""
              />
            </figure>
          ) : null}
          <label class="admin-field">
            <span>Still alt text</span>
            <input value={form.stillAlt} onInput={(e) => patch({ stillAlt: (e.target as HTMLInputElement).value })} />
          </label>

          <fieldset class="admin-fieldset">
            <legend>Headline crop</legend>
            <p class="admin-field-hint">
              Adjusts the pill in “Name the … watch”. Higher horizontal moves focus right (toward the wrist on
              many stills).
            </p>
            {headlineStillSrc ? (
              <AdminHeadlineCropEditor
                stillSrc={headlineStillSrc}
                x={form.inlineStillX}
                y={form.inlineStillY}
                zoom={form.inlineStillZoom}
                onChange={(next) => patch(next)}
              />
            ) : (
              <p class="admin-field-hint">Upload a still to preview the headline crop.</p>
            )}
          </fieldset>

          <div class="admin-form-grid">
            <label class="admin-field">
              <span>Source</span>
              <input value={form.source} onInput={(e) => patch({ source: (e.target as HTMLInputElement).value })} />
            </label>
            <label class="admin-field">
              <span>Subject</span>
              <input value={form.subject} onInput={(e) => patch({ subject: (e.target as HTMLInputElement).value })} />
            </label>
            <label class="admin-field">
              <span>Frame</span>
              <input value={form.frame} onInput={(e) => patch({ frame: (e.target as HTMLInputElement).value })} />
            </label>
          </div>

          <label class="admin-field">
            <span>Question</span>
            <textarea
              rows={2}
              value={form.question}
              onInput={(e) => patch({ question: (e.target as HTMLTextAreaElement).value })}
            />
          </label>

          <fieldset class="admin-fieldset">
            <legend>Options</legend>
            {form.options.map((opt, index) => (
              <div class="admin-option-row" key={`${index}-${opt.key}`}>
                <input
                  aria-label={`Option ${index + 1} key`}
                  value={opt.key}
                  onInput={(e) => setOption(index, "key", (e.target as HTMLInputElement).value)}
                />
                <input
                  aria-label={`Option ${index + 1} label`}
                  value={opt.label}
                  onInput={(e) => setOption(index, "label", (e.target as HTMLInputElement).value)}
                />
                <button type="button" class="admin-ghost" disabled={form.options.length <= 2} onClick={() => removeOption(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" class="admin-ghost" onClick={addOption}>
              Add option
            </button>
          </fieldset>

          <label class="admin-field">
            <span>Answer</span>
            <input value={form.answer} onInput={(e) => patch({ answer: (e.target as HTMLInputElement).value })} />
          </label>

          <fieldset class="admin-fieldset">
            <legend>Aliases</legend>
            {form.aliases.map((alias, index) => (
              <div class="admin-option-row" key={index}>
                <input
                  aria-label={`Alias ${index + 1}`}
                  value={alias}
                  onInput={(e) => setAlias(index, (e.target as HTMLInputElement).value)}
                />
                <button type="button" class="admin-ghost" disabled={form.aliases.length <= 1} onClick={() => removeAlias(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" class="admin-ghost" onClick={addAlias}>
              Add alias
            </button>
          </fieldset>

          <label class="admin-field">
            <span>Hint</span>
            <textarea rows={3} value={form.hint} onInput={(e) => patch({ hint: (e.target as HTMLTextAreaElement).value })} />
          </label>

          <div class="admin-form-grid">
            <label class="admin-field">
              <span>Dossier title</span>
              <input value={form.title} onInput={(e) => patch({ title: (e.target as HTMLInputElement).value })} />
            </label>
            <label class="admin-field">
              <span>Reference</span>
              <input value={form.ref} onInput={(e) => patch({ ref: (e.target as HTMLInputElement).value })} />
            </label>
          </div>

          <label class="admin-field">
            <span>History</span>
            <textarea rows={4} value={form.history} onInput={(e) => patch({ history: (e.target as HTMLTextAreaElement).value })} />
          </label>

          <div class="admin-form-grid">
            <label class="admin-field">
              <span>Buy new URL</span>
              <input value={form.buyNew} onInput={(e) => patch({ buyNew: (e.target as HTMLInputElement).value })} />
            </label>
            <label class="admin-field">
              <span>Buy used URL</span>
              <input value={form.buyUsed} onInput={(e) => patch({ buyUsed: (e.target as HTMLInputElement).value })} />
            </label>
          </div>

          {formError ? (
            <p class="admin-error" role="alert">
              {formError}
            </p>
          ) : null}
          {savedNotice ? <p class="admin-success">{savedNotice}</p> : null}

          <div class="admin-form-actions">
            <button type="submit" class="fire" disabled={saveDisabled}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" class="admin-ghost" onClick={() => route("/admin")}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
