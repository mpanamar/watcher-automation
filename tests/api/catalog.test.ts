import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { toPublicCase } from "../../src/domain/cases";
import { createApp } from "../../src/server/app";
import { CatalogUnavailableError, type Catalog } from "../../src/server/catalog";
import { resolveStillForPublic } from "../../src/server/still-url";
import { seedCases } from "../../src/server/seed-cases";
import { hasSpoilerKeys, startTestServer } from "./helpers";

function failingCatalog(): Catalog {
  return {
    mode: "storage",
    async list() {
      throw new CatalogUnavailableError("down");
    },
    async get() {
      throw new CatalogUnavailableError("down");
    },
  };
}

function mutableCatalog(): { catalog: Catalog; publish: (id: string) => void } {
  const published = new Set(seedCases.slice(0, 2).map((item) => item.id));

  const catalog: Catalog = {
    mode: "seed",
    async list() {
      return seedCases
        .filter((item) => published.has(item.id))
        .map((item) => ({ ...item, still: resolveStillForPublic(item.still, "seed") }));
    },
    async get(id: string) {
      if (!published.has(id)) return undefined;
      const item = seedCases.find((row) => row.id === id);
      return item ? { ...item, still: resolveStillForPublic(item.still, "seed") } : undefined;
    },
  };

  return {
    catalog,
    publish(id: string) {
      published.add(id);
    },
  };
}

describe("catalog port", () => {
  describe("Supabase failure", () => {
    let url = "";
    let close = async (): Promise<void> => undefined;

    beforeEach(async () => {
      const server = await startTestServer(createApp(failingCatalog()));
      url = server.url;
      close = server.close;
    });

    afterEach(async () => {
      await close();
    });

    it("returns 503 without seed cases in the body", async () => {
      const response = await fetch(`${url}/api/cases`);
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body).toEqual({ error: "Catalog unavailable" });
      expect(JSON.stringify(body)).not.toContain("W-07");
      expect(hasSpoilerKeys(body)).toBe(false);
    });
  });

  describe("fresh reads", () => {
    let url = "";
    let close = async (): Promise<void> => undefined;
    let publish = (_id: string): void => undefined;

    beforeEach(async () => {
      const setup = mutableCatalog();
      publish = setup.publish;
      const server = await startTestServer(createApp(setup.catalog));
      url = server.url;
      close = server.close;
    });

    afterEach(async () => {
      await close();
    });

    it("reflects newly published cases on the next GET", async () => {
      const first = await fetch(`${url}/api/cases`).then((res) => res.json());
      expect(first).toHaveLength(2);
      expect(hasSpoilerKeys(first)).toBe(false);

      publish("W-19");

      const second = await fetch(`${url}/api/cases`).then((res) => res.json());
      expect(second).toHaveLength(3);
      expect(toPublicCase(seedCases[2]).id).toBe("W-19");
      expect(second.some((row: { id: string }) => row.id === "W-19")).toBe(true);
    });
  });
});
