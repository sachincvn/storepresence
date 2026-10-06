/** Mixes two #RRGGBB / #RGB colors; t = 0 gives `a`, 1 gives `b`. Returns null for other formats. */
export function mixHex(a: string, b: string, t: number): string | null {
  const parse = (c: string) => {
    const m = c.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m) return null;
    const h = m[1].length === 3 ? m[1].replace(/./g, (x) => x + x) : m[1];
    const n = Number.parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const ca = parse(a);
  const cb = parse(b);
  if (!ca || !cb) return null;
  const mixed = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}
