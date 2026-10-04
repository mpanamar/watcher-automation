import { caseSchema, type WatchCase } from "../../domain/cases.ts";
import {
  DEFAULT_INLINE_STILL_X,
  DEFAULT_INLINE_STILL_Y,
  DEFAULT_INLINE_STILL_ZOOM,
} from "../../domain/inline-still-focus.ts";

export type CaseFormState = {
  id: string;
  still: string;
  stillAlt: string;
  source: string;
  subject: string;
  frame: string;
  question: string;
  options: { key: string; label: string }[];
  answer: string;
  aliases: string[];
  hint: string;
  title: string;
  ref: string;
  history: string;
  buyNew: string;
  buyUsed: string;
  published: boolean;
  inlineStillX: number;
  inlineStillY: number;
  inlineStillZoom: number;
};

export function emptyCaseForm(): CaseFormState {
  return {
    id: "",
    still: "",
    stillAlt: "",
    source: "",
    subject: "",
    frame: "",
    question: "",
    options: [
      { key: "A", label: "" },
      { key: "B", label: "" },
    ],
    answer: "",
    aliases: [""],
    hint: "",
    title: "",
    ref: "",
    history: "",
    buyNew: "",
    buyUsed: "",
    published: false,
    inlineStillX: DEFAULT_INLINE_STILL_X,
    inlineStillY: DEFAULT_INLINE_STILL_Y,
    inlineStillZoom: DEFAULT_INLINE_STILL_ZOOM,
  };
}

export function canAttemptSave(form: CaseFormState, isNew: boolean): boolean {
  if (isNew && !form.id.trim()) return false;
  if (!form.question.trim()) return false;
  const filledOptions = form.options.filter((o) => o.label.trim());
  return filledOptions.length >= 2;
}

export function watchCaseToFormState(item: WatchCase, published: boolean): CaseFormState {
  return {
    id: item.id,
    still: item.still,
    stillAlt: item.stillAlt,
    source: item.source,
    subject: item.subject,
    frame: item.frame,
    question: item.question,
    options: item.options.map((row) => ({ ...row })),
    answer: item.answer,
    aliases: [...item.aliases],
    hint: item.hint,
    title: item.title,
    ref: item.ref,
    history: item.history,
    buyNew: item.buyNew,
    buyUsed: item.buyUsed,
    published,
    inlineStillX: item.inlineStillX ?? DEFAULT_INLINE_STILL_X,
    inlineStillY: item.inlineStillY ?? DEFAULT_INLINE_STILL_Y,
    inlineStillZoom: item.inlineStillZoom ?? DEFAULT_INLINE_STILL_ZOOM,
  };
}

/** Maps Zod issue paths to the same labels as the admin form (including row numbers). */
export function describeCaseFormField(path: (string | number)[]): string {
  if (path.length === 0) return "Case";

  const head = String(path[0]);

  if (head === "options" && path.length >= 2 && typeof path[1] === "number") {
    const row = path[1] + 1;
    if (path[2] === "key") return `Options → row ${row} → key (letter)`;
    if (path[2] === "label") return `Options → row ${row} → label`;
    return `Options → row ${row}`;
  }

  if (head === "aliases") {
    if (path.length >= 2 && typeof path[1] === "number") return `Aliases → Alias ${path[1] + 1}`;
    return "Aliases";
  }

  const labels: Record<string, string> = {
    id: "Case id",
    still: "Still image (upload or storage key)",
    stillAlt: "Still alt text",
    source: "Source",
    subject: "Subject",
    frame: "Frame",
    question: "Question",
    answer: "Answer",
    hint: "Hint",
    title: "Dossier title",
    ref: "Reference",
    history: "History",
    buyNew: "Buy new URL",
    buyUsed: "Buy used URL",
    inlineStillX: "Headline crop → horizontal",
    inlineStillY: "Headline crop → vertical",
    inlineStillZoom: "Headline crop → zoom",
  };

  return labels[head] ?? head;
}

export function formatCaseFormValidationError(issue: { path: (string | number)[]; message: string }): string {
  return `${describeCaseFormField(issue.path)}: ${issue.message}`;
}

export function parseCaseForm(form: CaseFormState): { ok: true; data: WatchCase } | { ok: false; message: string } {
  const aliases = form.aliases.map((a) => a.trim()).filter(Boolean);
  const options = form.options
    .map((o) => ({ key: o.key.trim(), label: o.label.trim() }))
    .filter((o) => o.key && o.label);

  const candidate = {
    ...form,
    id: form.id.trim(),
    still: form.still.trim(),
    stillAlt: form.stillAlt.trim(),
    source: form.source.trim(),
    subject: form.subject.trim(),
    frame: form.frame.trim(),
    question: form.question.trim(),
    answer: form.answer.trim(),
    hint: form.hint.trim(),
    title: form.title.trim(),
    ref: form.ref.trim(),
    history: form.history.trim(),
    buyNew: form.buyNew.trim(),
    buyUsed: form.buyUsed.trim(),
    inlineStillX: form.inlineStillX === DEFAULT_INLINE_STILL_X ? undefined : form.inlineStillX,
    inlineStillY: form.inlineStillY === DEFAULT_INLINE_STILL_Y ? undefined : form.inlineStillY,
    inlineStillZoom: form.inlineStillZoom === DEFAULT_INLINE_STILL_ZOOM ? undefined : form.inlineStillZoom,
    aliases,
    options,
  };

  const result = caseSchema.safeParse(candidate);
  if (!result.success) {
    const first = result.error.issues[0];
    if (!first) return { ok: false, message: "Invalid case" };
    return { ok: false, message: formatCaseFormValidationError(first) };
  }
  return { ok: true, data: result.data };
}
