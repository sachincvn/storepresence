import { mixHex } from "@/lib/color";
import type { Project, Screenshot, SlideEntry } from "@/types/project";
import { regionCenterY } from "@/renderer/calloutRenderer";
import { applyEdit, clampEdit } from "./edits";
import { blockElement } from "./blocks";
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

/** What slide lookups need from a project. */
export type SlideSource = Pick<Project, "screenshots" | "slideLayouts" | "slides" | "slideBlocks">;

/** One output image: which design it uses, its key for user choices, and its main screenshot. */
export type SlidePlan = { key: string; design: number; shot: Screenshot | null };

/**
 * The set's slides, in order.
 *
 * Without user-arranged slides, every screenshot gets one slide and designs
 * follow the template order. Text-only designs (no screenshot) appear once,
 * in place, without using up a screenshot; text designs after the last phone
 * design close the set. Before any upload the template's own set is shown.
 */
export function getSlides(template: ResolvedTemplate, project: SlideSource): SlidePlan[] {
  const shots = project.screenshots;
  const count = template.designs.length;
  if (project.slides && project.slides.length > 0) {
    const byId = new Map(shots.map((s) => [s.id, s]));
    return project.slides.map((entry) => ({ key: entry.key, design: entry.design % count, shot: entry.shot ? (byId.get(entry.shot) ?? null) : null }));
  }

  const phone = template.designs.flatMap((d, i) => (d.slots > 0 ? [i] : []));
  const text = (i: number): SlidePlan => ({ key: `text-${i}`, design: i, shot: null });
  if (phone.length === 0) return template.designs.map((_, i) => text(i));

  const plans: SlidePlan[] = [];
  const last = phone[phone.length - 1];
  let next = 0;
  for (let i = 0; i <= last; i++) {
    if (template.designs[i].slots === 0) plans.push(text(i));
    else if (shots.length === 0) plans.push({ key: `slide-${plans.length}`, design: i, shot: null });
    else if (next < shots.length) plans.push({ key: shots[next].id, design: i, shot: shots[next++] });
  }
  // More screenshots than phone designs: keep cycling the phone designs.
  for (let extra = 0; next < shots.length; extra++) {
    plans.push({ key: shots[next].id, design: phone[extra % phone.length], shot: shots[next++] });
  }
  for (let i = last + 1; i < count; i++) plans.push(text(i));
  return plans;
}

/** Turns the current slides into an editable list (before the first slide edit). */
export function slideEntries(template: ResolvedTemplate, project: SlideSource): SlideEntry[] {
  return getSlides(template, project).map((p) => ({ key: p.key, design: p.design, shot: p.shot?.id ?? null }));
}

/** Index of the first slide showing a screenshot, or -1. */
export function slideIndexForShot(template: ResolvedTemplate, project: SlideSource, shotId: string): number {
  return getSlides(template, project).findIndex((p) => p.shot?.id === shotId);
}

/** Screenshots a slide shows per slot: its own first, then the following ones, wrapping. */
export function slotScreenshots(template: ResolvedTemplate, project: SlideSource, slideIndex: number): (Screenshot | null)[] {
  const plan = getSlides(template, project)[slideIndex];
  const slots = designFor(template, slideIndex, project).slots;
  const shots = project.screenshots;
  const start = plan?.shot ? shots.indexOf(plan.shot) : -1;
  return Array.from({ length: slots }, (_, slot) => (start >= 0 ? shots[(start + slot) % shots.length] : null));
}

/** A layout without screenshots this design can switch to, for new text slides. */
export function textLayoutFor(template: ResolvedTemplate, design: number, preferred = "statement"): string | null {
  if (template.designs[design]?.slots === 0) return null;
  const options = Object.entries(template.alternates[design] ?? {}).filter(([, d]) => d.slots === 0);
  return (options.find(([id]) => id === preferred) ?? options[0])?.[0] ?? null;
}

/** The slide's design, honouring a user layout pick when a project is given. */
export function designFor(template: ResolvedTemplate, slideIndex: number, project?: SlideSource): ResolvedSlideDesign {
  const plan = project ? getSlides(template, project)[slideIndex] : undefined;
  const index = plan ? plan.design : slideIndex % template.designs.length;
  const picked = plan && project?.slideLayouts?.[plan.key];
  const design = (picked && template.alternates[index]?.[picked]) || template.designs[index];
  // Blocks the user added sit on top of the layout.
  const blocks = plan ? (project?.slideBlocks?.[plan.key] ?? []) : [];
  const extra = blocks.flatMap((b) => blockElement(template, b) ?? []).filter((el) => el.type !== "callout" || design.slots > 0);
  return extra.length > 0 ? { ...design, elements: [...design.elements, ...extra] } : design;
}

/** The slide's template design, ignoring any layout the user picked. */
export function ownDesign(template: ResolvedTemplate, slideIndex: number, project: SlideSource): ResolvedSlideDesign {
  const plan = getSlides(template, project)[slideIndex];
  return template.designs[plan ? plan.design : slideIndex % template.designs.length];
}

/** Callout elements on a slide (respecting the user's layout pick). */
export function slideCallouts(template: ResolvedTemplate, slideIndex: number, project?: SlideSource) {
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

export function getSlideCount(template: ResolvedTemplate, project: SlideSource): number {
  return getSlides(template, project).length;
}

/** Per-slide choices are stored under the slide's key (its screenshot id by default), so they follow reordering. */
export function getSlideKey(template: ResolvedTemplate, project: SlideSource, slideIndex: number): string {
  return getSlides(template, project)[slideIndex]?.key ?? `slide-${slideIndex}`;
}

/** Variables whose placeholders appear on this slide (e.g. a badge only some layouts have). */
export function variablesForSlide(
  template: ResolvedTemplate,
  slideIndex: number,
  project?: SlideSource,
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
/** Everything needed to turn a slide's template elements into draw-ready ones. */
export function slideContext(template: ResolvedTemplate, project: Project, slideIndex: number) {
  const theme = themeFor(template, project);
  const design = designFor(template, slideIndex, project);
  const regions = project.calloutRegions?.[getSlideKey(template, project, slideIndex)] ?? {};
  const color = (c: Color) => resolveColor(c, theme);
  const ctx: ResolveContext = {
    regions,
    color,
    values: getSlideValues(template, project, slideIndex),
    deviceFrame: project.deviceFrame,
    deviceModel: project.deviceModel,
    deviceColor: project.deviceColor,
    deviceAngle: project.deviceAngle,
    headlineFont: getHeadlineFont(project.headlineFont),
    accent: theme.accent ?? theme.foreground ?? "#000000",
  };
  return {
    design,
    regions,
    resolve: (el: TemplateElement) => resolveElement(el, ctx),
    background: resolveBackground(project.backdrop ? backdropBackground(project.backdrop, theme) : design.background, color),
  };
}

export function resolveSlide(template: ResolvedTemplate, project: Project, slideIndex: number): SlideSpec {
  const { design, regions, resolve, background } = slideContext(template, project, slideIndex);
  const plan = getSlides(template, project)[slideIndex];
  const slotShots = slotScreenshots(template, project, slideIndex);
  // Phones in the panorama show screenshots by their place in the upload list.
  const panoramaShots: SlideSpec["screenshots"] = [];
  const panorama = template.panorama.map(resolve).map((el) => {
    if (el.type !== "screenshot") return el;
    const shots = project.screenshots;
    panoramaShots.push(shots.length > 0 ? shots[el.slot % shots.length] : null);
    return { ...el, slot: slotShots.length + panoramaShots.length - 1 };
  });
  const screenshots = [...slotShots, ...panoramaShots];
  const edits = project.elementEdits?.[getSlideKey(template, project, slideIndex)] ?? {};
  // A callout set to null is hidden on this slide; any element can be hidden with an edit.
  const elements = design.elements
    .filter((el) => !(el.type === "callout" && regions[el.id] === null) && !edits[el.id]?.hidden)
    .map((el) => resolve(edits[el.id] ? applyEdit(el, clampEdit(el, edits[el.id], template.canvas)) : el));

  return {
    canvas: template.canvas,
    background,
    collage: background.type === "collage" ? project.screenshots : [],
    grain: template.grain,
    panorama,
    // Panorama segments belong to designs, so a slide shows its design's piece.
    panoramaOffset: (plan?.design ?? slideIndex % template.designs.length) * template.canvas.width,
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
    case "collage":
      return { ...bg, color: color(bg.color) };
    default:
      return { ...bg, stops: bg.stops.map((s) => ({ ...s, color: color(s.color) })) };
  }
}

/** The user's generated background, built from the template's own theme colors. */
export function backdropBackground(backdrop: NonNullable<Project["backdrop"]>, theme: ThemeTokens): Background {
  if (backdrop.kind === "collage") {
    // Tilt direction and tile order change with Shuffle.
    const tilts = [-12, 10, -7, 14];
    return { type: "collage", color: "$background", dim: 0.78, blur: 4, tilt: tilts[backdrop.seed % tilts.length], seed: backdrop.seed };
  }
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
  deviceAngle: Project["deviceAngle"];
  headlineFont: HeadlineFont | undefined;
  /** Literal accent color, the default for emphasis and markers. */
  accent: string;
};

function resolveElement(el: TemplateElement, { color, values, regions, deviceFrame, deviceModel, deviceColor, deviceAngle, headlineFont, accent }: ResolveContext): TemplateElement {
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
        // So does the angle; "straight" removes the template's own.
        perspective: el.device && deviceAngle ? (deviceAngle === "straight" ? undefined : deviceAngle) : el.perspective,
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
