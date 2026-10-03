import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSeedCaseById } from "../../src/server/seed-cases";
import { errorSchema, identResponseSchema } from "../../src/server/http-schemas";
import { hasSpoilerKeys, startTestServer } from "./helpers";

describe("POST /api/cases/:id/ident", () => {
  let url = "";
  let close = async (): Promise<void> => undefined;

  beforeEach(async () => {
    const server = await startTestServer();
    url = server.url;
    close = server.close;
  });

  afterEach(async () => {
    await close();
  });

  it("returns 404 for an unknown case", async () => {
    const response = await fetch(`${url}/api/cases/W-99/ident`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guess: "anything" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(errorSchema.parse(body).error).toBe("Case not found");
  });

  it("returns 400 when guess is missing or empty", async () => {
    const missing = await fetch(`${url}/api/cases/W-07/ident`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const empty = await fetch(`${url}/api/cases/W-07/ident`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guess: "   " }),
    });

    expect(missing.status).toBe(400);
    expect(empty.status).toBe(400);
    expect(errorSchema.parse(await missing.json()).error).toBe("Guess is required");
    expect(errorSchema.parse(await empty.json()).error).toBe("Guess is required");
  });

  it("returns 400 when guess is the wrong type", async () => {
    const response = await fetch(`${url}/api/cases/W-07/ident`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guess: 12 }),
    });

    expect(response.status).toBe(400);
    expect(errorSchema.parse(await response.json()).error).toBe("Guess is required");
  });

  it("locks the case on a correct guess and returns the dossier", async () => {
    const response = await fetch(`${url}/api/cases/W-07/ident`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guess: "SEAMASTER" }),
    });
    const body = identResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body.correct).toBe(true);
    if (body.correct) {
      expect(body.alreadyIdentified).toBe(false);
      expect(body.dossier.title).toBe("Omega Seamaster Diver 300M");
    }
    expect(hasSpoilerKeys(body)).toBe(false);

    const session = await fetch(`${url}/api/session`).then((res) => res.json());
    expect(session.identified).toBe(1);
    expect(session.locked).toEqual(["W-07"]);
  });

  it("is idempotent when the case is already identified", async () => {
    await fetch(`${url}/api/cases/W-07/ident`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guess: "SEAMASTER" }),
    });
    const response = await fetch(`${url}/api/cases/W-07/ident`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guess: "SEAMASTER" }),
    });
    const body = identResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body.correct).toBe(true);
    if (body.correct) expect(body.alreadyIdentified).toBe(true);
  });

  it("returns a hint without the full answer on a miss", async () => {
    const item = getSeedCaseById("W-07");
    if (!item) throw new Error("Missing W-07");

    const response = await fetch(`${url}/api/cases/W-07/ident`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guess: "Rolex Submariner Date" }),
    });
    const body = identResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body.correct).toBe(false);
    if (!body.correct) {
      expect(body.hint).toBe(item.hint);
      expect(body.hint.includes(item.answer)).toBe(false);
    }
    expect(body).not.toHaveProperty("dossier");
    expect(hasSpoilerKeys(body)).toBe(false);

    const session = await fetch(`${url}/api/session`).then((res) => res.json());
    expect(session.identified).toBe(0);
  });
});
