import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { cases, getCaseById, toPublicCase } from "../domain/cases";
import { isMatch } from "../domain/ident";
import { createSession, isLocked, lockCase, score } from "../domain/session";
import {
  errorSchema,
  identBodySchema,
  identResponseSchema,
  publicCaseListSchema,
  sessionResponseSchema,
} from "./http-schemas";

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json(errorSchema.parse({ error: message }));
}

export function createApp(): Express {
  const app = express();
  let session = createSession();

  app.use(express.json());
  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (error instanceof SyntaxError) {
      sendError(res, 400, "Invalid JSON");
      return;
    }
    next(error);
  });

  app.get("/api/cases", (_req, res) => {
    res.json(publicCaseListSchema.parse(cases.map(toPublicCase)));
  });

  app.get("/api/cases/:id", (req, res) => {
    const item = getCaseById(req.params.id);
    if (!item) {
      sendError(res, 404, "Case not found");
      return;
    }
    res.json(toPublicCase(item));
  });

  app.post("/api/cases/:id/ident", (req, res) => {
    const item = getCaseById(req.params.id);
    if (!item) {
      sendError(res, 404, "Case not found");
      return;
    }

    const parsed = identBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, "Guess is required");
      return;
    }

    const alreadyIdentified = isLocked(session, item.id);
    if (alreadyIdentified || isMatch(parsed.data.guess, item)) {
      session = lockCase(session, item.id);
      res.json(
        identResponseSchema.parse({
          correct: true,
          alreadyIdentified,
          dossier: {
            id: item.id,
            title: item.title,
            ref: item.ref,
            history: item.history,
            buyNew: item.buyNew,
            buyUsed: item.buyUsed,
          },
        }),
      );
      return;
    }

    res.json(
      identResponseSchema.parse({
        correct: false,
        hint: item.hint,
      }),
    );
  });

  app.get("/api/session", (_req, res) => {
    const { identified, total } = score(session, cases.length);
    res.json(
      sessionResponseSchema.parse({
        identified,
        total,
        locked: [...session.locked],
        index: session.index,
      }),
    );
  });

  return app;
}
