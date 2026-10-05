import type { SlideSpec, TemplateElement } from "@/types/template";

/*
 * Store output sizes. Templates are designed once at 1080 × 1920; other
 * portrait sizes reflow that design (see `adaptSpec`), and the Play feature
 * graphic is its own banner composition (see `featureGraphic.ts`).
 */

export type SizeId = "play-phone" | "play-feature" | "ios-69" | "ios-65" | "ipad-13";

export type OutputSize = {
  id: SizeId;
  store: "Google Play" | "App Store";
  label: string;
  width: number;
  height: number;
  /** ZIP folder when several sizes are exported. */
  folder: string;
  /** screens = one image per slide; feature = one banner for the set. */
  kind: "screens" | "feature";
};

export const OUTPUT_SIZES: readonly OutputSize[] = [
  { id: "play-phone", store: "Google Play", label: "Phone", width: 1080, height: 1920, folder: "google-play/phone", kind: "screens" },
  { id: "play-feature", store: "Google Play", label: "Feature graphic", width: 1024, height: 500, folder: "google-play", kind: "feature" },
  { id: "ios-69", store: "App Store", label: 'iPhone 6.9"', width: 1320, height: 2868, folder: "app-store/iphone-6.9", kind: "screens" },
  { id: "ios-65", store: "App Store", label: 'iPhone 6.5"', width: 1284, height: 2778, folder: "app-store/iphone-6.5", kind: "screens" },
  { id: "ipad-13", store: "App Store", label: 'iPad 13"', width: 2064, height: 2752, folder: "app-store/ipad-13", kind: "screens" },
];

export const DEFAULT_SIZE: SizeId = "play-phone";

export function getSize(id: SizeId | undefined): OutputSize {
  return OUTPUT_SIZES.find((s) => s.id === id) ?? OUTPUT_SIZES[0];
}

/**
 * How far an element moves along one axis when the canvas grows by `extra`.
 * Positions spread with the element's center, so the spare space is shared
 * above, between and below elements; anything that touched or bled off an
 * edge keeps doing so.
 */
export function spreadShift(start: number, size: number, length: number, extra: number): number {
  const end = start + size;
  if (start < 0 && end > length) return extra / 2; // spans the canvas: stay centered
  // A quarter of the spare space above the first element, a quarter below the last, the rest between.
  let shift = extra * (0.25 + 0.5 * Math.min(1, Math.max(0, (start + size / 2) / length)));
  // Elements on or past the bottom edge stay there.
  if (end >= length) shift = Math.max(shift, length + extra - end);
  if (start < 0) shift = Math.min(shift, -start);
  return shift;
}

/**
 * Reflows a slide designed for one canvas to another aspect ratio. The design
 * scales to fit the target's width (taller targets) or height (wider ones),
 * the spare length spreads between elements, and backgrounds fill the target.
 * Returns the adapted spec (in design units) and the scale to draw it at.
 */
export function adaptSpec(spec: SlideSpec, size: Pick<OutputSize, "width" | "height">): { spec: SlideSpec; scale: number } {
  const { width: w, height: h } = spec.canvas;
  if (size.width * h === size.height * w) return { spec, scale: size.width / w };

  const taller = size.width / size.height < w / h;
  const scale = taller ? size.width / w : size.height / h;
  const canvas = { width: size.width / scale, height: size.height / scale };
  const extraX = canvas.width - w;
  const extraY = canvas.height - h;

  const move = (el: TemplateElement): TemplateElement => ({
    ...el,
    x: el.x + (extraX ? spreadShift(el.x, el.width, w, extraX) : 0),
    y: el.y + (extraY ? spreadShift(el.y, el.height, h, extraY) : 0),
  });

  // Callouts move with the phone they enlarge, so pop-outs stay on their spot.
  const moved = spec.elements.map(move);
  const elements = moved.map((el, i) => {
    if (el.type !== "callout") return el;
    const original = spec.elements[i];
    const phone = spec.elements.findIndex((e) => e.type === "screenshot" && e.slot === el.slot);
    if (phone === -1) return el;
    return { ...el, x: original.x + (moved[phone].x - spec.elements[phone].x), y: original.y + (moved[phone].y - spec.elements[phone].y) };
  });

  // Panorama x runs across the set: stretch positions so seams land on the new slide edges.
  const stretch = canvas.width / w;
  const panorama = spec.panorama.map((el) => ({
    ...el,
    x: extraX ? el.x * stretch + (el.width * (stretch - 1)) / 2 : el.x,
    y: el.y + (extraY ? spreadShift(el.y, el.height, h, extraY) : 0),
  }));

  return {
    scale,
    spec: { ...spec, canvas, elements, panorama, panoramaOffset: spec.panoramaOffset * stretch, setWidth: spec.setWidth * stretch },
  };
}

/** Known size ids from a saved list, in display order; the default when none are valid. */
export function chosenSizes(list: readonly string[] | undefined): SizeId[] {
  const ids = OUTPUT_SIZES.filter((s) => list?.includes(s.id)).map((s) => s.id);
  return ids.length > 0 ? ids : [DEFAULT_SIZE];
}
