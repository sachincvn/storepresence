import type { HeadlineFontId } from "@/types/project";
import type { FontKey } from "@/types/template";

export type HeadlineFont = {
  id: HeadlineFontId;
  label: string;
  font: FontKey;
  weight: number;
  letterSpacing: number;
  lineHeight: number;
};

/**
 * Headline font choices offered in the editor. Each carries the weight and
 * spacing that suit it, so switching never looks thin or cramped.
 */
export const HEADLINE_FONTS: readonly HeadlineFont[] = [
  { id: "grotesk", label: "Bold grotesk", font: "display", weight: 800, letterSpacing: -0.035, lineHeight: 1 },
  { id: "serif", label: "Editorial serif", font: "serif", weight: 500, letterSpacing: -0.02, lineHeight: 1.04 },
  { id: "sans", label: "Clean sans", font: "sans", weight: 800, letterSpacing: -0.03, lineHeight: 1.05 },
];

/** Fonts that count as headline type; body text (`sans`) is never swapped. */
export const HEADLINE_FONT_KEYS: readonly FontKey[] = ["display", "serif"];

export function getHeadlineFont(id: HeadlineFontId | undefined): HeadlineFont | undefined {
  return HEADLINE_FONTS.find((f) => f.id === id);
}
