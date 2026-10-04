import { describe, expect, it } from "vitest";
import { caseSchema, publicCaseSchema, toPublicCase } from "../../src/domain/cases";
import { seedCases } from "../../src/server/seed-cases";
import { resolveStillForPublic } from "../../src/server/still-url";

describe("case catalog schema", () => {
  it("parses every seed case against the Zod schema", () => {
    expect(() => caseSchema.array().parse(seedCases)).not.toThrow();
    expect(seedCases).toHaveLength(5);
  });

  it("public schema drops answer, aliases, and hint", () => {
    const published = publicCaseSchema.parse(seedCases[0]);
    expect(published).not.toHaveProperty("answer");
    expect(published).not.toHaveProperty("aliases");
    expect(published).not.toHaveProperty("hint");
    expect(published.id).toBe("W-07");
  });

  it("toPublicCase keeps resolved still paths", () => {
    const item = {
      ...seedCases[0],
      still: resolveStillForPublic(seedCases[0].still, "seed"),
    };
    expect(toPublicCase(item).still).toBe("/stills/still-01-casino.png");
  });

  it("toPublicCase accepts Supabase public still URLs", () => {
    const item = {
      ...seedCases[0],
      still: resolveStillForPublic("W-99/still.png", "storage", "https://abc.supabase.co"),
    };
    expect(toPublicCase(item).still).toContain("supabase.co/storage/v1/object/public/stills/");
  });

  it("rejects aliases shorter than 3 characters", () => {
    const candidate = { ...seedCases[0], aliases: ["ab"] };
    expect(caseSchema.safeParse(candidate).success).toBe(false);
  });

  it("rejects still keys with quotes or path traversal", () => {
    expect(caseSchema.safeParse({ ...seedCases[0], still: 'W-07/"bad".png' }).success).toBe(false);
    expect(caseSchema.safeParse({ ...seedCases[0], still: "W-07/../x.png" }).success).toBe(false);
  });
});
