import type { CalloutElement, NormRect, ScreenshotElement, Shadow } from "@/types/template";
import { deviceScreen } from "./deviceRenderer";
import { fitImageToSlot, safeFitMode } from "./imageFit";
import { deviceBox, perspectivePoint } from "./perspective";
import { sizeOf, type ImageSource } from "./imageSource";
import { applyShadow, clearShadow, roundRectPath } from "./shapeRenderer";

type Rect = { x: number; y: number; w: number; h: number };

export const CALLOUT_DEFAULTS = { padding: 16, radius: 40 } as const;
/** Smallest area side, as a fraction of the image. Keeps the enlargement sane. */
export const MIN_REGION = 0.04;

const CARD_SHADOW: Shadow = { y: 28, blur: 70, color: "rgba(22, 19, 31, 0.28)" };
const GLASS_SHADOW: Shadow = { y: 24, blur: 60, color: "rgba(0, 0, 0, 0.3)" };
const TAIL = { base: 64, length: 44 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Keeps an area inside the image and at least `MIN_REGION` on each side. */
export function clampRegion(r: NormRect): NormRect {
  const w = clamp(r.w, MIN_REGION, 1);
  const h = clamp(r.h, MIN_REGION, 1);
  return { x: clamp(r.x, 0, 1 - w), y: clamp(r.y, 0, 1 - h), w, h };
}

/**
 * Where the enlarged area and its panel go. The area keeps the region's
 * aspect ratio (in image pixels), fits inside the box minus padding and is
 * centered in it. Without an image, the area fills the box.
 */
export function calloutGeometry(el: CalloutElement, image?: { w: number; h: number }): { panel: Rect; crop: Rect; source?: Rect } {
  const pad = el.padding ?? CALLOUT_DEFAULTS.padding;
  const maxW = Math.max(1, el.width - pad * 2);
  const maxH = Math.max(1, el.height - pad * 2);
  const region = clampRegion(el.region);
  const aspect = image && image.w > 0 && image.h > 0 ? (region.w * image.w) / (region.h * image.h) : maxW / maxH;

  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  const crop = { x: el.x + (el.width - w) / 2, y: el.y + (el.height - h) / 2, w, h };
  return {
    crop,
    panel: { x: crop.x - pad, y: crop.y - pad, w: w + pad * 2, h: h + pad * 2 },
    source: image && { x: region.x * image.w, y: region.y * image.h, w: region.w * image.w, h: region.h * image.h },
  };
}

/**
 * Canvas y of the region's center as drawn inside a screenshot element,
 * clamped to the visible screen. Ignores the element's rotation.
 */
export function regionCenterY(shot: ScreenshotElement, image: { w: number; h: number }, region: NormRect): number | null {
  if (image.w <= 0 || image.h <= 0) return null;
  const screen = shot.device ? deviceScreen(shot.device, shot.x, shot.y, shot.width, shot.height, shot.radius) : { x: shot.x, y: shot.y, w: shot.width, h: shot.height };
  const fit = safeFitMode(image.w, image.h, screen.w, screen.h, shot.fit);
  const f = fitImageToSlot(image.w, image.h, screen.w, screen.h, fit, shot.align);
  const r = clampRegion(region);
  const y = clamp(screen.y + f.dy + ((r.y + r.h / 2) * image.h - f.sy) * (f.dh / f.sh), screen.y + f.dy, screen.y + f.dy + f.dh);
  // An angled phone moves the area with it.
  const angled = shot.perspective ? perspectivePoint(deviceBox(shot), shot.perspective, screen.x + screen.w / 2, y)[1] : y;
  // A scaled phone grows around its center.
  const cy = shot.y + shot.height / 2;
  return cy + (angled - cy) * (shot.scale ?? 1);
}

export function drawCallout(ctx: CanvasRenderingContext2D, el: CalloutElement, img: ImageSource | undefined, scale: number): void {
  const { panel, crop, source } = calloutGeometry(el, img && sizeOf(img));
  const style = el.style ?? "card";
  const radius = Math.min(el.radius ?? CALLOUT_DEFAULTS.radius, panel.w / 2, panel.h / 2);
  const pad = el.padding ?? CALLOUT_DEFAULTS.padding;
  const path = () => {
    roundRectPath(ctx, panel.x, panel.y, panel.w, panel.h, radius);
    if (style === "bubble") tailPath(ctx, panel, radius, el.tail ?? "bottom", el.tailAt ?? 0.25);
  };

  if (style === "glass") {
    // Frosted panel: blur whatever is already drawn behind it. Snapshot first,
    // before the shadow pass paints over the same pixels.
    const behind = snapshot(ctx);
    path();
    applyShadow(ctx, el.shadow ?? GLASS_SHADOW, scale);
    ctx.fillStyle = "#000000";
    ctx.fill();
    clearShadow(ctx);
    ctx.save();
    path();
    ctx.clip();
    if (behind) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = `blur(${28 * scale}px) saturate(1.3)`;
      ctx.drawImage(behind, 0, 0);
      ctx.restore();
    }
    ctx.fillStyle = el.fill ?? "rgba(255, 255, 255, 0.2)";
    ctx.fill();
    ctx.restore();
    // Light rim, brighter at the top like real glass.
    path();
    const rim = ctx.createLinearGradient(0, panel.y, 0, panel.y + panel.h);
    rim.addColorStop(0, "rgba(255, 255, 255, 0.7)");
    rim.addColorStop(1, "rgba(255, 255, 255, 0.15)");
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    path();
    applyShadow(ctx, el.shadow ?? CARD_SHADOW, scale);
    ctx.fillStyle = el.fill ?? "#FFFFFF";
    ctx.fill();
    clearShadow(ctx);
  }

  if (el.stroke) {
    path();
    ctx.strokeStyle = el.stroke.color;
    ctx.lineWidth = el.stroke.width;
    ctx.stroke();
  }

  // The enlarged area, with corners that follow the panel's.
  const inner = pad > 0 ? Math.max(8, radius - pad) : radius;
  ctx.save();
  roundRectPath(ctx, crop.x, crop.y, crop.w, crop.h, Math.min(inner, crop.w / 2, crop.h / 2));
  ctx.clip();
  if (img && source) {
    ctx.drawImage(img, source.x, source.y, source.w, source.h, crop.x, crop.y, crop.w, crop.h);
  } else {
    drawEmpty(ctx, crop);
  }
  ctx.restore();
}

/** Copy of the canvas so far (device pixels). */
function snapshot(ctx: CanvasRenderingContext2D): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const copy = document.createElement("canvas");
  copy.width = ctx.canvas.width;
  copy.height = ctx.canvas.height;
  copy.getContext("2d")?.drawImage(ctx.canvas, 0, 0);
  return copy;
}

/** Chat tail as an extra subpath; filled together with the panel so they share one shadow. */
function tailPath(ctx: CanvasRenderingContext2D, p: Rect, radius: number, side: NonNullable<CalloutElement["tail"]>, at: number): void {
  const horizontal = side === "top" || side === "bottom";
  const length = horizontal ? p.w : p.h;
  const half = TAIL.base / 2;
  // Keep the tail off the rounded corners.
  const along = clamp(length * at, radius + half, Math.max(radius + half, length - radius - half));
  const overlap = 2; // tuck under the panel edge, no seam
  // Tip leans back towards the near corner, like a speech bubble.
  const lean = (at <= 0.5 ? -1 : 1) * half * 0.6;

  ctx.moveTo(...point(side, p, along - half, -overlap));
  ctx.lineTo(...point(side, p, along + lean, TAIL.length));
  ctx.lineTo(...point(side, p, along + half, -overlap));
  ctx.closePath();
}

/** A point `along` the given side, `out` pixels outside the panel. */
function point(side: NonNullable<CalloutElement["tail"]>, p: Rect, along: number, out: number): [number, number] {
  switch (side) {
    case "bottom":
      return [p.x + along, p.y + p.h + out];
    case "top":
      return [p.x + along, p.y - out];
    case "left":
      return [p.x - out, p.y + along];
    case "right":
      return [p.x + p.w + out, p.y + along];
  }
}

/** No screenshot yet: quiet rows so the panel still reads. */
function drawEmpty(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.fillStyle = "#EEEBF5";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = "rgba(22, 19, 31, 0.1)";
  const bar = r.h * 0.16;
  roundRectPath(ctx, r.x + r.w * 0.08, r.y + r.h * 0.3, r.w * 0.55, bar, bar / 2);
  ctx.fill();
  roundRectPath(ctx, r.x + r.w * 0.08, r.y + r.h * 0.56, r.w * 0.35, bar, bar / 2);
  ctx.fill();
}
