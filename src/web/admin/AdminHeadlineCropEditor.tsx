import type { JSX } from "preact";
import {
  DEFAULT_INLINE_STILL_X,
  DEFAULT_INLINE_STILL_Y,
  DEFAULT_INLINE_STILL_ZOOM,
  MAX_INLINE_STILL_ZOOM,
  MIN_INLINE_STILL_ZOOM,
  inlineStillPreviewImgStyle,
} from "../../domain/inline-still-focus.ts";

type Props = {
  stillSrc: string;
  x: number;
  y: number;
  zoom: number;
  onChange: (next: { inlineStillX?: number; inlineStillY?: number; inlineStillZoom?: number }) => void;
};

export function AdminHeadlineCropEditor({ stillSrc, x, y, zoom, onChange }: Props) {
  const imgStyle = inlineStillPreviewImgStyle({
    inlineStillX: x,
    inlineStillY: y,
    inlineStillZoom: zoom,
  });

  function onAxisInput(axis: "x" | "y" | "zoom", event: JSX.TargetedEvent<HTMLInputElement, Event>) {
    const value = Number(event.currentTarget.value);
    if (axis === "x") onChange({ inlineStillX: value });
    else if (axis === "y") onChange({ inlineStillY: value });
    else onChange({ inlineStillZoom: value });
  }

  return (
    <div class="admin-crop-editor">
      <div class="admin-crop-stage" aria-hidden="true">
        <img src={stillSrc} alt="" class="admin-crop-stage-img" style={imgStyle} />
      </div>

      <p class="admin-headline-preview" aria-hidden="true">
        Name the{" "}
        <span class="admin-crop-pill">
          <img src={stillSrc} alt="" class="admin-crop-pill-img" style={imgStyle} />
        </span>{" "}
        watch
      </p>

      <label class="admin-field">
        <span>
          Horizontal <data value={x}>{x}%</data>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={x}
          onInput={(e) => onAxisInput("x", e)}
          onChange={(e) => onAxisInput("x", e)}
        />
      </label>
      <label class="admin-field">
        <span>
          Vertical <data value={y}>{y}%</data>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={y}
          onInput={(e) => onAxisInput("y", e)}
          onChange={(e) => onAxisInput("y", e)}
        />
      </label>
      <label class="admin-field">
        <span>
          Zoom <data value={zoom}>{zoom}%</data>
        </span>
        <input
          type="range"
          min={MIN_INLINE_STILL_ZOOM}
          max={MAX_INLINE_STILL_ZOOM}
          step={5}
          value={zoom}
          onInput={(e) => onAxisInput("zoom", e)}
          onChange={(e) => onAxisInput("zoom", e)}
        />
      </label>
      <button
        type="button"
        class="admin-ghost"
        onClick={() =>
          onChange({
            inlineStillX: DEFAULT_INLINE_STILL_X,
            inlineStillY: DEFAULT_INLINE_STILL_Y,
            inlineStillZoom: DEFAULT_INLINE_STILL_ZOOM,
          })
        }
      >
        Reset crop to default
      </button>
    </div>
  );
}
