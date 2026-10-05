import type { BlockElement, LaurelsElement, RatingElement, ReviewElement, StatElement } from "@/types/template";
import { fontString } from "./fonts";
import { applyShadow, clearShadow, roundRectPath } from "./shapeRenderer";
import { layoutText } from "./textLayout";

/* Social proof blocks, all drawn in code so they recolor with the theme. */

export function drawBlock(ctx: CanvasRenderingContext2D, el: BlockElement, scale: number): void {
  switch (el.type) {
    case "rating":
      return drawRating(ctx, el);
    case "laurels":
      return drawLaurels(ctx, el);
    case "stat":
      return drawStat(ctx, el);
    case "review":
      return drawReview(ctx, el, scale);
  }
}

/** Five-point star; `fill` 0–1 fills from the left (partial stars). */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, fill = 1): void {
  const path = new Path2D();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.48;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.closePath();

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineWidth = r * 0.18;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (fill < 1) {
    ctx.globalAlpha *= 0.25;
    ctx.fill(path);
    ctx.stroke(path);
    ctx.globalAlpha /= 0.25;
    ctx.beginPath();
    ctx.rect(cx - r * 1.2, cy - r * 1.2, r * 2.4 * fill, r * 2.4);
    ctx.clip();
  }
  ctx.fill(path);
  ctx.stroke(path);
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, x: number, cy: number, starSize: number, color: string, score: number): number {
  const gap = starSize * 0.18;
  for (let i = 0; i < 5; i++) {
    const fill = Math.max(0, Math.min(1, score - i));
    drawStar(ctx, x + starSize / 2 + i * (starSize + gap), cy, starSize * 0.45, color, fill);
  }
  return 5 * starSize + 4 * gap;
}

function parseScore(text: string): number {
  const value = Number.parseFloat(text.replace(",", "."));
  return Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 5;
}

function alignX(align: "left" | "center" | "right" | undefined, x: number, width: number, content: number): number {
  return align === "left" ? x : align === "right" ? x + width - content : x + (width - content) / 2;
}

function drawRating(ctx: CanvasRenderingContext2D, el: RatingElement): void {
  const measure = (text: string, weight: number, size: number) => {
    ctx.font = fontString("sans", weight, size);
    return ctx.measureText(text).width;
  };

  // Fit the row to the box: shrink everything together if needed.
  let unit = el.height;
  const rowWidth = (u: number) => {
    const star = u * 0.62;
    const stars = 5 * star + 4 * star * 0.18;
    const score = el.score ? measure(el.score, 800, u * 0.62) + u * 0.3 : 0;
    const label = el.label ? measure(el.label, 600, u * 0.46) + u * 0.22 : 0;
    return stars + score + label;
  };
  while (unit > 8 && rowWidth(unit) > el.width) unit *= 0.95;

  const cy = el.y + el.height / 2;
  let x = alignX(el.align, el.x, el.width, rowWidth(unit));
  x += drawStars(ctx, x, cy, unit * 0.62, el.starColor, parseScore(el.score));

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  if (el.score) {
    x += unit * 0.3;
    ctx.font = fontString("sans", 800, unit * 0.62);
    ctx.fillStyle = el.color;
    ctx.fillText(el.score, x, cy);
    x += measure(el.score, 800, unit * 0.62);
  }
  if (el.label) {
    x += unit * 0.22;
    ctx.save();
    ctx.globalAlpha *= 0.72;
    ctx.font = fontString("sans", 600, unit * 0.46);
    ctx.fillStyle = el.color;
    ctx.fillText(el.label, x, cy);
    ctx.restore();
  }
}

/**
 * One wreath branch: paired leaves along an elliptical arc from the bottom
 * up to the top, mirrored for the right side. Leaves shrink towards the tip.
 */
function drawBranch(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, side: -1 | 1, color: string): void {
  const leaves = 13;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  // Stem along the arc.
  const from = (side === -1 ? 105 : 75) * (Math.PI / 180);
  const to = (side === -1 ? 250 : -70) * (Math.PI / 180);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, from, to, side === 1);
  ctx.lineWidth = ry * 0.028;
  ctx.lineCap = "round";
  ctx.stroke();

  for (let i = 0; i < leaves; i++) {
    const t = i / (leaves - 1);
    // Left branch runs 105° → 250° (canvas angles, y down); right branch mirrors it.
    const deg = 105 + t * 145;
    const a = ((side === -1 ? deg : 180 - deg) * Math.PI) / 180;
    const px = cx + Math.cos(a) * rx;
    const py = cy + Math.sin(a) * ry;
    // Direction of travel towards the tip.
    const dir = side === -1 ? 1 : -1;
    const tangent = Math.atan2(Math.cos(a) * ry * dir, -Math.sin(a) * rx * dir);
    const size = ry * (0.17 - t * 0.06);

    for (const lean of [-0.5, 0.5]) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(tangent + lean);
      ctx.beginPath();
      ctx.ellipse(size * 0.95, 0, size, size * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  // Tip leaf.
  const tipA = ((side === -1 ? 254 : -74) * Math.PI) / 180;
  ctx.beginPath();
  ctx.ellipse(cx + Math.cos(tipA) * rx, cy + Math.sin(tipA) * ry, ry * 0.11, ry * 0.05, tipA + Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawLaurels(ctx: CanvasRenderingContext2D, el: LaurelsElement): void {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const ry = el.height * 0.44;
  const rx = Math.min(el.width * 0.46, ry * 2);
  const leaf = el.leafColor ?? el.color;
  drawBranch(ctx, cx, cy, rx, ry, -1, leaf);
  drawBranch(ctx, cx, cy, rx, ry, 1, leaf);

  // Text stack in the middle of the wreath.
  const maxWidth = rx * 1.45;
  const titleSize = fitSize(ctx, el.title, "display", 800, ry * 0.4, maxWidth);
  const subtitleSize = fitSize(ctx, el.subtitle ?? "", "sans", 600, ry * 0.2, maxWidth);
  const starSize = ry * 0.17;
  const parts = [el.stars ? starSize : 0, el.title ? titleSize : 0, el.subtitle ? subtitleSize : 0].filter(Boolean);
  const gap = ry * 0.08;
  let y = cy - (parts.reduce((sum, h) => sum + h, 0) + gap * (parts.length - 1)) / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (el.stars) {
    const width = 5 * starSize + 4 * starSize * 0.18;
    drawStars(ctx, cx - width / 2, y + starSize / 2, starSize, el.starColor ?? el.color, 5);
    y += starSize + gap;
  }
  if (el.title) {
    ctx.font = fontString("display", 800, titleSize);
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${-0.02 * titleSize}px`;
    ctx.fillStyle = el.color;
    ctx.fillText(el.title, cx, y + titleSize / 2);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    y += titleSize + gap;
  }
  if (el.subtitle) {
    ctx.save();
    ctx.globalAlpha *= 0.75;
    ctx.font = fontString("sans", 600, subtitleSize);
    ctx.fillStyle = el.color;
    ctx.fillText(el.subtitle, cx, y + subtitleSize / 2);
    ctx.restore();
  }
}

/** Largest size ≤ `size` at which one line of text fits `maxWidth`. */
function fitSize(ctx: CanvasRenderingContext2D, text: string, font: "display" | "sans" | "serif", weight: number, size: number, maxWidth: number): number {
  ctx.font = fontString(font, weight, size);
  const width = ctx.measureText(text).width;
  return width > maxWidth ? size * (maxWidth / width) : size;
}

function drawStat(ctx: CanvasRenderingContext2D, el: StatElement): void {
  const font = el.font ?? "display";
  const valueSize = fitSize(ctx, el.value, font, 800, el.height * 0.66, el.width);
  const labelSize = fitSize(ctx, el.label, "sans", 600, el.height * 0.2, el.width);
  const x = el.align === "left" ? el.x : el.align === "right" ? el.x + el.width : el.x + el.width / 2;
  const top = el.y + (el.height - valueSize - (el.label ? labelSize * 1.3 : 0)) / 2;

  ctx.textAlign = el.align ?? "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = el.color;
  ctx.font = fontString(font, 800, valueSize);
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${-0.03 * valueSize}px`;
  ctx.fillText(el.value, x, top + valueSize / 2);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  if (el.label) {
    ctx.save();
    ctx.globalAlpha *= 0.75;
    ctx.font = fontString("sans", 600, labelSize);
    ctx.fillText(el.label, x, top + valueSize + labelSize * 0.8);
    ctx.restore();
  }
}

function drawReview(ctx: CanvasRenderingContext2D, el: ReviewElement, scale: number): void {
  const pad = el.width * 0.07;
  const starSize = el.width * 0.055;
  const quoteSize = el.size ?? el.width * 0.058;
  const inner = el.width - pad * 2;

  const quote = layoutText(
    el.quote,
    (text, size) => {
      ctx.font = fontString("sans", 600, size);
      return ctx.measureText(text).width;
    },
    { width: inner, height: el.height, size: quoteSize, minSize: quoteSize * 0.75, lineHeight: 1.3, maxLines: 4 },
  );
  const authorSize = quote.size * 0.78;
  const gap = pad * 0.45;
  const contentHeight = starSize + gap + quote.lines.length * quote.lineHeightPx + (el.author ? gap + authorSize : 0);
  const cardHeight = Math.min(el.height, contentHeight + pad * 2);

  roundRectPath(ctx, el.x, el.y, el.width, cardHeight, el.radius ?? el.width * 0.07);
  applyShadow(ctx, el.shadow ?? { y: 24, blur: 60, color: "rgba(22, 19, 31, 0.22)" }, scale);
  ctx.fillStyle = el.cardColor;
  ctx.fill();
  clearShadow(ctx);

  let y = el.y + pad;
  drawStars(ctx, el.x + pad, y + starSize / 2, starSize, el.starColor, 5);
  y += starSize + gap;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = el.color;
  ctx.font = fontString("sans", 600, quote.size);
  quote.lines.forEach((line, i) => ctx.fillText(line, el.x + pad, y + quote.lineHeightPx * (i + 0.5)));
  y += quote.lines.length * quote.lineHeightPx;

  if (el.author) {
    y += gap;
    ctx.save();
    ctx.globalAlpha *= 0.65;
    ctx.font = fontString("sans", 700, authorSize);
    ctx.fillText(el.author, el.x + pad, y + authorSize / 2);
    ctx.restore();
  }
}
