"use client";

import type { Dispatch, ReactNode } from "react";
import type { ResolvedTemplate, ThemeKey } from "@/types/template";
import { HEADLINE_FONT_KEYS, HEADLINE_FONTS } from "@/templates/headlineFonts";
import { designFor, getSlideKey, getSlides, getSlideValues, slideCallouts, slotScreenshots, themeFor, variablesForSlide } from "@/templates/resolve";
import type { EditorAction, EditorState } from "./editorState";
import { BackgroundControls } from "./BackgroundControls";
import { DeviceControls } from "./DeviceControls";
import { LayoutPicker } from "./LayoutPicker";
import { RegionPicker } from "./RegionPicker";
import { ElementControls } from "./ElementControls";

const COLOR_LABELS: Record<ThemeKey, string> = {
  background: "Background",
  foreground: "Text",
  primary: "Primary",
  accent: "Accent",
  surface: "Surface",
};

export type InspectorSection = "screenshots" | "layout" | "text" | "style";

const ALL_SECTIONS: InspectorSection[] = ["screenshots", "layout", "text", "style"];

/** Preview class per font key, so each option shows itself. */
const FONT_PREVIEW = { display: "font-display", sans: "font-sans", serif: "font-serif" } as const;

type InspectorProps = {
  template: ResolvedTemplate;
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  /** Upload and screenshot list, owned by the editor so page-wide drops share it. */
  screenshotPanel: ReactNode;
  /** Element picked on the canvas or in the Elements list. */
  selectedElement?: string | null;
  onSelectElement?: (id: string | null) => void;
  /** Save status and "Start over", shown under the screenshots. */
  projectFooter?: ReactNode;
  /** Brand color suggestions from the app icon, shown at the top of Colors. */
  brandColors?: ReactNode;
  /** App icon / logo / mascot uploads; shown in Style when the template has image slots. */
  brandPanel?: ReactNode;
  /** Which groups to show; mobile sheets and tablet columns show a subset. */
  sections?: InspectorSection[];
  /** Inside a titled sheet: drop the group heading the sheet title already shows. */
  bare?: boolean;
};

/** Controls are generated from the template's variables and editable colors. */
export function Inspector({ template, state, dispatch, screenshotPanel, projectFooter, brandPanel, brandColors, selectedElement = null, onSelectElement, sections = ALL_SECTIONS, bare = false }: InspectorProps) {
  const { project, slide } = state;
  const values = getSlideValues(template, project, slide);
  const variables = variablesForSlide(template, slide, project);
  const hasDevice = template.designs.some((d) => d.elements.some((el) => el.type === "screenshot" && el.device));
  const theme = themeFor(template, project);
  const callouts = slideCallouts(template, slide, project);
  const regions = project.calloutRegions?.[getSlideKey(template, project, slide)] ?? {};
  const shots = project.screenshots;
  const slotShots = slotScreenshots(template, project, slide);
  const slideShot = getSlides(template, project)[slide]?.shot ?? null;
  const showsScreenshot = designFor(template, slide, project).slots > 0;
  const hasColorChanges = template.editableColors.some((key) => project.theme[key]);
  // The template's own headline font, so "Template" previews what it really uses.
  const templateFont =
    template.designs[0].elements.flatMap((el) => (el.type === "text" && HEADLINE_FONT_KEYS.includes(el.font) ? [el.font] : []))[0] ?? "display";

  return (
    <div className="flex flex-col gap-7">
      {sections.includes("screenshots") &&
        (bare ? (
          <div className="flex flex-col gap-5">
            {screenshotPanel}
            {projectFooter}
          </div>
        ) : (
          <Section title="Screenshots">
            <div className="flex flex-col gap-5">
              {screenshotPanel}
              {projectFooter}
            </div>
          </Section>
        ))}

      {sections.includes("layout") && (
        <Section title={bare ? null : `Layout, slide ${slide + 1}`}>
          <LayoutPicker template={template} project={project} slide={slide} onPick={(layout) => dispatch({ type: "slideLayout", layout })} />
        </Section>
      )}

      {sections.includes("layout") && onSelectElement && (
        <Section
          title={`Elements, slide ${slide + 1}`}
          action={
            Object.keys(project.elementEdits?.[getSlideKey(template, project, slide)] ?? {}).length > 0 && (
              <button type="button" onClick={() => dispatch({ type: "resetElementEdits" })} className="rounded-md text-xs font-bold text-blue hover:underline">
                Reset all
              </button>
            )
          }
        >
          <ElementControls
            template={template}
            project={project}
            slide={slide}
            selected={selectedElement}
            onSelect={onSelectElement}
            onEdit={(id, edit) => dispatch({ type: "elementEdit", id, edit })}
            onRemove={(id) => dispatch({ type: "removeBlock", id })}
          />
        </Section>
      )}

      {sections.includes("layout") && showsScreenshot && shots.length > 1 && (
        <Section title={`Screenshot, slide ${slide + 1}`}>
          <fieldset>
            <legend className="sr-only">Screenshot shown on slide {slide + 1}</legend>
            <div className="grid grid-cols-5 gap-1.5">
              {shots.map((s) => {
                const checked = s.id === slideShot?.id;
                return (
                  <label
                    key={s.id}
                    className={`cursor-pointer overflow-hidden rounded-lg border-2 bg-white has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue ${
                      checked ? "border-blue" : "border-transparent ring-1 ring-line hover:ring-ink/30"
                    }`}
                  >
                    <input type="radio" name="slide-shot" checked={checked} onChange={() => dispatch({ type: "slideShot", shotId: s.id })} className="sr-only" />
                    <span className="sr-only">{s.name}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object/data URL */}
                    <img src={s.url} alt="" className="aspect-[9/16] w-full object-cover object-top" />
                  </label>
                );
              })}
            </div>
          </fieldset>
        </Section>
      )}

      {sections.includes("layout") && callouts.length > 0 && slotShots.some(Boolean) && (
        <Section
          title={`Pop-out, slide ${slide + 1}`}
          action={
            callouts.some((el) => el.id in regions) && (
              <button
                type="button"
                onClick={() => callouts.forEach((el) => dispatch({ type: "calloutRegion", id: el.id, region: undefined }))}
                className="rounded-md text-xs font-bold text-blue hover:underline"
              >
                Reset
              </button>
            )
          }
        >
          <div className="flex flex-col gap-5">
            {callouts.map((el, i) => {
              const name = callouts.length > 1 ? `Pop-out ${i + 1}` : "Pop-out";
              const visible = regions[el.id] !== null;
              const shot = slotShots[el.slot];
              return (
                <div key={el.id} className="flex flex-col gap-3">
                  <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold">
                    {`Show ${name.toLowerCase()}`}
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(e) => dispatch({ type: "calloutRegion", id: el.id, region: e.target.checked ? undefined : null })}
                      className="size-5 accent-blue"
                    />
                  </label>
                  {visible && shot && (
                    <RegionPicker
                      src={shot.url}
                      label={`${name} area`}
                      value={regions[el.id] ?? el.region}
                      onChange={(region) => dispatch({ type: "calloutRegion", id: el.id, region })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {sections.includes("text") && variables.length === 0 && (
        <p className="text-sm text-muted">This slide has no editable text.</p>
      )}

      {sections.includes("text") && variables.length > 0 && (
        <Section title={bare ? null : `Text, slide ${slide + 1}`}>
          <p className="mb-4 text-xs leading-relaxed text-muted">
            Tip: <code className="rounded bg-canvas px-1 font-bold text-ink">**word**</code> emphasizes,{" "}
            <code className="rounded bg-canvas px-1 font-bold text-ink">==word==</code> highlights.
          </p>
          <div className="flex flex-col gap-4">
            {variables.map((v) => {
              const id = `var-${v.key}`;
              const value = values[v.key] ?? "";
              const onChange = (next: string) => dispatch({ type: "variable", key: v.key, value: next, perSlide: !!v.perSlide });
              const field = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] leading-snug";
              return (
                <div key={v.key}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <label htmlFor={id} className="text-sm font-bold">
                      {v.label}
                    </label>
                    {!v.perSlide && <span className="text-xs text-muted">All slides</span>}
                  </div>
                  {v.multiline ? (
                    <textarea id={id} rows={2} maxLength={v.maxLength} value={value} onChange={(e) => onChange(e.target.value)} className={`${field} resize-none`} placeholder="Optional" />
                  ) : (
                    <input id={id} type="text" maxLength={v.maxLength} value={value} onChange={(e) => onChange(e.target.value)} className={field} />
                  )}
                  {v.maxLength && (
                    <p className="mt-1 text-right text-xs text-muted tabular-nums">
                      {value.length}/{v.maxLength}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {sections.includes("style") && (
        <Section title="Headline font">
          <fieldset>
            <legend className="sr-only">Headline font</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: undefined, label: "Template", preview: FONT_PREVIEW[templateFont], light: templateFont === "serif" },
                ...HEADLINE_FONTS.map((f) => ({ id: f.id, label: f.label, preview: FONT_PREVIEW[f.font], light: f.font === "serif" })),
              ].map(
                (option) => {
                  const checked = project.headlineFont === option.id;
                  return (
                    <label
                      key={option.label}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border bg-white p-2.5 text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue ${checked ? "border-blue ring-1 ring-blue" : "border-line"}`}
                    >
                      <input
                        type="radio"
                        name="headline-font"
                        checked={checked}
                        onChange={() => dispatch({ type: "headlineFont", font: option.id })}
                        className="sr-only"
                      />
                      <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-lg bg-canvas text-lg ${option.preview} ${option.light ? "font-medium" : "font-extrabold"}`}>
                        Aa
                      </span>
                      <span className="leading-tight">{option.label}</span>
                    </label>
                  );
                },
              )}
            </div>
          </fieldset>
        </Section>
      )}

      {sections.includes("style") && brandPanel && <Section title="Brand">{brandPanel}</Section>}

      {sections.includes("style") && (
        <Section title="Background">
          <BackgroundControls project={project} dispatch={dispatch} />
        </Section>
      )}

      {sections.includes("style") && template.editableColors.length > 0 && (
        <Section
          title="Colors"
          action={
            hasColorChanges && (
              <button type="button" onClick={() => dispatch({ type: "resetColors" })} className="rounded-md text-xs font-bold text-blue hover:underline">
                Reset
              </button>
            )
          }
        >
          {brandColors}
          <div className="flex flex-col gap-2">
            {template.editableColors.map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white p-2 pr-3">
                <input
                  type="color"
                  value={theme[key] ?? "#000000"}
                  onChange={(e) => dispatch({ type: "color", key, value: e.target.value.toUpperCase() })}
                  className="size-9 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                />
                <span className="text-sm font-bold">{COLOR_LABELS[key]}</span>
                <span className="ml-auto text-xs text-muted uppercase tabular-nums">{theme[key]}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {sections.includes("style") && hasDevice && (
        <Section title="Device">
          <DeviceControls project={project} dispatch={dispatch} />
        </Section>
      )}
    </div>
  );
}

function Section({ title, action, children }: { title: string | null; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold tracking-[-0.02em]">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
