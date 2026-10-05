import type { FontKey, TemplateElement } from "@/types/template";

/** Template font keys → CSS variables set by next/font in `app/layout.tsx`. */
const FONT_VARS: Record<FontKey, string> = {
  display: "--font-bricolage",
  sans: "--font-jakarta",
  serif: "--font-fraunces",
};

const FALLBACK = "ui-sans-serif, system-ui, sans-serif";
const families = new Map<FontKey, string>();

export function fontFamily(key: FontKey): string {
  let family = families.get(key);
  if (!family) {
    const loaded = getComputedStyle(document.documentElement).getPropertyValue(FONT_VARS[key]).trim();
    family = loaded ? `${loaded}, ${FALLBACK}` : FALLBACK;
    families.set(key, family);
  }
  return family;
}

export function fontString(key: FontKey, weight: number, size: number): string {
  return `${weight} ${size}px ${fontFamily(key)}`;
}

/** Canvas does not wait for web fonts, so load every face a slide uses before drawing. */
export async function ensureFonts(elements: readonly TemplateElement[]): Promise<void> {
  const faces = new Set<string>();
  for (const el of elements) {
    if (el.type === "text" && el.text.trim()) faces.add(fontString(el.font, el.weight, 48));
  }
  await Promise.all([...faces].map((face) => document.fonts.load(face).catch(() => [])));
}
