import type { AddedBlock, BlockKind } from "@/types/project";
import type { Canvas, ResolvedSlideDesign, ResolvedTemplate, TemplateElement } from "@/types/template";

/*
 * Blocks users add to a slide. Each block copies the look of the same kind of
 * element from the template's own layouts (so a review card on Midnight looks
 * like Midnight's), falling back to a neutral default. Text comes from the
 * template's variables, so the Text section shows the fields automatically.
 */

type BlockDef = {
  kind: BlockKind;
  label: string;
  /** Element type the block is, and the type borrowed from the template. */
  type: TemplateElement["type"];
  width: number;
  height: number;
  /** Variables the block's text needs. */
  needs: string[];
  /** Needs a screenshot on the slide (pop-outs). */
  needsScreenshot?: boolean;
  fallback: (box: { x: number; y: number; width: number; height: number }) => TemplateElement;
};

export const BLOCKS: readonly BlockDef[] = [
  {
    kind: "rating",
    label: "Rating",
    type: "rating",
    width: 800,
    height: 64,
    needs: ["ratingScore", "ratingLabel"],
    fallback: (box) => ({ type: "rating", id: "", ...box, score: "{{ratingScore}}", label: "{{ratingLabel}}", color: "$foreground", starColor: "$foreground" }),
  },
  {
    kind: "review",
    label: "Review",
    type: "review",
    width: 600,
    height: 460,
    needs: ["reviewQuote", "reviewAuthor"],
    fallback: (box) => ({
      type: "review",
      id: "",
      ...box,
      quote: "{{reviewQuote}}",
      author: "{{reviewAuthor}}",
      color: "#16131F",
      cardColor: "#FFFFFF",
      starColor: "#FFB400",
      shadow: { y: 30, blur: 70, color: "rgba(22, 19, 31, 0.3)" },
    }),
  },
  {
    kind: "stat",
    label: "Big number",
    type: "stat",
    width: 700,
    height: 300,
    needs: ["statValue", "statLabel"],
    fallback: (box) => ({ type: "stat", id: "", ...box, value: "{{statValue}}", label: "{{statLabel}}", color: "$foreground" }),
  },
  {
    kind: "laurels",
    label: "Award",
    type: "laurels",
    width: 700,
    height: 300,
    needs: ["laurelTitle", "laurelSubtitle"],
    fallback: (box) => ({ type: "laurels", id: "", ...box, title: "{{laurelTitle}}", subtitle: "{{laurelSubtitle}}", stars: true, color: "$foreground" }),
  },
  {
    kind: "appIcon",
    label: "App icon",
    type: "imageSlot",
    width: 200,
    height: 200,
    needs: ["appName"],
    fallback: (box) => ({
      type: "imageSlot",
      id: "",
      ...box,
      key: "appIcon",
      fit: "cover",
      radius: 48,
      shadow: { y: 20, blur: 44, color: "rgba(22, 19, 31, 0.3)" },
      monogram: { text: "{{appName}}", fill: "$accent", color: "#FFFFFF" },
    }),
  },
  {
    kind: "popout",
    label: "Pop-out",
    type: "callout",
    width: 860,
    height: 500,
    needs: [],
    needsScreenshot: true,
    fallback: (box) => ({ type: "callout", id: "", ...box, slot: 0, region: { x: 0.03, y: 0.372, w: 0.94, h: 0.11 }, rotation: -2.5, follow: "y" }),
  },
];

export const getBlock = (kind: BlockKind) => BLOCKS.find((b) => b.kind === kind);

/** Blocks that work on this slide, with the reason the others do not. */
export function blockOptions(template: ResolvedTemplate, design: ResolvedSlideDesign): { kind: BlockKind; label: string; reason?: string }[] {
  const variables = new Set(template.variables.map((v) => v.key));
  return BLOCKS.map((b) => {
    if (b.needsScreenshot && design.slots === 0) return { kind: b.kind, label: b.label, reason: "Needs a screenshot on the slide" };
    if (!b.needs.every((k) => variables.has(k))) return { kind: b.kind, label: b.label, reason: "Not available in this template" };
    return { kind: b.kind, label: b.label };
  });
}

/** The template's own styled element of a type, from any slide or layout choice. */
function templateExample(template: ResolvedTemplate, type: TemplateElement["type"]): TemplateElement | undefined {
  const pool = [...template.designs, ...template.alternates.flatMap((a) => Object.values(a))].flatMap((d) => d.elements);
  if (type === "imageSlot") return pool.find((el) => el.type === "imageSlot" && el.key === "appIcon");
  return pool.find((el) => el.type === type);
}

/** The element for an added block, styled like the template. */
export function blockElement(template: ResolvedTemplate, block: AddedBlock): TemplateElement | null {
  const def = getBlock(block.kind);
  if (!def) return null;
  const box = { x: block.x, y: block.y, width: def.width, height: def.height };
  const example = templateExample(template, def.type);
  // Keep the template's look and text, drop its placement.
  const base = example ? { ...example, ...box, rotation: def.kind === "popout" ? -2.5 : example.rotation, layer: undefined } : def.fallback(box);
  const el = { ...base, id: block.id } as TemplateElement;
  if (el.type === "callout") return { ...el, slot: 0, follow: "y" };
  return el;
}

type Box = { x: number; y: number; width: number; height: number };

const overlap = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));

/** How much covering each kind of element costs when placing a block. */
const COST: Partial<Record<TemplateElement["type"], number>> = {
  text: 30,
  rating: 30,
  laurels: 30,
  stat: 30,
  review: 30,
  imageSlot: 30,
  callout: 12,
  screenshot: 1,
};

/** Blocks with their own card can sit on a phone; bare text and icons get lost on busy app screens. */
const CARDED = new Set<BlockKind>(["review", "popout"]);

/** Where a new block goes: the candidate spot that covers the least text and blocks. */
export function placeBlock(kind: BlockKind, elements: readonly TemplateElement[], canvas: Canvas): { x: number; y: number } {
  const def = getBlock(kind);
  if (!def) return { x: 0, y: 0 };
  const { width: w, height: h } = def;
  const margin = 60;
  const xs = [(canvas.width - w) / 2, margin, canvas.width - w - margin];
  const ys = Array.from({ length: 9 }, (_, i) => margin + ((canvas.height - h - margin * 2) * i) / 8);
  const cost = (type: TemplateElement["type"]) => (type === "screenshot" && !CARDED.has(kind) ? 8 : (COST[type] ?? 0));
  let best = { x: xs[0], y: ys[0], cost: Infinity };
  for (const y of ys) {
    for (const x of xs) {
      const box = { x, y, width: w, height: h };
      const total = elements.reduce((sum, el) => sum + overlap(box, el) * cost(el.type), 0);
      if (total < best.cost - 1) best = { x, y, cost: total };
    }
  }
  return { x: Math.round(best.x), y: Math.round(best.y) };
}
