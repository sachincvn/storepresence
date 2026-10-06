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

/** Angle presets for devices: turned left or right, lying flat, or isometric. */
export type Perspective = "left" | "right" | "flat" | "iso";

/** phone = punch-hole camera, phone-island = pill-shaped camera, flat = screen only. */
export type DeviceKey = "phone" | "phone-island" | "flat";

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

export type PatternKind = "grid" | "dots" | "lines";

export type Background =
  | { type: "solid"; color: Color }
  | ({ type: "linear" } & LinearGradient)
  | { type: "radial"; cx: number; cy: number; stops: GradientStop[] }
  /** Soft color blobs over `colors[0]`, laid out across the whole set (seeded, deterministic). */
  | { type: "mesh"; colors: Color[]; seed?: number }
  /** Solid `color` with a fine `ink` pattern, continuous across slides. */
  | { type: "pattern"; color: Color; ink: Color; pattern: PatternKind; size?: number; opacity?: number }
  /**
   * A tilted wall of the project's own screenshots, continuous across slides,
   * softly blurred and covered with `color` at `dim` (0–1) so text stays readable.
   */
  | { type: "collage"; color: Color; dim?: number; blur?: number; tilt?: number; seed?: number };

/** Position and size in template canvas pixels. */
type Box = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, clockwise, around the box center. */
  rotation?: number;
  /** Uniform scale around the box center (text, devices and shadows scale together). */
  scale?: number;
  /** 0–1 */
  opacity?: number;
  /** Extra elements default to "back" (behind layout elements). */
  layer?: "back" | "front";
};

/** Look of `**emphasized**` words in text. Unset fields keep the base style. */
export type TextEmphasis = {
  color?: Color;
  weight?: number;
  font?: FontKey;
};

export type TextElement = Box & {
  type: "text";
  /**
   * May contain `{{variable}}` placeholders. Inline markup in the text or in
   * user values: `**word**` = emphasis, `==word==` = highlighter mark.
   */
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
  /** Style for `**word**`. Defaults to the accent color. */
  emphasis?: TextEmphasis;
  /** Highlighter color for `==word==`. Defaults to the accent color. */
  marker?: Color;
};

export type ScreenshotElement = Box & {
  type: "screenshot";
  /**
   * 0 = the slide's own screenshot, 1 = the next one, and so on. In the
   * panorama (phones that straddle slides) it is the screenshot's position in
   * the upload list, wrapping.
   */
  slot: number;
  /** Shows the device at an angle. Fits within the same box. */
  perspective?: Perspective;
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

/* ---------- Social proof blocks (drawn in code, text via placeholders) ---------- */

type BlockAlign = "left" | "center" | "right";

/** Stars + score + label, e.g. ★★★★★ 4.9 · 120K ratings. Partial stars follow the score. */
export type RatingElement = Box & {
  type: "rating";
  score: string;
  label: string;
  color: Color;
  starColor: Color;
  align?: BlockAlign;
};

/** Award wreath with a title and optional subtitle and stars. Generic, never a store-branded award. */
export type LaurelsElement = Box & {
  type: "laurels";
  title: string;
  subtitle?: string;
  color: Color;
  leafColor?: Color;
  stars?: boolean;
  starColor?: Color;
};

/** Big number with a label, e.g. "10M+" / "people learning". */
export type StatElement = Box & {
  type: "stat";
  value: string;
  label: string;
  color: Color;
  font?: FontKey;
  align?: BlockAlign;
};

/** Review card: stars, quote and author. The card hugs its content. */
export type ReviewElement = Box & {
  type: "review";
  quote: string;
  author: string;
  color: Color;
  cardColor: Color;
  starColor: Color;
  /** Quote font size; shrinks to fit. */
  size?: number;
  radius?: number;
  shadow?: Shadow;
};

export type BlockElement = RatingElement | LaurelsElement | StatElement | ReviewElement;

export type ImageSlotKey = "appIcon" | "logo" | "mascot";

/**
 * A spot for the user's own image (app icon, logo, mascot). Empty slots draw
 * nothing, or a monogram tile when `monogram` is set (good for app icons).
 */
export type ImageSlotElement = Box & {
  type: "imageSlot";
  key: ImageSlotKey;
  fit: FitMode;
  radius?: number;
  shadow?: Shadow;
  /** Fallback tile: first letter of `text` on `fill`. */
  monogram?: { text: string; fill: Color; color: Color };
};

/** Rectangle in fractions (0–1) of a source image. */
export type NormRect = { x: number; y: number; w: number; h: number };

export type CalloutStyle = "card" | "glass" | "bubble";

/**
 * Pop-out: an area of a screenshot shown enlarged on its own panel, usually
 * overlapping the phone. The enlarged area keeps its aspect ratio and is
 * centered in the box; the panel hugs it.
 */
export type CalloutElement = Box & {
  type: "callout";
  /** Screenshot it enlarges, like `screenshot.slot`. Must match a screenshot element on the slide. */
  slot: number;
  /** Default area, in fractions of the screenshot. Users re-pick it per slide. */
  region: NormRect;
  /** card = solid panel with shadow, glass = frosted panel, bubble = card with a chat tail. Defaults to card. */
  style?: CalloutStyle;
  /** Panel color (card, bubble) or tint (glass). Defaults to white / translucent white. */
  fill?: Color;
  /** Space between the panel edge and the enlarged area. Defaults to 16; 0 shows the area alone. */
  padding?: number;
  /** Panel corner radius. Defaults to 40. */
  radius?: number;
  shadow?: Shadow;
  stroke?: { color: Color; width: number };
  /** "y": the box moves up or down to sit over its area on the phone, so the area lifts out in place. */
  follow?: "y";
  /** Bubble only: which side the tail is on, and where along it (0–1). Defaults to bottom, 0.25. */
  tail?: "top" | "bottom" | "left" | "right";
  tailAt?: number;
};

export type TemplateElement = TextElement | ScreenshotElement | ShapeElement | ImageElement | BlockElement | ImageSlotElement | CalloutElement;

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
  /**
   * Layouts users may switch a slide to. Defaults to every registered layout
   * with the same canvas size.
   */
  layoutChoices?: string[];
};

export type ResolvedSlideDesign = {
  /** Layout this design uses, if any. */
  layout?: string;
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
  /** Layouts a slide can switch to, in picker order. */
  layoutChoices: string[];
  /** Per design index: the same slide rebuilt on each layout choice. */
  alternates: Record<string, ResolvedSlideDesign>[];
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
  /** Width of the whole set (canvas width × slide designs), for set-wide backgrounds. */
  setWidth: number;
  elements: TemplateElement[];
  /** Index = screenshot slot. `null` = no screenshot for that slot yet. */
  screenshots: (Screenshot | null)[];
  /** User images for image slots. */
  images: Partial<Record<ImageSlotKey, Screenshot>>;
  /** Screenshots for a collage background (empty otherwise). */
  collage: Screenshot[];
};
