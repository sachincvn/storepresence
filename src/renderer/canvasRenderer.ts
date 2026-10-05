import type { Background, Canvas, ImageElement, ScreenshotElement, SlideSpec, TemplateElement } from "@/types/template";
import { drawPhoneBody, drawPhoneDetails, drawPhoneRim, phoneScreen, type ScreenRect } from "./deviceRenderer";
import { fitImageToSlot, safeFitMode } from "./imageFit";
import { grainPattern, linearGradient } from "./paint";
import { applyShadow, clearShadow, drawShape, roundRectPath } from "./shapeRenderer";
import { drawText } from "./textRenderer";

export type ImageSource = HTMLImageElement | ImageBitmap | HTMLCanvasElement;

/** Decoded images keyed by URL. Missing entries render as placeholders. */
export type LoadedImages = ReadonlyMap<string, ImageSource>;

/**
 * Draws a resolved slide. The canvas is sized to `template size × scale`;
 * all drawing happens in template pixels, so preview and export match.
 */
export function drawSlide(canvas: HTMLCanvasElement, spec: SlideSpec, images: LoadedImages, scale: number): void {
  canvas.width = Math.round(spec.canvas.width * scale);
  canvas.height = Math.round(spec.canvas.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  drawBackground(ctx, spec.background, spec.canvas);

  // Panorama back layer, shifted so this slide shows its own segment of the set.
  const panoramaBack = spec.panorama.filter((el) => el.layer !== "front");
  const panoramaFront = spec.panorama.filter((el) => el.layer === "front");
  drawPanorama(ctx, panoramaBack, spec, images, scale);

  if (spec.grain > 0) drawGrain(ctx, spec.grain, spec.canvas);

  for (const el of spec.elements) drawElement(ctx, el, spec, images, scale);

  drawPanorama(ctx, panoramaFront, spec, images, scale);
}

function drawPanorama(ctx: CanvasRenderingContext2D, elements: TemplateElement[], spec: SlideSpec, images: LoadedImages, scale: number): void {
  if (elements.length === 0) return;
  ctx.save();
  ctx.translate(-spec.panoramaOffset, 0);
  for (const el of elements) drawElement(ctx, el, spec, images, scale);
  ctx.restore();
}

/** Film grain over the background only, so screenshots stay crisp. */
function drawGrain(ctx: CanvasRenderingContext2D, amount: number, { width, height }: Canvas): void {
  const pattern = grainPattern(ctx);
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawElement(ctx: CanvasRenderingContext2D, el: TemplateElement, spec: SlideSpec, images: LoadedImages, scale: number): void {
    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;
    if (el.rotation) {
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    switch (el.type) {
      case "text":
        drawText(ctx, el);
        break;
      case "shape":
        drawShape(ctx, el, scale);
        break;
      case "screenshot": {
        const shot = spec.screenshots[el.slot];
        drawScreenshot(ctx, el, shot ? images.get(shot.url) : undefined, scale);
        break;
      }
      case "image":
        drawImageElement(ctx, el, images.get(el.src));
        break;
    }
    ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D, bg: Background, { width, height }: Canvas): void {
  if (bg.type === "solid") {
    ctx.fillStyle = bg.color;
  } else if (bg.type === "linear") {
    ctx.fillStyle = linearGradient(ctx, bg, 0, 0, width, height);
  } else {
    const cx = bg.cx * width;
    const cy = bg.cy * height;
    const radius = Math.max(Math.hypot(cx, cy), Math.hypot(width - cx, cy), Math.hypot(cx, height - cy), Math.hypot(width - cx, height - cy));
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    for (const s of bg.stops) gradient.addColorStop(s.at, s.color);
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, width, height);
}

function sizeOf(img: ImageSource): { w: number; h: number } {
  return img instanceof HTMLImageElement ? { w: img.naturalWidth, h: img.naturalHeight } : { w: img.width, h: img.height };
}

function drawScreenshot(ctx: CanvasRenderingContext2D, el: ScreenshotElement, img: ImageSource | undefined, scale: number): void {
  const { x, y, width: w, height: h } = el;

  if (el.device === "phone") {
    const screen = phoneScreen(x, y, w, h, el.radius);
    applyShadow(ctx, el.shadow, scale);
    drawPhoneBody(ctx, x, y, w, h, el.radius, el.frameColor);
    clearShadow(ctx);
    drawPhoneRim(ctx, x, y, w, h, el.radius);

    ctx.save();
    roundRectPath(ctx, screen.x, screen.y, screen.w, screen.h, screen.r);
    ctx.clip();
    if (img) {
      const fit = safeFit(img, screen, el);
      ctx.fillStyle = "#000000";
      ctx.fillRect(screen.x, screen.y, screen.w, screen.h);
      if (fit === "contain") drawBackdrop(ctx, img, screen, scale);
      drawFitted(ctx, img, screen, { fit, align: el.align });
    } else {
      drawPlaceholder(ctx, screen, el.placeholderColor);
    }
    ctx.restore();
    drawPhoneDetails(ctx, screen, scale);
    return;
  }

  // No device: radius and shadow follow the visible image, not the empty slot.
  const slot: ScreenRect = { x, y, w, h, r: el.radius ?? 0 };
  let target = slot;
  const fit = img ? safeFit(img, slot, el) : el.fit;
  if (img && fit === "contain") {
    const { w: iw, h: ih } = sizeOf(img);
    const placed = fitImageToSlot(iw, ih, w, h, "contain", el.align);
    target = { x: x + placed.dx, y: y + placed.dy, w: placed.dw, h: placed.dh, r: slot.r };
  }

  if (el.shadow) {
    roundRectPath(ctx, target.x, target.y, target.w, target.h, target.r);
    applyShadow(ctx, el.shadow, scale);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    clearShadow(ctx);
  }

  ctx.save();
  roundRectPath(ctx, target.x, target.y, target.w, target.h, target.r);
  ctx.clip();
  if (img) drawFitted(ctx, img, target, { fit, align: el.align });
  else drawPlaceholder(ctx, target, el.placeholderColor);
  ctx.restore();
}

/**
 * Fills the empty bands around a contained screenshot with a blurred, dimmed
 * copy of itself, so the screen never shows big black bars.
 */
function drawBackdrop(ctx: CanvasRenderingContext2D, img: ImageSource, screen: ScreenRect, scale: number): void {
  const bleed = screen.w * 0.15; // oversize so the blur has no soft edge inside the screen
  ctx.save();
  ctx.filter = `blur(${screen.w * 0.05 * scale}px) brightness(0.65) saturate(1.2)`;
  drawFitted(ctx, img, { x: screen.x - bleed, y: screen.y - bleed, w: screen.w + bleed * 2, h: screen.h + bleed * 2, r: 0 }, { fit: "cover" });
  ctx.restore();
}

/** Screenshots only: wide images in tall slots switch to contain instead of losing their sides. */
function safeFit(img: ImageSource, rect: ScreenRect, el: ScreenshotElement): ScreenshotElement["fit"] {
  const { w, h } = sizeOf(img);
  return w && h ? safeFitMode(w, h, rect.w, rect.h, el.fit) : el.fit;
}

function drawFitted(ctx: CanvasRenderingContext2D, img: ImageSource, rect: ScreenRect, el: { fit: ScreenshotElement["fit"]; align?: ScreenshotElement["align"] }): void {
  const { w: iw, h: ih } = sizeOf(img);
  if (!iw || !ih) return;
  const f = fitImageToSlot(iw, ih, rect.w, rect.h, el.fit, el.align);
  ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, rect.x + f.dx, rect.y + f.dy, f.dw, f.dh);
}

/** Empty slot: a quiet app skeleton so the layout still reads. Preview only; export requires screenshots. */
function drawPlaceholder(ctx: CanvasRenderingContext2D, r: ScreenRect, color = "#E4E0EE"): void {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  const pad = r.w * 0.08;
  const bar = (bx: number, by: number, bw: number, bh: number) => {
    roundRectPath(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
  };
  ctx.fillStyle = "rgba(22, 19, 31, 0.1)";
  bar(r.x + pad, r.y + r.h * 0.09, r.w * 0.5, r.w * 0.06);
  for (let i = 0; i < 4; i++) {
    const top = r.y + r.h * 0.18 + i * r.w * 0.36;
    if (top + r.w * 0.3 > r.y + r.h) break;
    roundRectPath(ctx, r.x + pad, top, r.w - pad * 2, r.w * 0.3, r.w * 0.05);
    ctx.fill();
  }
}

function drawImageElement(ctx: CanvasRenderingContext2D, el: ImageElement, img: ImageSource | undefined): void {
  if (!img) return;
  const rect: ScreenRect = { x: el.x, y: el.y, w: el.width, h: el.height, r: el.radius ?? 0 };
  ctx.save();
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.r);
  ctx.clip();
  drawFitted(ctx, img, rect, el);
  ctx.restore();
}
