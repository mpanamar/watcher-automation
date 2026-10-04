import { describe, expect, it } from "vitest";
import { describeCaseFormField, formatCaseFormValidationError } from "../../src/web/admin/case-form-state.ts";

describe("case form validation labels", () => {
  it("maps top-level fields to form labels", () => {
    expect(describeCaseFormField(["answer"])).toBe("Answer");
    expect(describeCaseFormField(["stillAlt"])).toBe("Still alt text");
  });

  it("includes row numbers for options and aliases", () => {
    expect(describeCaseFormField(["options", 2, "label"])).toBe("Options → row 3 → label");
    expect(describeCaseFormField(["aliases", 0])).toBe("Aliases → Alias 1");
  });

  it("formats a full message", () => {
    expect(
      formatCaseFormValidationError({
        path: ["answer"],
        message: "Too small: expected string to have >=1 characters",
      }),
    ).toBe("Answer: Too small: expected string to have >=1 characters");
  });
});
