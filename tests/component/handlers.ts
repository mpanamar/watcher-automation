import { http, HttpResponse } from "msw";
import { toPublicCase } from "../../src/domain/cases";
import { isMatch } from "../../src/domain/ident";
import { getSeedCaseById, seedCases } from "../../src/server/seed-cases";
import { resolveStillForPublic } from "../../src/server/still-url";

const locked = new Set<string>();

function withResolvedStill<T extends { still: string }>(item: T): T {
  return { ...item, still: resolveStillForPublic(item.still, "seed") };
}

function publicSeedList() {
  return seedCases.map((item) => toPublicCase(withResolvedStill(item)));
}

export function resetIdentified(): void {
  locked.clear();
}

function dossierOf(id: string) {
  const item = getSeedCaseById(id);
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
    return HttpResponse.json(publicSeedList());
  }),
  http.get("*/api/cases/:id", ({ params }) => {
    const item = getSeedCaseById(String(params.id));
    if (!item) return HttpResponse.json({ error: "Case not found" }, { status: 404 });
    return HttpResponse.json(toPublicCase(withResolvedStill(item)));
  }),
  http.get("*/api/session", () => {
    return HttpResponse.json({
      identified: locked.size,
      total: seedCases.length,
      locked: [...locked],
      index: 0,
    });
  }),
  http.post("*/api/cases/:id/ident", async ({ params, request }) => {
    const id = String(params.id);
    const item = getSeedCaseById(id);
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
