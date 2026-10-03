import { describe, expect, it } from "vitest";
import { isMatch, normalize } from "../../src/domain/ident";
import { getSeedCaseById } from "../../src/server/seed-cases";

const seamaster = getSeedCaseById("W-07");
const monaco = getSeedCaseById("W-11");
const speedmaster = getSeedCaseById("W-19");

if (!seamaster || !monaco || !speedmaster) {
  throw new Error("Catalog is missing expected cases.");
}

describe("normalize", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalize("Omega Seamaster Diver 300M!")).toBe("omega seamaster diver 300m");
  });
});

describe("isMatch", () => {
  describe("Seamaster", () => {
    it("accepts the exact model name", () => {
      expect(isMatch("Omega Seamaster Diver 300M", seamaster)).toBe(true);
    });

    it("accepts an alias without regard to case", () => {
      expect(isMatch("SEAMASTER", seamaster)).toBe(true);
    });

    it("accepts an alias with extra punctuation", () => {
      expect(isMatch("omega-seamaster!!!", seamaster)).toBe(true);
    });

    it("rejects an empty string and whitespace", () => {
      expect(isMatch("", seamaster)).toBe(false);
      expect(isMatch("   ", seamaster)).toBe(false);
    });

    it("rejects a different model", () => {
      expect(isMatch("Rolex Submariner Date", seamaster)).toBe(false);
    });
  });

  describe("Monaco", () => {
    it("accepts the exact model name", () => {
      expect(isMatch("TAG Heuer Monaco", monaco)).toBe(true);
    });

    it("accepts an alias without regard to case", () => {
      expect(isMatch("HEUER MONACO", monaco)).toBe(true);
    });

    it("accepts an alias with extra punctuation", () => {
      expect(isMatch("monaco, calibre 11", monaco)).toBe(true);
    });

    it("rejects an empty string and whitespace", () => {
      expect(isMatch("", monaco)).toBe(false);
      expect(isMatch("   ", monaco)).toBe(false);
    });

    it("rejects a different model", () => {
      expect(isMatch("Rolex Daytona", monaco)).toBe(false);
    });
  });

  describe("Speedmaster", () => {
    it("accepts the exact model name", () => {
      expect(isMatch("Omega Speedmaster Professional", speedmaster)).toBe(true);
    });

    it("accepts an alias without regard to case", () => {
      expect(isMatch("MOONWATCH", speedmaster)).toBe(true);
    });

    it("accepts an alias with extra punctuation", () => {
      expect(isMatch("speedmaster...", speedmaster)).toBe(true);
    });

    it("rejects an empty string and whitespace", () => {
      expect(isMatch("", speedmaster)).toBe(false);
      expect(isMatch("   ", speedmaster)).toBe(false);
    });

    it("rejects a different model", () => {
      expect(isMatch("Breitling Navitimer", speedmaster)).toBe(false);
    });
  });
});
