import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { toPublicCase } from "../domain/cases.ts";
import { isMatch } from "../domain/ident.ts";
import { createSession, isLocked, lockCase, pruneLocked, score } from "../domain/session.ts";
import { CatalogUnavailableError, createSeedCatalog, type Catalog } from "./catalog.ts";
import {
  errorSchema,
  identBodySchema,
  identResponseSchema,
  publicCaseListSchema,
  sessionResponseSchema,
} from "./http-schemas.ts";

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json(errorSchema.parse({ error: message }));
}

async function loadCatalogList(catalog: Catalog) {
  try {
    return await catalog.list();
  } catch (error) {
    if (error instanceof CatalogUnavailableError) throw error;
    throw new CatalogUnavailableError(error instanceof Error ? error.message : "Catalog unavailable");
  }
}

async function loadCatalogCase(catalog: Catalog, id: string) {
  try {
    return await catalog.get(id);
  } catch (error) {
    if (error instanceof CatalogUnavailableError) throw error;
    throw new CatalogUnavailableError(error instanceof Error ? error.message : "Catalog unavailable");
  }
}

function handleCatalogError(res: Response, error: unknown): boolean {
  if (error instanceof CatalogUnavailableError) {
    sendError(res, 503, "Catalog unavailable");
    return true;
  }
  return false;
}

export function createApp(catalog: Catalog = createSeedCatalog()): Express {
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

  app.get("/api/cases", async (_req, res) => {
    try {
      const list = await loadCatalogList(catalog);
      const validIds = new Set(list.map((item) => item.id));
      session = pruneLocked(session, validIds);
      res.json(publicCaseListSchema.parse(list.map(toPublicCase)));
    } catch (error) {
      if (handleCatalogError(res, error)) return;
      throw error;
    }
  });

  app.get("/api/cases/:id", async (req, res) => {
    try {
      const item = await loadCatalogCase(catalog, req.params.id);
      if (!item) {
        sendError(res, 404, "Case not found");
        return;
      }
      res.json(toPublicCase(item));
    } catch (error) {
      if (handleCatalogError(res, error)) return;
      throw error;
    }
  });

  app.post("/api/cases/:id/ident", async (req, res) => {
    try {
      const item = await loadCatalogCase(catalog, req.params.id);
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
    } catch (error) {
      if (handleCatalogError(res, error)) return;
      throw error;
    }
  });

  app.get("/api/session", async (_req, res) => {
    try {
      const list = await loadCatalogList(catalog);
      const validIds = new Set(list.map((item) => item.id));
      session = pruneLocked(session, validIds);
      const { identified, total } = score(session, list.length);
      res.json(
        sessionResponseSchema.parse({
          identified,
          total,
          locked: [...session.locked],
          index: session.index,
        }),
      );
    } catch (error) {
      if (handleCatalogError(res, error)) return;
      throw error;
    }
  });

  return app;
}
