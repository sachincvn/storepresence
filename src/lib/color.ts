export type RGB = [number, number, number];

/** Parses #RGB / #RRGGBB. Returns null for other formats. */
export function parseHex(c: string): RGB | null {
  const m = c.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (x) => x + x) : m[1];
  const n = Number.parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** Mixes two #RRGGBB / #RGB colors; t = 0 gives `a`, 1 gives `b`. Returns null for other formats. */
export function mixHex(a: string, b: string, t: number): string | null {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return null;
  return toHex(ca.map((v, i) => v + (cb[i] - v) * t) as RGB);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two hex colors, 1 to 21. Unparseable colors count as 1. */
export function contrast(a: string, b: string): number {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** HSL saturation and lightness, 0–1. */
export function satLight([r, g, b]: RGB): { s: number; l: number } {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  return { s: d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)), l };
}

/**
 * Nudges `color` towards black or white (whichever helps more) until it
 * reaches `min` contrast against `against`. Keeps the hue family.
 */
export function ensureContrast(color: string, against: string, min: number): string {
  if (contrast(color, against) >= min) return color;
  const target = contrast("#000000", against) > contrast("#FFFFFF", against) ? "#000000" : "#FFFFFF";
  for (let t = 0.05; t <= 1; t += 0.05) {
    const next = mixHex(color, target, t);
    if (next && contrast(next, against) >= min) return next;
  }
  return target;
}
