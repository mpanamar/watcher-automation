import { describe, expect, it } from "vitest";
import { caseSchema, cases, getCaseById, publicCaseSchema } from "../../src/domain/cases";

describe("case catalog", () => {
  it("parses every case against the Zod schema", () => {
    expect(() => caseSchema.array().parse(cases)).not.toThrow();
    expect(cases).toHaveLength(3);
  });

  it("looks up a case by id", () => {
    expect(getCaseById("W-07")?.answer).toBe("Omega Seamaster Diver 300M");
    expect(getCaseById("missing")).toBeUndefined();
  });

  it("public schema drops answer, aliases, and hint", () => {
    const published = publicCaseSchema.parse(cases[0]);
    expect(published).not.toHaveProperty("answer");
    expect(published).not.toHaveProperty("aliases");
    expect(published).not.toHaveProperty("hint");
    expect(published.id).toBe("W-07");
  });
});
