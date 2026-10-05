import type { Project } from "@/types/project";
import type { ResolvedTemplate, SlideSpec, TemplateElement } from "@/types/template";
import { layouts } from "./registry";
import { getSlides, slideContext } from "./resolve";

/** Look properties a banner element borrows from the template's element with the same id. */
const BORROWED: Partial<Record<TemplateElement["type"], string[]>> = {
  text: ["font", "weight", "letterSpacing", "color", "emphasis", "marker"],
  screenshot: ["device", "frameColor"],
  imageSlot: ["monogram"],
};

/** The template's styled version of an element id (fonts, colors, device), from any slide or layout choice. */
function templateStyle(template: ResolvedTemplate, el: TemplateElement): TemplateElement {
  const keys = BORROWED[el.type];
  if (!keys) return el;
  const pool = [...template.designs, ...template.alternates.flatMap((a) => Object.values(a))].flatMap((d) => d.elements);
  const source = pool.find((e) => e.id === el.id && e.type === el.type) as Record<string, unknown> | undefined;
  if (!source) return el;
  const picked = Object.fromEntries(keys.filter((k) => source[k] !== undefined).map((k) => [k, source[k]]));
  return { ...el, ...picked } as TemplateElement;
}

/**
 * The Google Play feature graphic (1024 × 500): app icon, app name, the first
 * slide's headline and a tilted phone, in the template's background, colors
 * and type.
 */
export function resolveFeatureGraphic(template: ResolvedTemplate, project: Project): SlideSpec {
  const layout = layouts.find((l) => l.id === "feature-graphic");
  if (!layout) throw new Error('Layout "feature-graphic" is missing');
  const { resolve, background } = slideContext(template, project, 0);
  const shot = getSlides(template, project).find((p) => p.shot)?.shot ?? project.screenshots[0] ?? null;
  return {
    canvas: layout.canvas,
    background,
    collage: background.type === "collage" ? project.screenshots : [],
    grain: template.grain,
    panorama: [],
    panoramaOffset: 0,
    setWidth: layout.canvas.width,
    elements: layout.elements.map((el) => resolve(templateStyle(template, el))),
    images: project.images ?? {},
    screenshots: [shot],
  };
}
