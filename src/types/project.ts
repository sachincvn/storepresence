import type { ImageSlotKey, NormRect, ThemeTokens } from "./template";

/** Headline font picked in the editor; undefined = the template's own. */
export type HeadlineFontId = "grotesk" | "serif" | "sans";

/** An uploaded image held in browser memory only. */
export type Screenshot = {
  id: string;
  name: string;
  /** Object URL; revoke when the screenshot is removed. */
  url: string;
  width: number;
  height: number;
};

/**
 * One slide in a user-arranged set. Exists only after the user adds, removes,
 * reorders or re-assigns slides; until then slides follow the screenshots.
 */
export type SlideEntry = {
  /** Key for this slide's text, layout and callout choices. */
  key: string;
  /** Screenshot id shown in slot 0, or null for a text-only slide. */
  shot: string | null;
  /** Template design index (background, default text). Wraps when the template has fewer designs. */
  design: number;
};

export type Project = {
  templateId: string;
  /** Upload order = slide order. */
  screenshots: Screenshot[];
  /** Values for non-per-slide variables. */
  variables: Record<string, string>;
  /** Per-slide variable values, keyed by the slide's screenshot id so text follows reordering. */
  slideVariables: Record<string, Record<string, string>>;
  /** User color overrides on top of the template theme. */
  theme: ThemeTokens;
  deviceFrame: boolean;
  headlineFont?: HeadlineFontId;
  /** Overrides the template's device model on every slide (only where the template shows a device). */
  deviceModel?: "phone" | "phone-island" | "flat";
  /** Overrides the device body color. */
  deviceColor?: string;
  /** Replaces template backgrounds with a generated one; `seed` changes with "Shuffle". */
  backdrop?: { kind: "mesh" | "grid" | "dots" | "collage"; seed: number };
  /** User images for template image slots (app icon, logo, mascot). */
  images?: Partial<Record<ImageSlotKey, Screenshot>>;
  /** Per-slide layout picks, keyed like `slideVariables`. */
  slideLayouts?: Record<string, string>;
  /** Per-slide callout areas by element id, keyed like `slideVariables`. `null` hides that callout. */
  calloutRegions?: Record<string, Record<string, NormRect | null>>;
  /** Store sizes to export (ids from `OUTPUT_SIZES`). Undefined = Google Play phone only. */
  exportSizes?: string[];
  /** User-arranged slides. Undefined = one slide per screenshot (text-only designs added in place). */
  slides?: SlideEntry[];
};
