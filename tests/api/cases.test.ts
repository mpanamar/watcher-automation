import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { publicCaseSchema } from "../../src/domain/cases";
import { errorSchema, publicCaseListSchema } from "../../src/server/http-schemas";
import { hasSpoilerKeys, startTestServer } from "./helpers";

describe("GET /api/cases", () => {
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

  it("returns 200 and the public case list", async () => {
    const response = await fetch(`${url}/api/cases`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(publicCaseListSchema.parse(body)).toHaveLength(3);
    expect(hasSpoilerKeys(body)).toBe(false);
  });

  it("returns 200 for one case without spoilers", async () => {
    const response = await fetch(`${url}/api/cases/W-07`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(publicCaseSchema.parse(body).id).toBe("W-07");
    expect(hasSpoilerKeys(body)).toBe(false);
    expect(body).not.toHaveProperty("hint");
  });

  it("returns 404 for an unknown id", async () => {
    const response = await fetch(`${url}/api/cases/W-99`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(errorSchema.parse(body).error).toBe("Case not found");
  });
});
