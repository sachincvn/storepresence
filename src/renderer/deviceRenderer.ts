import type { DeviceKey } from "@/types/template";
import { roundRectPath } from "./shapeRenderer";

export type ScreenRect = { x: number; y: number; w: number; h: number; r: number };

const BODY = "#16131F";

/** Bezel and corner radius per model, scaled to the device width. */
function geometry(model: DeviceKey, w: number, radius?: number): { bezel: number; outer: number } {
  switch (model) {
    case "phone-island":
      return { bezel: w * 0.026, outer: radius ?? w * 0.155 };
    case "flat":
      return { bezel: 0, outer: radius ?? w * 0.075 };
    case "phone":
      return { bezel: w * 0.032, outer: radius ?? w * 0.13 };
  }
}

/** Element box = outer device bounds; returns the screen area inside it. */
export function deviceScreen(model: DeviceKey, x: number, y: number, w: number, h: number, radius?: number): ScreenRect {
  const { bezel, outer } = geometry(model, w, radius);
  return { x: x + bezel, y: y + bezel, w: w - bezel * 2, h: h - bezel * 2, r: Math.max(0, outer - bezel) };
}

/** Device body with side buttons. Call with a shadow applied to cast it. Flat devices cast from the screen shape. */
export function drawDeviceBody(
  ctx: CanvasRenderingContext2D,
  model: DeviceKey,
  x: number,
  y: number,
  w: number,
  h: number,
  radius?: number,
  color = BODY,
): void {
  const { outer } = geometry(model, w, radius);

  if (model === "flat") {
    roundRectPath(ctx, x, y, w, h, outer);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    return;
  }

  const button = w * 0.012;
  ctx.fillStyle = color;
  const side = (left: boolean, top: number, length: number) => {
    roundRectPath(ctx, left ? x - button : x + w - button, y + h * top, button * 2, h * length, button);
    ctx.fill();
  };
  if (model === "phone-island") {
    side(true, 0.13, 0.03); // action button
    side(true, 0.19, 0.055);
    side(true, 0.26, 0.055);
    side(false, 0.22, 0.09);
  } else {
    side(false, 0.2, 0.08);
    side(true, 0.16, 0.05);
    side(true, 0.235, 0.05);
  }

  roundRectPath(ctx, x, y, w, h, outer);
  ctx.fill();
}

/** Thin light rim so the frame stays visible on dark backgrounds. Draw without a shadow. */
export function drawDeviceRim(ctx: CanvasRenderingContext2D, model: DeviceKey, x: number, y: number, w: number, h: number, radius?: number): void {
  if (model === "flat") return;
  const { outer } = geometry(model, w, radius);
  const inset = w * 0.004;
  roundRectPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, outer - inset);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = w * 0.005;
  ctx.stroke();
}

/** Drawn over the screenshot: inner edge and camera (punch-hole or island). */
export function drawDeviceDetails(ctx: CanvasRenderingContext2D, model: DeviceKey, screen: ScreenRect, scale: number): void {
  roundRectPath(ctx, screen.x, screen.y, screen.w, screen.h, screen.r);
  ctx.strokeStyle = model === "flat" ? "rgba(22, 19, 31, 0.1)" : "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = Math.max(1 / scale, screen.w * 0.003);
  ctx.stroke();

  ctx.fillStyle = "#0B0A10";
  if (model === "phone-island") {
    const iw = screen.w * 0.3;
    const ih = screen.w * 0.088;
    roundRectPath(ctx, screen.x + (screen.w - iw) / 2, screen.y + screen.w * 0.03, iw, ih, ih / 2);
    ctx.fill();
  } else if (model === "phone") {
    ctx.beginPath();
    ctx.arc(screen.x + screen.w / 2, screen.y + screen.w * 0.05, screen.w * 0.022, 0, Math.PI * 2);
    ctx.fill();
  }
}
