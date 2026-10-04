/** Default matches `.inline-still { background-position: center 35%; }` in styles.css */
export const DEFAULT_INLINE_STILL_X = 50;
export const DEFAULT_INLINE_STILL_Y = 35;
/** 100 = baseline (`cover` / scale 1). */
export const DEFAULT_INLINE_STILL_ZOOM = 100;
export const MIN_INLINE_STILL_ZOOM = 100;
export const MAX_INLINE_STILL_ZOOM = 280;

export type InlineStillFocus = {
  inlineStillX?: number;
  inlineStillY?: number;
  inlineStillZoom?: number;
};

export function inlineStillFocusXY(item: InlineStillFocus): { x: number; y: number } {
  return {
    x: item.inlineStillX ?? DEFAULT_INLINE_STILL_X,
    y: item.inlineStillY ?? DEFAULT_INLINE_STILL_Y,
  };
}

export function inlineStillFocusCss(item: InlineStillFocus): string | undefined {
  if (
    item.inlineStillX === undefined &&
    item.inlineStillY === undefined &&
    (item.inlineStillZoom === undefined || item.inlineStillZoom === DEFAULT_INLINE_STILL_ZOOM)
  ) {
    return undefined;
  }
  const { x, y } = inlineStillFocusXY(item);
  return `${x}% ${y}%`;
}

export function inlineStillZoomScale(zoom?: number): number {
  const value = zoom ?? DEFAULT_INLINE_STILL_ZOOM;
  return value / 100;
}

/** CSS `background-position` for `.inline-still` (headline pill). */
export function inlineStillBackgroundPosition(item: InlineStillFocus): string | undefined {
  return inlineStillFocusCss(item);
}

/** Larger % zooms in (100 = default cover). */
export function inlineStillBackgroundSize(item: InlineStillFocus): string | undefined {
  const zoom = item.inlineStillZoom ?? DEFAULT_INLINE_STILL_ZOOM;
  if (zoom === DEFAULT_INLINE_STILL_ZOOM) return undefined;
  return `${zoom}%`;
}

/** Admin preview `<img>`: pan + zoom from the focus point. */
export function inlineStillPreviewImgStyle(item: InlineStillFocus): {
  objectPosition: string;
  transform?: string;
  transformOrigin: string;
} {
  const { x, y } = inlineStillFocusXY(item);
  const scale = inlineStillZoomScale(item.inlineStillZoom);
  return {
    objectPosition: `${x}% ${y}%`,
    transformOrigin: `${x}% ${y}%`,
    ...(scale !== 1 ? { transform: `scale(${scale})` } : {}),
  };
}
