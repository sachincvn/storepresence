import type { LinearGradient } from "@/types/template";

/** CSS-style linear gradient across a box (0deg = to top, 90deg = to right). */
export function linearGradient(
  ctx: CanvasRenderingContext2D,
  { angle, stops }: LinearGradient,
  x: number,
  y: number,
  w: number,
  h: number,
): CanvasGradient {
  const a = (angle * Math.PI) / 180;
  const half = (Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))) / 2;
  const dx = Math.sin(a) * half;
  const dy = -Math.cos(a) * half;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  for (const s of stops) gradient.addColorStop(s.at, s.color);
  return gradient;
}

let grainTile: HTMLCanvasElement | null = null;

/** Deterministic noise tile (seeded), so exports are identical every time. */
export function grainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (!grainTile) {
    const size = 256;
    grainTile = document.createElement("canvas");
    grainTile.width = size;
    grainTile.height = size;
    const tctx = grainTile.getContext("2d");
    if (!tctx) return null;
    const data = tctx.createImageData(size, size);
    let seed = 1337;
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const v = seed >>> 24;
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    tctx.putImageData(data, 0, 0);
  }
  return ctx.createPattern(grainTile, "repeat");
}
