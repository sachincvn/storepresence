/** Friendly names for layout ids in the picker; unknown ids fall back to a readable form. */
const NAMES: Record<string, string> = {
  "phone-center": "Hero",
  "phone-tilt": "Tilted",
  "text-bottom": "Text below",
  duo: "Two phones",
  zoom: "Close-up",
  "badge-hero": "Badge",
  "proof-hero": "Ratings",
  "review-phone": "Review",
  "stat-hero": "Big number",
  "brand-hero": "App intro",
  "pop-out": "Pop-out",
  "pop-duo": "Two pop-outs",
  intro: "Intro",
  statement: "Statement",
  outro: "Outro",
  "full-bleed": "Full screen",
};

export function layoutName(id: string): string {
  return NAMES[id] ?? id.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
