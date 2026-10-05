import { mixHex } from "@/lib/color";
import type { Project } from "@/types/project";
import { regionCenterY } from "@/renderer/calloutRenderer";
import { getHeadlineFont, HEADLINE_FONT_KEYS, type HeadlineFont } from "./headlineFonts";
import type {
  Background,
  CalloutElement,
  Color,
  ElementOverride,
  ImageSlotKey,
  Layout,
  NormRect,
  ResolvedSlideDesign,
  ResolvedTemplate,
  ScreenshotElement,
  Shadow,
  SlideDesign,
  SlideSpec,
  Template,
  TemplateElement,
  TemplateVariable,
  ThemeKey,
  ThemeTokens,
} from "@/types/template";

const PLACEHOLDER = /\{\{\s*([\w-]+)\s*\}\}/g;

const isBack = (el: TemplateElement) => el.layer !== "front";
const isFront = (el: TemplateElement) => el.layer === "front";

/**
 * Merges every slide design with its layout. Draw order per slide:
 * template back → slide back → layout (with overrides) → slide front → template front.
 * Assumes the template passed `validateTemplate`.
 */
export function resolveTemplate(template: Template, layouts: readonly Layout[]): ResolvedTemplate {
  const find = (id: string, where: string) => {
    const layout = layouts.find((l) => l.id === id);
    if (!layout) throw new Error(`Template "${template.id}" ${where} uses unknown layout "${id}"`);
    return layout;
  };

  const designs = template.slides.map((design, i) =>
    buildDesign(template, design, design.layout ? find(design.layout, `slide ${i + 1}`) : undefined, true),
  );

  // Picker order: layouts the template itself uses, then any other compatible ones.
  const own = [...new Set(template.slides.flatMap((d) => (d.layout ? [d.layout] : [])))];
  const compatible = layouts
    .filter((l) => l.canvas.width === template.canvas.width && l.canvas.height === template.canvas.height)
    .map((l) => l.id);
  const layoutChoices = template.layoutChoices ?? [...own, ...compatible.filter((id) => !own.includes(id))];
  const choiceLayouts = layoutChoices.map((id) => find(id, "layoutChoices"));

  const alternates = template.slides.map((design) =>
    Object.fromEntries(choiceLayouts.map((l) => [l.id, buildDesign(template, design, l, l.id === design.layout)])),
  );

  const usedLayouts = [...new Set([...own.map((id) => find(id, "slides")), ...choiceLayouts])];

  return {
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    canvas: template.canvas,
    variables: mergeVariables([...usedLayouts.flatMap((l) => l.variables), ...(template.variables ?? [])]),
    theme: template.theme,
    editableColors: template.editableColors ?? [],
    grain: template.grain ?? 0,
    panorama: template.panorama ?? [],
    designs,
    layoutChoices,
    alternates,
  };
}

/**
 * One slide on one layout. Draw order:
 * template back → slide back → layout (with overrides) → slide front → template front.
 * Slide-level overrides were written for the slide's own layout, so they only
 * apply when `ownLayout` is true.
 */
function buildDesign(template: Template, design: SlideDesign, layout: Layout | undefined, ownLayout: boolean): ResolvedSlideDesign {
  const shared = template.elements ?? [];
  const base = (layout?.elements ?? []).map((el) => {
    const withTemplate = applyOverride(el, template.overrides?.[el.id]);
    return ownLayout ? applyOverride(withTemplate, design.overrides?.[el.id]) : withTemplate;
  });
  const extra = design.elements ?? [];
  const elements = [...shared.filter(isBack), ...extra.filter(isBack), ...base, ...extra.filter(isFront), ...shared.filter(isFront)];

  return {
    layout: layout?.id,
    background: design.background ?? template.background,
    elements,
    slots: elements.reduce((n, el) => (el.type === "screenshot" || el.type === "callout" ? Math.max(n, el.slot + 1) : n), 0),
    defaults: design.defaults ?? {},
  };
}

function applyOverride(el: TemplateElement, override: ElementOverride | undefined): TemplateElement {
  if (!override) return el;
  // Shallow merge: nested objects such as `shadow` are replaced as a whole.
  return { ...el, ...override, type: el.type, id: el.id } as TemplateElement;
}

/** First occurrence keeps its position; later ones with the same key replace it. */
function mergeVariables(list: TemplateVariable[]): TemplateVariable[] {
  const byKey = new Map<string, TemplateVariable>();
  for (const v of list) byKey.set(v.key, v);
  return [...byKey.values()];
}

/** Template theme with the user's colors applied, only for keys the template allows. */
export function themeFor(template: ResolvedTemplate, project: Pick<Project, "theme">): ThemeTokens {
  const theme = { ...template.theme };
  for (const key of template.editableColors) {
    const value = project.theme[key];
    if (value) theme[key] = value;
  }
  return theme;
}

export function resolveColor(value: Color, theme: ThemeTokens): string {
  if (!value.startsWith("$")) return value;
  const color = theme[value.slice(1) as ThemeKey];
  if (!color) throw new Error(`Unknown theme token "${value}"`);
  return color;
}

export function listPlaceholders(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((m) => m[1]);
}

/** Unknown placeholders become empty strings. */
export function fillPlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(PLACEHOLDER, (_, key: string) => values[key] ?? "");
}

/** The slide's design, honouring a user layout pick when a project is given. */
export function designFor(
  template: ResolvedTemplate,
  slideIndex: number,
  project?: Pick<Project, "screenshots" | "slideLayouts">,
): ResolvedSlideDesign {
  const index = slideIndex % template.designs.length;
  const picked = project?.slideLayouts?.[getSlideKey(template, project, slideIndex)];
  return (picked && template.alternates[index]?.[picked]) || template.designs[index];
}

/** Callout elements on a slide (respecting the user's layout pick). */
export function slideCallouts(template: ResolvedTemplate, slideIndex: number, project?: Pick<Project, "screenshots" | "slideLayouts">) {
  return designFor(template, slideIndex, project).elements.filter((el): el is CalloutElement => el.type === "callout");
}

/** Image slot keys used anywhere in the template, including layouts users can switch to. */
export function usedImageSlots(template: ResolvedTemplate): ImageSlotKey[] {
  const all = [...template.panorama, ...template.designs.flatMap((d) => d.elements), ...template.alternates.flatMap((a) => Object.values(a).flatMap((d) => d.elements))];
  const keys = new Set(all.flatMap((el) => (el.type === "imageSlot" ? [el.key] : [])));
  return (["appIcon", "logo", "mascot"] as const).filter((k) => keys.has(k));
}

/** Every user-visible string of an element (placeholders live here). */
export function elementTexts(el: TemplateElement): string[] {
  switch (el.type) {
    case "text":
      return [el.text];
    case "rating":
      return [el.score, el.label];
    case "laurels":
      return [el.title, el.subtitle ?? ""];
    case "stat":
      return [el.value, el.label];
    case "review":
      return [el.quote, el.author];
    case "imageSlot":
      return el.monogram ? [el.monogram.text] : [];
    default:
      return [];
  }
}

/** One slide per screenshot. Before any upload, the template's full set is shown. */
export function getSlideCount(template: ResolvedTemplate, project: Pick<Project, "screenshots">): number {
  return project.screenshots.length || template.designs.length;
}

/** Per-slide text is stored under the slide's screenshot id, so it follows reordering. */
export function getSlideKey(_template: ResolvedTemplate, project: Pick<Project, "screenshots">, slideIndex: number): string {
  return project.screenshots[slideIndex]?.id ?? `slide-${slideIndex}`;
}

/** Variables whose placeholders appear on this slide (e.g. a badge only some layouts have). */
export function variablesForSlide(
  template: ResolvedTemplate,
  slideIndex: number,
  project?: Pick<Project, "screenshots" | "slideLayouts">,
): TemplateVariable[] {
  const used = new Set(designFor(template, slideIndex, project).elements.flatMap((el) => elementTexts(el).flatMap(listPlaceholders)));
  return template.variables.filter((v) => used.has(v.key));
}

/**
 * Variable values for one slide: user value, else the slide design's default,
 * else the variable default. An empty string is a valid user value.
 */
export function getSlideValues(template: ResolvedTemplate, project: Project, slideIndex: number): Record<string, string> {
  const perSlide = project.slideVariables[getSlideKey(template, project, slideIndex)] ?? {};
  const defaults = designFor(template, slideIndex, project).defaults;
  const values: Record<string, string> = {};
  for (const v of template.variables) {
    const user = v.perSlide ? perSlide[v.key] : project.variables[v.key];
    values[v.key] = user ?? defaults[v.key] ?? v.default;
  }
  return values;
}

/** Flattens template + project into a draw-ready spec for one output image. */
export function resolveSlide(template: ResolvedTemplate, project: Project, slideIndex: number): SlideSpec {
  const theme = themeFor(template, project);
  const values = getSlideValues(template, project, slideIndex);
  const color = (c: Color) => resolveColor(c, theme);
  const design = designFor(template, slideIndex, project);
  const shots = project.screenshots;
  const regions = project.calloutRegions?.[getSlideKey(template, project, slideIndex)] ?? {};
  const ctx: ResolveContext = {
    regions,
    color,
    values,
    deviceFrame: project.deviceFrame,
    deviceModel: project.deviceModel,
    deviceColor: project.deviceColor,
    headlineFont: getHeadlineFont(project.headlineFont),
    accent: theme.accent ?? theme.foreground ?? "#000000",
  };
  const resolve = (el: TemplateElement) => resolveElement(el, ctx);
  // Extra phones show the following screenshots, wrapping around.
  const screenshots = Array.from({ length: design.slots }, (_, slot) => (shots.length > 0 ? shots[(slideIndex + slot) % shots.length] : null));
  // A callout set to null is hidden on this slide.
  const elements = design.elements.filter((el) => !(el.type === "callout" && regions[el.id] === null)).map(resolve);

  return {
    canvas: template.canvas,
    background: resolveBackground(project.backdrop ? backdropBackground(project.backdrop, theme) : design.background, color),
    grain: template.grain,
    panorama: template.panorama.map(resolve),
    panoramaOffset: (slideIndex % template.designs.length) * template.canvas.width,
    setWidth: template.canvas.width * template.designs.length,
    elements: elements.map((el) => (el.type === "callout" && el.follow === "y" ? followSource(el, elements, screenshots, template.canvas.height) : el)),
    images: project.images ?? {},
    screenshots,
  };
}

/** Moves a callout so its box is centered on its area as drawn on the phone. */
function followSource(el: CalloutElement, elements: TemplateElement[], screenshots: SlideSpec["screenshots"], canvasHeight: number): CalloutElement {
  const shot = elements.find((e): e is ScreenshotElement => e.type === "screenshot" && e.slot === el.slot);
  const image = screenshots[el.slot];
  if (!shot || !image) return el;
  const center = regionCenterY(shot, { w: image.width, h: image.height }, el.region);
  if (center === null) return el;
  return { ...el, y: Math.min(canvasHeight - el.height, Math.max(0, center - el.height / 2)) };
}

type ColorFn = (c: Color) => string;

function resolveBackground(bg: Background, color: ColorFn): Background {
  switch (bg.type) {
    case "solid":
      return { ...bg, color: color(bg.color) };
    case "mesh":
      return { ...bg, colors: bg.colors.map(color) };
    case "pattern":
      return { ...bg, color: color(bg.color), ink: color(bg.ink) };
    default:
      return { ...bg, stops: bg.stops.map((s) => ({ ...s, color: color(s.color) })) };
  }
}

/** The user's generated background, built from the template's own theme colors. */
export function backdropBackground(backdrop: NonNullable<Project["backdrop"]>, theme: ThemeTokens): Background {
  if (backdrop.kind === "mesh") {
    // Harmonious blobs: the background mixed towards the accent, white and black.
    const bg = theme.background ?? "#FFFFFF";
    const accent = theme.accent ?? theme.primary ?? bg;
    const mixed = [mixHex(bg, accent, 0.65), mixHex(bg, "#FFFFFF", 0.35), mixHex(bg, accent, 0.35), mixHex(bg, "#000000", 0.28)];
    const tones = mixed.every((c): c is string => c !== null)
      ? mixed
      : (["accent", "primary", "surface"] as const).filter((k) => theme[k] && theme[k] !== theme.background).map((k) => "$" + k);
    // Rotate blob colors with the seed so "Shuffle" changes more than positions.
    const shift = backdrop.seed % Math.max(1, tones.length);
    return { type: "mesh", colors: ["$background", ...tones.slice(shift), ...tones.slice(0, shift)], seed: backdrop.seed };
  }
  return {
    type: "pattern",
    color: "$background",
    ink: theme.foreground ? "$foreground" : "#000000",
    pattern: backdrop.kind,
    size: backdrop.kind === "dots" ? 48 + (backdrop.seed % 3) * 12 : 54 + (backdrop.seed % 3) * 18,
    opacity: backdrop.kind === "dots" ? 0.16 : 0.08,
  };
}

function resolveShadow(shadow: Shadow | undefined, color: ColorFn): Shadow | undefined {
  return shadow && { ...shadow, color: color(shadow.color) };
}

type ResolveContext = {
  color: ColorFn;
  /** User callout areas for this slide, by element id. */
  regions: Record<string, NormRect | null>;
  values: Record<string, string>;
  deviceFrame: boolean;
  deviceModel: Project["deviceModel"];
  deviceColor: string | undefined;
  headlineFont: HeadlineFont | undefined;
  /** Literal accent color, the default for emphasis and markers. */
  accent: string;
};

function resolveElement(el: TemplateElement, { color, values, regions, deviceFrame, deviceModel, deviceColor, headlineFont, accent }: ResolveContext): TemplateElement {
  const fill = (text: string) => fillPlaceholders(text, values);
  switch (el.type) {
    case "text":
      return {
        ...el,
        // User font choice swaps headline type only; body text keeps the template's font.
        ...(headlineFont && HEADLINE_FONT_KEYS.includes(el.font)
          ? { font: headlineFont.font, weight: headlineFont.weight, letterSpacing: headlineFont.letterSpacing, lineHeight: headlineFont.lineHeight }
          : {}),
        text: fill(el.text),
        color: color(el.color),
        emphasis: { ...el.emphasis, color: el.emphasis?.color ? color(el.emphasis.color) : accent },
        marker: el.marker ? color(el.marker) : accent,
        pill: el.pill && {
          ...el.pill,
          fill: color(el.pill.fill),
          stroke: el.pill.stroke && { ...el.pill.stroke, color: color(el.pill.stroke.color) },
        },
      };
    case "screenshot":
      return {
        ...el,
        shadow: resolveShadow(el.shadow, color),
        frameColor: deviceColor ?? (el.frameColor && color(el.frameColor)),
        placeholderColor: el.placeholderColor && color(el.placeholderColor),
        // User model choice applies only where the template shows a device.
        device: deviceFrame && el.device ? (deviceModel ?? el.device) : undefined,
      };
    case "shape":
      return {
        ...el,
        fill: color(el.fill),
        gradient: el.gradient && { ...el.gradient, stops: el.gradient.stops.map((s) => ({ ...s, color: color(s.color) })) },
        stroke: el.stroke && { ...el.stroke, color: color(el.stroke.color) },
        shadow: resolveShadow(el.shadow, color),
      };
    case "image":
      return el;
    case "callout":
      return {
        ...el,
        region: regions[el.id] ?? el.region,
        fill: el.fill && color(el.fill),
        stroke: el.stroke && { ...el.stroke, color: color(el.stroke.color) },
        shadow: resolveShadow(el.shadow, color),
      };
    case "rating":
      return { ...el, score: fill(el.score), label: fill(el.label), color: color(el.color), starColor: color(el.starColor) };
    case "laurels":
      return {
        ...el,
        title: fill(el.title),
        subtitle: el.subtitle && fill(el.subtitle),
        color: color(el.color),
        leafColor: el.leafColor && color(el.leafColor),
        starColor: el.starColor && color(el.starColor),
      };
    case "stat":
      return { ...el, value: fill(el.value), label: fill(el.label), color: color(el.color) };
    case "imageSlot":
      return {
        ...el,
        shadow: resolveShadow(el.shadow, color),
        monogram: el.monogram && { text: fill(el.monogram.text), fill: color(el.monogram.fill), color: color(el.monogram.color) },
      };
    case "review":
      return {
        ...el,
        quote: fill(el.quote),
        author: fill(el.author),
        color: color(el.color),
        cardColor: color(el.cardColor),
        starColor: color(el.starColor),
        shadow: resolveShadow(el.shadow, color),
      };
  }
}
