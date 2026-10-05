import type { TextElement } from "@/types/template";
import { fontString } from "./fonts";
import { roundRectPath } from "./shapeRenderer";
import { layoutRich, lineWidth, parseMarkup, type Piece, type PieceStyle } from "./textLayout";

const MARKER_OPACITY = 0.55;

export function drawText(ctx: CanvasRenderingContext2D, el: TextElement): void {
  const paragraphs = parseMarkup(el.text);
  if (paragraphs.length === 0) return;

  const padX = el.pill ? (el.pill.paddingX ?? el.size * 0.6) : 0;
  const padY = el.pill ? (el.pill.paddingY ?? el.size * 0.32) : 0;
  const emphasis = el.emphasis ?? {};

  const setFont = (style: PieceStyle, size: number) => {
    const isEm = style === 1;
    ctx.font = fontString(isEm ? (emphasis.font ?? el.font) : el.font, isEm ? (emphasis.weight ?? el.weight) : el.weight, size);
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${(el.letterSpacing ?? 0) * size}px`;
  };
  const measure = (text: string, style: PieceStyle, size: number) => {
    setFont(style, size);
    return ctx.measureText(text).width;
  };

  const layout = layoutRich(paragraphs, measure, {
    width: el.width - padX * 2,
    height: el.height - padY * 2,
    size: el.size,
    minSize: el.minSize ?? el.size,
    lineHeight: el.lineHeight ?? 1.15,
    maxLines: el.maxLines ?? Number.POSITIVE_INFINITY,
  });
  if (layout.lines.length === 0) return;

  const size = layout.size;
  const m = (p: Piece) => measure(p.text, p.style, size);
  const space = measure(" ", 0, size);
  const widths = layout.lines.map((line) => lineWidth(line, m, space));

  // Block = text lines plus pill padding; positioned inside the element box.
  const textHeight = layout.lines.length * layout.lineHeightPx;
  const blockW = Math.max(...widths) + padX * 2;
  const blockH = textHeight + padY * 2;
  const blockY = el.verticalAlign === "bottom" ? el.y + el.height - blockH : el.verticalAlign === "middle" ? el.y + (el.height - blockH) / 2 : el.y;
  const blockX = el.align === "left" ? el.x : el.align === "right" ? el.x + el.width - blockW : el.x + (el.width - blockW) / 2;

  if (el.pill) {
    roundRectPath(ctx, blockX, blockY, blockW, blockH, el.pill.radius ?? blockH / 2);
    ctx.fillStyle = el.pill.fill;
    ctx.fill();
    if (el.pill.stroke) {
      ctx.strokeStyle = el.pill.stroke.color;
      ctx.lineWidth = el.pill.stroke.width;
      ctx.stroke();
    }
  }

  // Lay out every piece once, then draw markers under all text, then the text.
  type Placed = Piece & { x: number; y: number; w: number };
  const placed: Placed[] = [];
  const markers: { x: number; y: number; w: number }[] = [];
  layout.lines.forEach((line, i) => {
    const y = blockY + padY + layout.lineHeightPx * (i + 0.5);
    const inner = blockW - padX * 2;
    let x = blockX + padX + (el.align === "left" ? 0 : el.align === "right" ? inner - widths[i] : (inner - widths[i]) / 2);
    line.forEach((word, wi) => {
      if (wi > 0) {
        // A highlight spanning two words continues under the space between them.
        const prev = line[wi - 1].at(-1);
        if (prev?.style === 2 && word[0].style === 2) markers.push({ x, y, w: space });
        x += space;
      }
      for (const piece of word) {
        const w = m(piece);
        if (piece.style === 2) markers.push({ x, y, w });
        placed.push({ ...piece, x, y, w });
        x += w;
      }
    });
  });

  if (markers.length > 0) {
    ctx.save();
    ctx.globalAlpha *= MARKER_OPACITY;
    ctx.fillStyle = el.marker ?? el.color;
    for (const mk of markers) {
      // Highlighter band over the lower part of the letters.
      roundRectPath(ctx, mk.x - size * 0.04, mk.y - size * 0.06, mk.w + size * 0.08, size * 0.42, size * 0.08);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const p of placed) {
    setFont(p.style, size);
    ctx.fillStyle = p.style === 1 ? (emphasis.color ?? el.color) : el.color;
    ctx.fillText(p.text, p.x, p.y);
  }
}
