"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Project, Screenshot } from "@/types/project";
import type { Layout, ResolvedTemplate } from "@/types/template";
import { SlideCanvas } from "@/components/editor/SlideCanvas";
import { createRatioSamples, RATIO_SAMPLES } from "@/lib/sampleShots";
import { layouts, templateIssues, templates } from "@/templates/registry";
import { resolveTemplate } from "@/templates/resolve";

/** Longest copy the editor allows (variables' maxLength), to stress text fitting. */
const LONG_TEXT: Record<string, string> = {
  headline: "Track every habit, goal and streak in one place",
  description: "Stay focused with smart reminders, weekly insights and a calm plan for work and home.",
  badge: "New: smart weekly reminders",
};

const NEUTRAL_THEME = { background: "#ECEEF4", foreground: "#16131F", primary: "#3D5AFE", accent: "#FF6FAE", surface: "#FFFFFF" };

type Ratio = "mixed" | (typeof RATIO_SAMPLES)[number]["id"];

/**
 * Authoring tool: every template rendered against awkward screenshot shapes
 * and maximum-length text, plus validation errors and layout wireframes.
 * Edit JSON in src/templates and this page hot-reloads.
 */
export function TemplateLab() {
  const [samples, setSamples] = useState<Screenshot[]>([]);
  const [ratio, setRatio] = useState<Ratio>("mixed");
  const [longText, setLongText] = useState(false);
  const [deviceFrame, setDeviceFrame] = useState(true);

  useEffect(() => {
    queueMicrotask(() => setSamples(createRatioSamples()));
  }, []);

  const issueCount = templateIssues.reduce((n, i) => n + i.errors.length, 0);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.04em]">Template Lab</h1>
          <p className="mt-1 text-muted">
            Dev only. Edit JSON in <code className="rounded bg-white px-1.5 py-0.5 text-sm">src/templates/</code> and this page reloads.
          </p>
        </div>
        <Link href="/editor" className="text-sm font-bold text-blue underline">
          Open editor
        </Link>
      </header>

      <section aria-label="Validation" className={`rounded-2xl border p-4 ${issueCount ? "border-[#F3B5CC] bg-[#FFF0F5]" : "border-[#B6E6CD] bg-[#EFFBF4]"}`}>
        {issueCount === 0 ? (
          <p className="font-bold text-[#166B45]">
            All {templates.length} templates and {layouts.length} layouts are valid.
          </p>
        ) : (
          <>
            <p className="font-bold text-[#9E1846]">
              {issueCount} problem{issueCount === 1 ? "" : "s"} in {templateIssues.length} file{templateIssues.length === 1 ? "" : "s"}. Invalid files are hidden from the editor.
            </p>
            <ul className="mt-2 flex flex-col gap-1 font-mono text-sm text-[#9E1846]">
              {templateIssues.flatMap((issue) => issue.errors).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-label="Test settings" className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <label className="flex items-center gap-2 text-sm font-bold">
          Screenshots
          <select value={ratio} onChange={(e) => setRatio(e.target.value as Ratio)} className="rounded-xl border border-line bg-white px-3 py-1.5 font-medium">
            <option value="mixed">Mixed: one of each ratio</option>
            {RATIO_SAMPLES.map((s) => (
              <option key={s.id} value={s.id}>
                All {s.label}
              </option>
            ))}
          </select>
        </label>
        <Toggle label="Longest allowed text" checked={longText} onChange={setLongText} />
        <Toggle label="Phone frame" checked={deviceFrame} onChange={setDeviceFrame} />
      </section>

      <section aria-labelledby="lab-templates" className="flex flex-col gap-10">
        <h2 id="lab-templates" className="font-display text-2xl font-extrabold tracking-[-0.03em]">
          Templates
        </h2>
        {samples.length > 0 &&
          templates.map((t) => <TemplateRow key={t.id} template={t} samples={samples} ratio={ratio} longText={longText} deviceFrame={deviceFrame} />)}
      </section>

      <section aria-labelledby="lab-layouts" className="flex flex-col gap-4">
        <div>
          <h2 id="lab-layouts" className="font-display text-2xl font-extrabold tracking-[-0.03em]">
            Layouts
          </h2>
          <p className="text-sm text-muted">Element boxes: blue text, pink screenshots. Boxes may bleed past the edge on purpose.</p>
        </div>
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {layouts.map((l) => (
            <li key={l.id}>
              <LayoutWireframe layout={l} samples={samples} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function TemplateRow({
  template,
  samples,
  ratio,
  longText,
  deviceFrame,
}: {
  template: ResolvedTemplate;
  samples: Screenshot[];
  ratio: Ratio;
  longText: boolean;
  deviceFrame: boolean;
}) {
  const project = useMemo<Project>(() => {
    const single = samples.find((s) => s.id === `ratio-${ratio}`);
    const screenshots = ratio === "mixed" || !single ? samples : template.designs.map(() => single);
    const slideVariables = longText ? Object.fromEntries(screenshots.map((s) => [s.id, LONG_TEXT])) : {};
    return { templateId: template.id, screenshots, variables: {}, slideVariables, theme: {}, deviceFrame };
  }, [template, samples, ratio, longText, deviceFrame]);

  return (
    <article aria-labelledby={`lab-${template.id}`}>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 id={`lab-${template.id}`} className="font-display text-xl font-extrabold">
          {template.name}
        </h3>
        <span className="text-sm text-muted">
          {template.category}, {template.designs.length} slide designs, {template.panorama.length} panorama elements
        </span>
        <Link href={`/editor?template=${template.id}`} className="text-sm font-bold text-blue underline">
          Edit
        </Link>
      </div>
      <ol className="flex gap-1.5 overflow-x-auto pb-2">
        {project.screenshots.map((s, i) => (
          <li key={i} className="shrink-0">
            <SlideCanvas
              template={template}
              project={project}
              slideIndex={i}
              scale={0.2}
              delay={150}
              label={`${template.name} slide ${i + 1} with ${s.name}`}
              className="h-[340px] w-auto rounded-lg"
            />
          </li>
        ))}
      </ol>
    </article>
  );
}

function LayoutWireframe({ layout, samples }: { layout: Layout; samples: Screenshot[] }) {
  // A throwaway one-slide template in neutral colors, just to draw the layout.
  const preview = useMemo(
    () =>
      resolveTemplate(
        {
          id: `layout-${layout.id}`,
          name: layout.id,
          category: "Layout",
          canvas: layout.canvas,
          theme: NEUTRAL_THEME,
          background: { type: "solid", color: "$background" },
          slides: [{ layout: layout.id }],
        },
        [layout],
      ),
    [layout],
  );
  const project = useMemo<Project>(
    () => ({ templateId: preview.id, screenshots: samples.slice(0, 2), variables: {}, slideVariables: {}, theme: {}, deviceFrame: true }),
    [preview.id, samples],
  );
  const { width: W, height: H } = layout.canvas;

  return (
    <figure>
      <div className="relative overflow-hidden rounded-lg ring-1 ring-line">
        <SlideCanvas template={preview} project={project} slideIndex={0} scale={0.2} delay={150} className="block w-full" />
        <div aria-hidden="true" className="absolute inset-0">
          {layout.elements.map((el) => (
            <div
              key={el.id}
              className={`absolute border-2 border-dashed ${el.type === "text" ? "border-blue bg-blue/10" : el.type === "screenshot" ? "border-pink bg-pink/10" : "border-ink/40"}`}
              style={{
                left: `${(el.x / W) * 100}%`,
                top: `${(el.y / H) * 100}%`,
                width: `${(el.width / W) * 100}%`,
                height: `${(el.height / H) * 100}%`,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              }}
            >
              <span className="absolute top-0 left-0 bg-ink px-1 text-[10px] leading-4 font-bold text-white">{el.id}</span>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 text-sm">
        <span className="font-bold">{layout.id}</span>
        <span className="block text-xs text-muted">
          {layout.variables.map((v) => v.key).join(", ")}; {layout.elements.filter((e) => e.type === "screenshot").length} screenshot
          {layout.elements.filter((e) => e.type === "screenshot").length === 1 ? "" : "s"}
        </span>
      </figcaption>
    </figure>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-2 text-sm font-bold">
      <span aria-hidden="true" className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-blue" : "bg-line"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}
