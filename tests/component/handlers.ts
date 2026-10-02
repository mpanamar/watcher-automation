import { http, HttpResponse } from "msw";
import { cases, getCaseById, toPublicCase } from "../../src/domain/cases";
import { isMatch } from "../../src/domain/ident";

const locked = new Set<string>();

export function resetIdentified(): void {
  locked.clear();
}

function dossierOf(id: string) {
  const item = getCaseById(id);
  if (!item) return null;
  return {
    id: item.id,
    title: item.title,
    ref: item.ref,
    history: item.history,
    buyNew: item.buyNew,
    buyUsed: item.buyUsed,
  };
}

export const handlers = [
  http.get("*/api/cases", () => {
    return HttpResponse.json(cases.map(toPublicCase));
  }),
  http.get("*/api/cases/:id", ({ params }) => {
    const item = getCaseById(String(params.id));
    if (!item) return HttpResponse.json({ error: "Case not found" }, { status: 404 });
    return HttpResponse.json(toPublicCase(item));
  }),
  http.get("*/api/session", () => {
    return HttpResponse.json({
      identified: locked.size,
      total: cases.length,
      locked: [...locked],
      index: 0,
    });
  }),
  http.post("*/api/cases/:id/ident", async ({ params, request }) => {
    const id = String(params.id);
    const item = getCaseById(id);
    if (!item) return HttpResponse.json({ error: "Case not found" }, { status: 404 });

    const body = (await request.json()) as { guess?: unknown };
    if (typeof body.guess !== "string" || !body.guess.trim()) {
      return HttpResponse.json({ error: "Guess is required" }, { status: 400 });
    }

    const alreadyIdentified = locked.has(id);
    if (alreadyIdentified || isMatch(body.guess, item)) {
      locked.add(id);
      return HttpResponse.json({
        correct: true,
        alreadyIdentified,
        dossier: dossierOf(id),
      });
    }

    return HttpResponse.json({
      correct: false,
      hint: item.hint,
    });
  }),
];
