import { roundRectPath } from "./shapeRenderer";

export type ScreenRect = { x: number; y: number; w: number; h: number; r: number };

const BODY = "#16131F";

/** Element box = outer phone bounds. Bezel and corner radius scale with width. */
export function phoneScreen(x: number, y: number, w: number, h: number, radius?: number): ScreenRect {
  const bezel = w * 0.032;
  const outer = radius ?? w * 0.13;
  return { x: x + bezel, y: y + bezel, w: w - bezel * 2, h: h - bezel * 2, r: Math.max(0, outer - bezel) };
}

/** Phone body with side buttons. Call with a shadow applied to cast it. */
export function drawPhoneBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius?: number,
  color = BODY,
): void {
  const outer = radius ?? w * 0.13;
  const button = w * 0.012;

  ctx.fillStyle = color;
  // Power (right) and volume (left) buttons peek out of the frame.
  roundRectPath(ctx, x + w - button, y + h * 0.2, button * 2, h * 0.08, button);
  ctx.fill();
  roundRectPath(ctx, x - button, y + h * 0.16, button * 2, h * 0.05, button);
  ctx.fill();
  roundRectPath(ctx, x - button, y + h * 0.235, button * 2, h * 0.05, button);
  ctx.fill();

  roundRectPath(ctx, x, y, w, h, outer);
  ctx.fill();
}

/** Thin light rim so the frame stays visible on dark backgrounds. Draw without a shadow. */
export function drawPhoneRim(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius?: number): void {
  const inset = w * 0.004;
  roundRectPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, (radius ?? w * 0.13) - inset);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = w * 0.005;
  ctx.stroke();
}

/** Drawn over the screenshot: subtle inner edge and punch-hole camera. */
export function drawPhoneDetails(ctx: CanvasRenderingContext2D, screen: ScreenRect, scale: number): void {
  roundRectPath(ctx, screen.x, screen.y, screen.w, screen.h, screen.r);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = Math.max(1 / scale, screen.w * 0.003);
  ctx.stroke();

  const r = screen.w * 0.022;
  ctx.beginPath();
  ctx.arc(screen.x + screen.w / 2, screen.y + screen.w * 0.05, r, 0, Math.PI * 2);
  ctx.fillStyle = "#0B0A10";
  ctx.fill();
}
