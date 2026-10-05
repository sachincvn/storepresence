import type { Screenshot } from "./project";

/**
 * Template model. A template is a *set*: several slide designs (each with
 * its own layout and background) plus an optional panorama layer that spans
 * the whole set, so the store carousel reads as one connected piece.
 * Templates are JSON data; the renderer turns template + project into pixels.
 */

/** Theme keys every template provides. Elements reference them as `$key`. */
export type ThemeKey = "background" | "foreground" | "primary" | "accent" | "surface";

export type ThemeTokens = Partial<Record<ThemeKey, string>>;

/** A literal CSS color (`#3D5AFE`, `rgba(...)`) or a theme token (`$primary`). */
export type Color = string;

export type FontKey = "display" | "sans" | "serif";

export type FitMode = "contain" | "cover";

/** Where the image sits in the slot when it does not fill it exactly. */
export type FitAlign = "center" | "top";

export type DeviceKey = "phone";

export type Shadow = {
  x?: number;
  y?: number;
  /** 0 = hard offset shadow (neo-brutalist). */
  blur: number;
  color: Color;
};

export type GradientStop = {
  color: Color;
  /** 0–1 */
  at: number;
};

export type LinearGradient = {
  /** CSS convention: 0 = to top, 90 = to right, 180 = to bottom. */
  angle: number;
  stops: GradientStop[];
};

export type Background =
  | { type: "solid"; color: Color }
  | ({ type: "linear" } & LinearGradient)
  | { type: "radial"; cx: number; cy: number; stops: GradientStop[] };

/** Position and size in template canvas pixels. */
type Box = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, clockwise, around the box center. */
  rotation?: number;
  /** 0–1 */
  opacity?: number;
  /** Extra elements default to "back" (behind layout elements). */
  layer?: "back" | "front";
};

export type TextElement = Box & {
  type: "text";
  /** May contain `{{variable}}` placeholders. */
  text: string;
  font: FontKey;
  size: number;
  /** Auto-shrink floor when text does not fit `maxLines`. Defaults to `size`. */
  minSize?: number;
  weight: number;
  lineHeight?: number;
  /** In em, like CSS (e.g. -0.03). */
  letterSpacing?: number;
  align: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  color: Color;
  maxLines?: number;
  /** Draws the text inside a rounded badge sized to the text. */
  pill?: {
    fill: Color;
    paddingX?: number;
    paddingY?: number;
    radius?: number;
    stroke?: { color: Color; width: number };
  };
};

export type ScreenshotElement = Box & {
  type: "screenshot";
  /** 0 = the slide's own screenshot, 1 = the next one, and so on. */
  slot: number;
  fit: FitMode;
  align?: FitAlign;
  radius?: number;
  shadow?: Shadow;
  /** Code-drawn device frame. The editor can switch it off. */
  device?: DeviceKey;
  /** Device body color. Defaults to near-black. */
  frameColor?: Color;
  /** Shown when no screenshot is assigned. */
  placeholderColor?: Color;
};

export type ShapeElement = Box & {
  type: "shape";
  shape: "rect" | "circle" | "pill";
  fill: Color;
  /** Replaces `fill` with a gradient across the shape's box. */
  gradient?: LinearGradient;
  /** flat = plain fill, clay = soft 3D shading, halftone = dot pattern. */
  style?: "flat" | "clay" | "halftone";
  /** Gaussian blur in px. Large values turn shapes into soft glows (mesh-gradient look). */
  blur?: number;
  radius?: number;
  stroke?: { color: Color; width: number };
  shadow?: Shadow;
};

export type ImageElement = Box & {
  type: "image";
  /** URL of a static asset, e.g. `/templates/<id>/logo.png` (file in `public/`). */
  src: string;
  fit: FitMode;
  radius?: number;
};

export type TemplateElement = TextElement | ScreenshotElement | ShapeElement | ImageElement;

export type TemplateVariable = {
  key: string;
  label: string;
  default: string;
  /** Each slide gets its own value (e.g. headline). Otherwise one value for the set. */
  perSlide?: boolean;
  multiline?: boolean;
  maxLength?: number;
};

export type Canvas = {
  width: number;
  height: number;
};

/** Shared geometry that many slide designs can reuse. */
export type Layout = {
  id: string;
  canvas: Canvas;
  variables: TemplateVariable[];
  elements: TemplateElement[];
};

/** Partial edits to a layout element, matched by id. `type` cannot change. */
export type ElementOverride = Partial<Omit<TemplateElement, "type" | "id">> & Record<string, unknown>;

/** One slide of the set. Slides repeat in order when there are more screenshots than designs. */
export type SlideDesign = {
  /** Id of a shared layout. */
  layout?: string;
  /** Replaces the template background for this slide. */
  background?: Background;
  /** Edits to this slide's layout elements; win over template-level overrides. */
  overrides?: Record<string, ElementOverride>;
  /** Extra elements on this slide only. */
  elements?: TemplateElement[];
  /** Default text for this slide, by variable key. */
  defaults?: Record<string, string>;
};

export type Template = {
  id: string;
  name: string;
  category: string;
  description?: string;
  canvas: Canvas;
  theme: ThemeTokens;
  /** Theme keys the user may recolor in the editor. Must be #RRGGBB in `theme`. */
  editableColors?: ThemeKey[];
  /** Default slide background. */
  background: Background;
  /** Film grain over the background, 0–0.3. */
  grain?: number;
  /** Added to the layouts' variables; same key replaces. */
  variables?: TemplateVariable[];
  /** Edits applied to layout elements on every slide, by element id. */
  overrides?: Record<string, ElementOverride>;
  /** Elements repeated on every slide. */
  elements?: TemplateElement[];
  /**
   * Elements drawn across the whole set. x runs from 0 to
   * `canvas.width × slides.length`; each slide shows its own segment.
   */
  panorama?: TemplateElement[];
  slides: SlideDesign[];
};

export type ResolvedSlideDesign = {
  background: Background;
  elements: TemplateElement[];
  /** Screenshots this slide shows. */
  slots: number;
  defaults: Record<string, string>;
};

/** Fully merged template the renderer draws. Tokens and variables are still unresolved. */
export type ResolvedTemplate = {
  id: string;
  name: string;
  category: string;
  description?: string;
  canvas: Canvas;
  variables: TemplateVariable[];
  theme: ThemeTokens;
  editableColors: ThemeKey[];
  grain: number;
  panorama: TemplateElement[];
  designs: ResolvedSlideDesign[];
};

/**
 * Everything needed to draw one output image: colors are literal,
 * placeholders filled, device frames removed when switched off.
 */
export type SlideSpec = {
  canvas: Canvas;
  background: Background;
  grain: number;
  panorama: TemplateElement[];
  /** Horizontal offset of this slide inside the panorama. */
  panoramaOffset: number;
  elements: TemplateElement[];
  /** Index = screenshot slot. `null` = no screenshot for that slot yet. */
  screenshots: (Screenshot | null)[];
};
