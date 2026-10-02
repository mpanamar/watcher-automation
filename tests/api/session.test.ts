import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sessionResponseSchema } from "../../src/server/http-schemas";
import { startTestServer } from "./helpers";

describe("GET /api/session", () => {
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

  it("starts empty", async () => {
    const response = await fetch(`${url}/api/session`);
    const body = sessionResponseSchema.parse(await response.json());

    expect(response.status).toBe(200);
    expect(body).toEqual({ identified: 0, total: 3, locked: [], index: 0 });
  });
});
