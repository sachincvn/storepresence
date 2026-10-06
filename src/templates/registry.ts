import type { Layout, ResolvedTemplate, Template } from "@/types/template";
import { resolveTemplate } from "./resolve";
import { validateLayout, validateTemplate } from "./validate";

import badgeHero from "./layouts/badge-hero.json";
import brandHero from "./layouts/brand-hero.json";
import duo from "./layouts/duo.json";
import featureGraphic from "./layouts/feature-graphic.json";
import headlineTop from "./layouts/headline-top.json";
import phoneCenter from "./layouts/phone-center.json";
import phoneTilt from "./layouts/phone-tilt.json";
import popDuo from "./layouts/pop-duo.json";
import popOut from "./layouts/pop-out.json";
import proofHero from "./layouts/proof-hero.json";
import reviewPhone from "./layouts/review-phone.json";
import statHero from "./layouts/stat-hero.json";
import textBottom from "./layouts/text-bottom.json";
import zoom from "./layouts/zoom.json";

import aurora from "./aurora/template.json";
import cinematic from "./cinematic/template.json";
import fintechGlass from "./fintech-glass/template.json";
import playfulLearning from "./playful-learning/template.json";
import socialPop from "./social-pop/template.json";
import calmWellness from "./calm-wellness/template.json";
import freshMint from "./fresh-mint/template.json";
import healthStats from "./health-stats/template.json";
import lilacClay from "./lilac-clay/template.json";
import midnight from "./midnight/template.json";
import panorama from "./panorama/template.json";
import monoMinimal from "./mono-minimal/template.json";
import proProductivity from "./pro-productivity/template.json";
import studioBlue from "./studio-blue/template.json";
import sunnyPop from "./sunny-pop/template.json";

/*
 * To add a template: create `src/templates/<id>/template.json`,
 * import it above and add it to `templateSources`. Order = gallery order.
 */
const layoutSources: unknown[] = [phoneCenter, phoneTilt, textBottom, duo, zoom, badgeHero, proofHero, reviewPhone, statHero, brandHero, popOut, popDuo, featureGraphic, headlineTop];
const templateSources: unknown[] = [
  aurora,
  studioBlue,
  monoMinimal,
  sunnyPop,
  calmWellness,
  lilacClay,
  midnight,
  proProductivity,
  healthStats,
  freshMint,
  playfulLearning,
  cinematic,
  fintechGlass,
  socialPop,
  panorama,
];

export type TemplateIssue = {
  kind: "layout" | "template";
  id: string;
  errors: string[];
};

function idOf(source: unknown): string {
  const id = (source as { id?: unknown } | null)?.id;
  return typeof id === "string" ? id : "(no id)";
}

function load() {
  const issues: TemplateIssue[] = [];

  const layouts: Layout[] = [];
  for (const source of layoutSources) {
    const errors = validateLayout(source);
    if (layouts.some((l) => l.id === idOf(source))) errors.push(`layout ${idOf(source)} › id: duplicate layout id`);
    if (errors.length > 0) issues.push({ kind: "layout", id: idOf(source), errors });
    else layouts.push(source as Layout);
  }

  const templates: ResolvedTemplate[] = [];
  for (const source of templateSources) {
    const errors = validateTemplate(source, layouts);
    if (templates.some((t) => t.id === idOf(source))) errors.push(`${idOf(source)} › id: duplicate template id`);
    if (errors.length > 0) issues.push({ kind: "template", id: idOf(source), errors });
    else templates.push(resolveTemplate(source as Template, layouts));
  }

  // Invalid entries are skipped so one bad file never breaks the app.
  // `npm test` fails on them, and the Template Lab lists them.
  if (issues.length > 0 && process.env.NODE_ENV !== "production") {
    console.error(`[templates] ${issues.length} invalid:\n${issues.flatMap((i) => i.errors).join("\n")}`);
  }

  return { layouts, templates, issues };
}

const loaded = load();

export const layouts: readonly Layout[] = loaded.layouts;
export const templates: readonly ResolvedTemplate[] = loaded.templates;
export const templateIssues: readonly TemplateIssue[] = loaded.issues;

export function getTemplate(id: string): ResolvedTemplate | undefined {
  return templates.find((t) => t.id === id);
}
