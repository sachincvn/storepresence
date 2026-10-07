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
  backdrop?: { kind: "mesh" | "grid" | "dots"; seed: number };
  /** User images for template image slots (app icon, logo, mascot). */
  images?: Partial<Record<ImageSlotKey, Screenshot>>;
  /**
   * Per-slide pop-out areas by callout element id, keyed like `slideVariables`.
   * `null` hides that pop-out on the slide; a missing id keeps the template's area.
   */
  calloutRegions?: Record<string, Record<string, NormRect | null>>;
  /** Store sizes to export (ids from `OUTPUT_SIZES`). Undefined = Google Play phone only. */
  exportSizes?: string[];
};
