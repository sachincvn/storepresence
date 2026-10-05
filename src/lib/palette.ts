import type { ThemeKey, ThemeTokens } from "@/types/template";
import { contrast, ensureContrast, luminance, mixHex, parseHex, satLight, toHex, type RGB } from "./color";

export type PaletteColor = { hex: string; weight: number; s: number; l: number };

export type BrandSuggestion = { id: "accent" | "bold" | "soft"; label: string; theme: ThemeTokens };

/** Colors closer than this (RGB distance) count as one. */
const MERGE_DISTANCE = 48;

const dist = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Main colors of an image from its RGBA pixels (e.g. `getImageData` of a
 * small copy). Transparent pixels are ignored. Deterministic: pixels are
 * bucketed, then similar buckets merge. Sorted by share, most common first.
 */
export function extractPalette(data: Uint8ClampedArray, max = 5): PaletteColor[] {
  const buckets = new Map<number, { sum: RGB; n: number }>();
  let total = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { sum: [0, 0, 0] as RGB, n: 0 };
    bucket.sum = [bucket.sum[0] + r, bucket.sum[1] + g, bucket.sum[2] + b];
    bucket.n++;
    buckets.set(key, bucket);
    total++;
  }
  if (total === 0) return [];

  const groups: { rgb: RGB; n: number }[] = [];
  const sorted = [...buckets.values()].map((b) => ({ rgb: b.sum.map((v) => v / b.n) as RGB, n: b.n })).sort((a, b) => b.n - a.n);
  for (const c of sorted) {
    const near = groups.find((g) => dist(g.rgb, c.rgb) < MERGE_DISTANCE);
    if (!near) {
      groups.push({ ...c });
      continue;
    }
    const n = near.n + c.n;
    near.rgb = near.rgb.map((v, i) => (v * near.n + c.rgb[i] * c.n) / n) as RGB;
    near.n = n;
  }
  return groups
    .sort((a, b) => b.n - a.n)
    .slice(0, max)
    .map((g) => ({ hex: toHex(g.rgb), weight: g.n / total, ...satLight(g.rgb) }));
}

/**
 * Up to three themes built from a brand palette, limited to the colors the
 * template lets users edit. Text stays readable: backgrounds keep 4.5:1
 * against fixed text colors, accents 3:1 against their background.
 */
export function brandThemes(palette: PaletteColor[], base: ThemeTokens, editable: ThemeKey[]): BrandSuggestion[] {
  // Near-white and near-black are usually icon backgrounds or outlines, not the brand.
  const usable = palette.filter((c) => c.l > 0.08 && c.l < 0.94);
  const pool = usable.length > 0 ? usable : palette;
  if (pool.length === 0) return [];

  const vivid = [...pool].sort((a, b) => b.s * Math.sqrt(b.weight) - a.s * Math.sqrt(a.weight))[0].hex;
  const dominant = pool[0].hex;
  const second = pool.find((c) => c.hex !== dominant && dist(parseHex(c.hex)!, parseHex(dominant)!) > 80)?.hex;

  const bg = base.background ?? "#FFFFFF";
  const fg = base.foreground ?? "#16131F";
  const can = (key: ThemeKey) => editable.includes(key);
  const primaryFollowsAccent = base.primary !== undefined && base.primary === base.accent;
  const shadeOf = (color: string) =>
    mixHex(color, base.primary && base.background && luminance(parseHex(base.primary) ?? [0, 0, 0]) > luminance(parseHex(base.background) ?? [0, 0, 0]) ? "#FFFFFF" : "#000000", 0.25) ?? color;

  const only = (theme: ThemeTokens): ThemeTokens =>
    Object.fromEntries(Object.entries(theme).filter(([key, value]) => value && can(key as ThemeKey))) as ThemeTokens;

  const out: BrandSuggestion[] = [];

  // Accent: the template's look, the brand's highlight color.
  const accent = ensureContrast(vivid, bg, 3);
  out.push({ id: "accent", label: "Accent", theme: only({ accent, primary: primaryFollowsAccent ? accent : undefined }) });

  if (can("background")) {
    // Bold: the brand color fills the background.
    const textFixed = !can("foreground");
    const boldFg = textFixed ? fg : contrast(dominant, "#FFFFFF") >= contrast(dominant, "#16131F") ? "#FFFFFF" : "#16131F";
    const boldBg = ensureContrast(dominant, boldFg, 4.5);
    const boldAccent = ensureContrast(second ?? vivid, boldBg, 3);
    out.push({
      id: "bold",
      label: "Bold",
      theme: only({ background: boldBg, foreground: textFixed ? undefined : boldFg, accent: boldAccent, primary: primaryFollowsAccent ? boldAccent : shadeOf(boldBg) }),
    });

    // Soft: a light (or deep) tint of the brand color, brand accent on top.
    const darkText = luminance(parseHex(fg) ?? [0, 0, 0]) < 0.5;
    const tint = mixHex(vivid, darkText ? "#FFFFFF" : "#0B0B12", darkText ? 0.86 : 0.8) ?? bg;
    const softBg = ensureContrast(tint, fg, 4.5);
    const softAccent = ensureContrast(vivid, softBg, 3);
    out.push({ id: "soft", label: "Soft", theme: only({ background: softBg, accent: softAccent, primary: primaryFollowsAccent ? softAccent : shadeOf(softBg) }) });
  }

  // Drop empty or repeated suggestions.
  const seen = new Set<string>();
  return out.filter((s) => {
    const key = JSON.stringify(s.theme);
    if (Object.keys(s.theme).length === 0 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
