import type { TextElement } from "@/types/template";
import { fontString } from "./fonts";
import { roundRectPath } from "./shapeRenderer";
import { layoutText } from "./textLayout";

export function drawText(ctx: CanvasRenderingContext2D, el: TextElement): void {
  if (!el.text.trim()) return;

  const padX = el.pill ? (el.pill.paddingX ?? el.size * 0.6) : 0;
  const padY = el.pill ? (el.pill.paddingY ?? el.size * 0.32) : 0;

  const setFont = (size: number) => {
    ctx.font = fontString(el.font, el.weight, size);
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${(el.letterSpacing ?? 0) * size}px`;
  };
  const measure = (text: string, size: number) => {
    setFont(size);
    return ctx.measureText(text).width;
  };

  const layout = layoutText(el.text, measure, {
    width: el.width - padX * 2,
    height: el.height - padY * 2,
    size: el.size,
    minSize: el.minSize ?? el.size,
    lineHeight: el.lineHeight ?? 1.15,
    maxLines: el.maxLines ?? Number.POSITIVE_INFINITY,
  });
  if (layout.lines.length === 0) return;

  // Block = text lines plus pill padding; positioned inside the element box.
  const textHeight = layout.lines.length * layout.lineHeightPx;
  const textWidth = Math.max(...layout.lines.map((line) => measure(line, layout.size)));
  const blockW = textWidth + padX * 2;
  const blockH = textHeight + padY * 2;
  const blockY =
    el.verticalAlign === "bottom" ? el.y + el.height - blockH : el.verticalAlign === "middle" ? el.y + (el.height - blockH) / 2 : el.y;
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

  setFont(layout.size);
  ctx.fillStyle = el.color;
  ctx.textAlign = el.align;
  ctx.textBaseline = "middle";
  const x = el.align === "left" ? blockX + padX : el.align === "right" ? blockX + blockW - padX : blockX + blockW / 2;
  const top = blockY + padY;
  layout.lines.forEach((line, i) => ctx.fillText(line, x, top + layout.lineHeightPx * (i + 0.5)));
}
