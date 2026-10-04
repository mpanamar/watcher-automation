import { describe, expect, it } from "vitest";
import {
  DEFAULT_INLINE_STILL_X,
  DEFAULT_INLINE_STILL_Y,
  DEFAULT_INLINE_STILL_ZOOM,
  inlineStillBackgroundPosition,
  inlineStillBackgroundSize,
  inlineStillPreviewImgStyle,
} from "../../src/domain/inline-still-focus.ts";

describe("inlineStillBackgroundPosition", () => {
  it("returns undefined when crop is unset", () => {
    expect(inlineStillBackgroundPosition({})).toBeUndefined();
  });

  it("uses defaults when only one axis is set", () => {
    expect(inlineStillBackgroundPosition({ inlineStillX: 72 })).toBe(`72% ${DEFAULT_INLINE_STILL_Y}%`);
  });

  it("formats both axes", () => {
    expect(inlineStillBackgroundPosition({ inlineStillX: 72, inlineStillY: 58 })).toBe("72% 58%");
  });

  it("matches CSS default center 35%", () => {
    expect(DEFAULT_INLINE_STILL_X).toBe(50);
    expect(DEFAULT_INLINE_STILL_Y).toBe(35);
  });

  it("maps zoom to background-size percent", () => {
    expect(inlineStillBackgroundSize({ inlineStillZoom: 100 })).toBeUndefined();
    expect(inlineStillBackgroundSize({ inlineStillZoom: 180 })).toBe("180%");
  });

  it("preview img style scales from the focus point", () => {
    expect(inlineStillPreviewImgStyle({ inlineStillX: 70, inlineStillY: 60, inlineStillZoom: 150 })).toEqual({
      objectPosition: "70% 60%",
      transformOrigin: "70% 60%",
      transform: "scale(1.5)",
    });
    expect(inlineStillPreviewImgStyle({}).transform).toBeUndefined();
    expect(DEFAULT_INLINE_STILL_ZOOM).toBe(100);
  });
});
