import type { ThemeTokens } from "./template";

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
};
