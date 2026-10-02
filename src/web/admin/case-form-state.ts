import { caseSchema, type WatchCase } from "../../domain/cases.ts";

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
  };
}

export function canAttemptSave(form: CaseFormState): boolean {
  if (!form.question.trim()) return false;
  const filledOptions = form.options.filter((o) => o.label.trim());
  return filledOptions.length >= 2;
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
    aliases,
    options,
  };

  const result = caseSchema.safeParse(candidate);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, message: first?.message ?? "Invalid case" };
  }
  return { ok: true, data: result.data };
}
