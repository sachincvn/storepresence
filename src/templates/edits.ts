import type { ElementEdit } from "@/types/project";
import type { Canvas, TemplateElement } from "@/types/template";

/*
 * User nudges on top of template elements: move, scale, rotate, hide. Edits
 * are deltas, so a template can still improve underneath them, and they are
 * clamped to safe bounds so nothing gets lost off the slide.
 */

export const EDIT_LIMITS = { minScale: 0.5, maxScale: 1.6, maxRotation: 30 } as const;
/** Inset that text and blocks keep from the canvas edge. */
export const SAFE_MARGIN = 24;
/** Snap distance in design units. */
export const SNAP = 16;
/** Text margins elements snap to. */
const SNAP_MARGIN = 80;

/** Phones, shapes and images may bleed off the edge; their center must stay on the slide. */
const BLEEDS = new Set<TemplateElement["type"]>(["screenshot", "shape", "image"]);

export type Guide = { axis: "x" | "y"; at: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The element with an edit applied (no clamping). */
export function applyEdit(el: TemplateElement, edit: ElementEdit | undefined): TemplateElement {
  if (!edit) return el;
  const scale = (el.scale ?? 1) * (edit.scale ?? 1);
  const rotation = (el.rotation ?? 0) + (edit.rotation ?? 0);
  return { ...el, x: el.x + (edit.dx ?? 0), y: el.y + (edit.dy ?? 0), scale: scale === 1 ? undefined : scale, rotation: rotation || undefined };
}

/** Center and scaled size of an element. */
export function elementBox(el: TemplateElement): { cx: number; cy: number; w: number; h: number } {
  const s = el.scale ?? 1;
  return { cx: el.x + el.width / 2, cy: el.y + el.height / 2, w: el.width * s, h: el.height * s };
}

/** Limits an edit to safe bounds. Positions the template itself chose are always allowed. */
export function clampEdit(el: TemplateElement, edit: ElementEdit, canvas: Canvas): ElementEdit {
  const scale = clamp(edit.scale ?? 1, EDIT_LIMITS.minScale, EDIT_LIMITS.maxScale);
  const rotation = clamp(edit.rotation ?? 0, -EDIT_LIMITS.maxRotation, EDIT_LIMITS.maxRotation);
  const origin = elementBox(el);
  const box = elementBox(applyEdit(el, { scale }));

  const range = (length: number, size: number, start: number) => {
    let lo: number;
    let hi: number;
    if (BLEEDS.has(el.type)) [lo, hi] = [0, length];
    else if (size <= length - SAFE_MARGIN * 2) [lo, hi] = [SAFE_MARGIN + size / 2, length - SAFE_MARGIN - size / 2];
    else [lo, hi] = [length / 2, length / 2];
    return [Math.min(lo, start), Math.max(hi, start)] as const;
  };
  const [xLo, xHi] = range(canvas.width, box.w, origin.cx);
  const [yLo, yHi] = range(canvas.height, box.h, origin.cy);
  const cx = clamp(origin.cx + (edit.dx ?? 0), xLo, xHi);
  const cy = clamp(origin.cy + (edit.dy ?? 0), yLo, yHi);

  const out: ElementEdit = {};
  if (Math.abs(cx - origin.cx) > 0.01) out.dx = Math.round((cx - origin.cx) * 10) / 10;
  if (Math.abs(cy - origin.cy) > 0.01) out.dy = Math.round((cy - origin.cy) * 10) / 10;
  if (Math.abs(scale - 1) > 0.001) out.scale = Math.round(scale * 1000) / 1000;
  if (Math.abs(rotation) > 0.01) out.rotation = Math.round(rotation * 10) / 10;
  if (edit.hidden) out.hidden = true;
  return out;
}

/**
 * Snaps a moved element\x27s center to the canvas center lines and its edges to
 * the text margins. Returns the snapped move and the guides to draw.
 */
export function snapMove(el: TemplateElement, dx: number, dy: number, canvas: Canvas): { dx: number; dy: number; guides: Guide[] } {
  const { cx, cy, w, h } = elementBox(el);
  const guides: Guide[] = [];
  const snapAxis = (axis: "x" | "y", center: number, size: number, length: number, delta: number) => {
    const c = center + delta;
    const targets: [number, number][] = [
      [length / 2, c], // center line
      [SNAP_MARGIN, c - size / 2], // leading edge on the margin
      [length - SNAP_MARGIN, c + size / 2], // trailing edge on the margin
    ];
    for (const [at, value] of targets) {
      if (Math.abs(value - at) <= SNAP) {
        guides.push({ axis, at });
        return delta + (at - value);
      }
    }
    return delta;
  };
  return { dx: snapAxis("x", cx, w, canvas.width, dx), dy: snapAxis("y", cy, h, canvas.height, dy), guides };
}

/** Topmost element under a point (design units), honoring rotation and scale. */
export function hitTest(elements: readonly TemplateElement[], x: number, y: number): TemplateElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    const { cx, cy, w, h } = elementBox(el);
    const angle = (-(el.rotation ?? 0) * Math.PI) / 180;
    const px = cx + (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle);
    const py = cy + (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle);
    if (Math.abs(px - cx) <= w / 2 && Math.abs(py - cy) <= h / 2) return el;
  }
  return null;
}

const NAMES: Record<string, string> = {
  headline: "Headline",
  description: "Description",
  badge: "Badge",
  shot: "Phone",
  "shot-back": "Back phone",
  rating: "Rating",
  laurels: "Award",
  stat: "Big number",
  review: "Review card",
  "app-icon": "App icon",
  "app-name": "App name",
  mascot: "Mascot",
  callout: "Pop-out",
  "callout-2": "Pop-out 2",
  cta: "Button",
};

const TYPE_NAMES: Partial<Record<TemplateElement["type"], string>> = {
  rating: "Rating",
  review: "Review card",
  stat: "Big number",
  laurels: "Award",
  imageSlot: "App icon",
  callout: "Pop-out",
  text: "Text",
};

/** Ids of blocks the user added (they can be removed, not just hidden). */
export const isAddedBlock = (id: string) => id.startsWith("block-");

/** Friendly name for an element in the editor. */
export function elementName(el: TemplateElement): string {
  if (isAddedBlock(el.id)) return `${TYPE_NAMES[el.type] ?? "Block"} (added)`;
  return NAMES[el.id] ?? (el.type === "shape" ? "Decoration" : el.id.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()));
}
