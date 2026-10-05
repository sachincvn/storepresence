import type { Project } from "@/types/project";
import { getHeadlineFont, HEADLINE_FONT_KEYS, type HeadlineFont } from "./headlineFonts";
import type {
  Background,
  Color,
  ElementOverride,
  Layout,
  ResolvedSlideDesign,
  ResolvedTemplate,
  Shadow,
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
  const usedLayouts: Layout[] = [];
  const shared = template.elements ?? [];

  const designs: ResolvedSlideDesign[] = template.slides.map((design, i) => {
    const layout = design.layout ? layouts.find((l) => l.id === design.layout) : undefined;
    if (design.layout && !layout) {
      throw new Error(`Template "${template.id}" slide ${i + 1} uses unknown layout "${design.layout}"`);
    }
    if (layout && !usedLayouts.includes(layout)) usedLayouts.push(layout);

    const base = (layout?.elements ?? []).map((el) =>
      applyOverride(applyOverride(el, template.overrides?.[el.id]), design.overrides?.[el.id]),
    );
    const extra = design.elements ?? [];
    const elements = [
      ...shared.filter(isBack),
      ...extra.filter(isBack),
      ...base,
      ...extra.filter(isFront),
      ...shared.filter(isFront),
    ];

    return {
      background: design.background ?? template.background,
      elements,
      slots: elements.reduce((n, el) => (el.type === "screenshot" ? Math.max(n, el.slot + 1) : n), 0),
      defaults: design.defaults ?? {},
    };
  });

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

export function designFor(template: ResolvedTemplate, slideIndex: number): ResolvedSlideDesign {
  return template.designs[slideIndex % template.designs.length];
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
export function variablesForSlide(template: ResolvedTemplate, slideIndex: number): TemplateVariable[] {
  const used = new Set(
    designFor(template, slideIndex).elements.flatMap((el) => (el.type === "text" ? listPlaceholders(el.text) : [])),
  );
  return template.variables.filter((v) => used.has(v.key));
}

/**
 * Variable values for one slide: user value, else the slide design's default,
 * else the variable default. An empty string is a valid user value.
 */
export function getSlideValues(template: ResolvedTemplate, project: Project, slideIndex: number): Record<string, string> {
  const perSlide = project.slideVariables[getSlideKey(template, project, slideIndex)] ?? {};
  const defaults = designFor(template, slideIndex).defaults;
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
  const design = designFor(template, slideIndex);
  const shots = project.screenshots;
  const headlineFont = getHeadlineFont(project.headlineFont);
  const resolve = (el: TemplateElement) => resolveElement(el, color, values, project.deviceFrame, headlineFont);

  return {
    canvas: template.canvas,
    background: resolveBackground(design.background, color),
    grain: template.grain,
    panorama: template.panorama.map(resolve),
    panoramaOffset: (slideIndex % template.designs.length) * template.canvas.width,
    elements: design.elements.map(resolve),
    // Extra phones show the following screenshots, wrapping around.
    screenshots: Array.from({ length: design.slots }, (_, slot) =>
      shots.length > 0 ? shots[(slideIndex + slot) % shots.length] : null,
    ),
  };
}

type ColorFn = (c: Color) => string;

function resolveBackground(bg: Background, color: ColorFn): Background {
  if (bg.type === "solid") return { ...bg, color: color(bg.color) };
  return { ...bg, stops: bg.stops.map((s) => ({ ...s, color: color(s.color) })) };
}

function resolveShadow(shadow: Shadow | undefined, color: ColorFn): Shadow | undefined {
  return shadow && { ...shadow, color: color(shadow.color) };
}

function resolveElement(
  el: TemplateElement,
  color: ColorFn,
  values: Record<string, string>,
  deviceFrame: boolean,
  headlineFont: HeadlineFont | undefined,
): TemplateElement {
  switch (el.type) {
    case "text":
      return {
        ...el,
        // User font choice swaps headline type only; body text keeps the template's font.
        ...(headlineFont && HEADLINE_FONT_KEYS.includes(el.font)
          ? { font: headlineFont.font, weight: headlineFont.weight, letterSpacing: headlineFont.letterSpacing, lineHeight: headlineFont.lineHeight }
          : {}),
        text: fillPlaceholders(el.text, values),
        color: color(el.color),
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
        frameColor: el.frameColor && color(el.frameColor),
        placeholderColor: el.placeholderColor && color(el.placeholderColor),
        device: deviceFrame ? el.device : undefined,
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
  }
}
