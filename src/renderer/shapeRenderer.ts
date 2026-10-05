import type { Shadow, ShapeElement } from "@/types/template";
import { linearGradient } from "./paint";

/*
 * Canvas shadows ignore the current transform, so blur and offsets are
 * multiplied by the render scale to look the same in preview and export.
 */
export function applyShadow(ctx: CanvasRenderingContext2D, shadow: Shadow | undefined, scale: number): void {
  if (!shadow) return;
  ctx.shadowColor = shadow.color;
  ctx.shadowBlur = shadow.blur * scale;
  ctx.shadowOffsetX = (shadow.x ?? 0) * scale;
  ctx.shadowOffsetY = (shadow.y ?? 0) * scale;
}

export function clearShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}

function shapePath(ctx: CanvasRenderingContext2D, el: ShapeElement): void {
  const { x, y, width: w, height: h } = el;
  if (el.shape === "circle") {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else {
    roundRectPath(ctx, x, y, w, h, el.shape === "pill" ? Math.min(w, h) / 2 : (el.radius ?? 0));
  }
}

export function drawShape(ctx: CanvasRenderingContext2D, el: ShapeElement, scale: number): void {
  const style = el.style ?? "flat";

  if (style === "halftone") {
    ctx.save();
    shapePath(ctx, el);
    ctx.clip();
    drawHalftone(ctx, el);
    ctx.restore();
    return;
  }

  // Canvas filters ignore the transform, like shadows.
  if (el.blur) ctx.filter = `blur(${el.blur * scale}px)`;
  shapePath(ctx, el);
  applyShadow(
    ctx,
    el.shadow ?? (style === "clay" ? { y: el.height * 0.08, blur: el.width * 0.2, color: "rgba(22, 19, 31, 0.28)" } : undefined),
    scale,
  );
  ctx.fillStyle = el.gradient ? linearGradient(ctx, el.gradient, el.x, el.y, el.width, el.height) : el.fill;
  ctx.fill();
  clearShadow(ctx);
  ctx.filter = "none";

  if (style === "clay") drawClayShading(ctx, el);

  if (el.stroke) {
    shapePath(ctx, el);
    ctx.strokeStyle = el.stroke.color;
    ctx.lineWidth = el.stroke.width;
    ctx.stroke();
  }
}

/** Soft 3D look: light from the top-left, darker rim bottom-right, small specular spot. */
function drawClayShading(ctx: CanvasRenderingContext2D, el: ShapeElement): void {
  const { x, y, width: w, height: h } = el;
  const size = Math.max(w, h);
  const lx = x + w * 0.34;
  const ly = y + h * 0.3;

  ctx.save();
  shapePath(ctx, el);
  ctx.clip();

  const shade = ctx.createRadialGradient(lx, ly, size * 0.25, lx, ly, size * 0.95);
  shade.addColorStop(0, "rgba(22, 19, 31, 0)");
  shade.addColorStop(1, "rgba(22, 19, 31, 0.24)");
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);

  const light = ctx.createRadialGradient(lx, ly, 0, lx, ly, size * 0.55);
  light.addColorStop(0, "rgba(255, 255, 255, 0.6)");
  light.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(x, y, w, h);

  const spot = ctx.createRadialGradient(lx - w * 0.04, ly - h * 0.04, 0, lx - w * 0.04, ly - h * 0.04, size * 0.12);
  spot.addColorStop(0, "rgba(255, 255, 255, 0.75)");
  spot.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = spot;
  ctx.fillRect(x, y, w, h);

  ctx.restore();
}

const DOT_SPACING = 26;
const DOT_MAX_RADIUS = 8;

/** Pop-art dots that shrink from the center outwards. */
function drawHalftone(ctx: CanvasRenderingContext2D, el: ShapeElement): void {
  const { x, y, width: w, height: h } = el;
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.fillStyle = el.fill;

  for (let row = 0, py = y + DOT_SPACING / 2; py < y + h; row++, py += DOT_SPACING * 0.866) {
    const offset = row % 2 === 0 ? 0 : DOT_SPACING / 2;
    for (let px = x + DOT_SPACING / 2 + offset; px < x + w; px += DOT_SPACING) {
      // Elliptical distance, 0 at the center, 1 at the edge.
      const d = Math.hypot((px - cx) / (w / 2), (py - cy) / (h / 2));
      if (d >= 1) continue;
      const r = DOT_MAX_RADIUS * Math.pow(1 - d, 0.55);
      if (r < 0.8) continue;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
