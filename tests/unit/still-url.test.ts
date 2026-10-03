import { describe, expect, it } from "vitest";
import { resolveStillForPublic } from "../../src/server/still-url";

describe("resolveStillForPublic", () => {
  it("prefixes seed still paths with a leading slash", () => {
    expect(resolveStillForPublic("stills/still-01-casino.png", "seed")).toBe("/stills/still-01-casino.png");
  });

  it("leaves absolute URLs unchanged", () => {
    const url = "https://cdn.example.com/stills/a.png";
    expect(resolveStillForPublic(url, "seed")).toBe(url);
    expect(resolveStillForPublic(url, "storage")).toBe(url);
  });

  it("builds a Supabase public object URL for storage keys", () => {
    expect(resolveStillForPublic("W-07/still.png", "storage", "https://abc.supabase.co")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/stills/W-07/still.png",
    );
  });
});
