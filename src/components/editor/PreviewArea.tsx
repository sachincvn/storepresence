"use client";

import type { KeyboardEvent } from "react";
import type { Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { getSlideCount } from "@/templates/resolve";
import { SlideCanvas } from "./SlideCanvas";
import { SlideToolbar, type SlideActions } from "./SlideToolbar";
import { StorePreview } from "./StorePreview";
import type { LayoutMode } from "./useLayoutMode";

const PREVIEW_SCALE = 0.5;

export type View = "slide" | "set" | "store";

const VIEWS: { id: View; label: string }[] = [
  { id: "slide", label: "Slide" },
  { id: "set", label: "Full set" },
  { id: "store", label: "Store preview" },
];

type PreviewAreaProps = {
  template: ResolvedTemplate;
  project: Project;
  slide: number;
  view: View;
  mode: LayoutMode;
  appName: string;
  onViewChange: (view: View) => void;
  onSlideChange: (index: number) => void;
  onAppNameChange: (name: string) => void;
  slideActions: SlideActions;
};

export function PreviewArea(props: PreviewAreaProps) {
  const { template, project, slide, view, mode } = props;
  const slideCount = getSlideCount(template, project);
  const slides = Array.from({ length: slideCount }, (_, i) => i);
  const desktop = mode === "desktop";
  const ratio = template.canvas.width / template.canvas.height;

  const editSlide = (index: number) => {
    props.onSlideChange(index);
    props.onViewChange("slide");
  };

  // Arrow keys move between slides in the strip.
  const onStripKey = (e: KeyboardEvent<HTMLOListElement>) => {
    const next = e.key === "ArrowRight" ? slide + 1 : e.key === "ArrowLeft" ? slide - 1 : e.key === "Home" ? 0 : e.key === "End" ? slideCount - 1 : null;
    if (next === null || next < 0 || next >= slideCount) return;
    e.preventDefault();
    props.onSlideChange(next);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  return (
    <>
      <div role="group" aria-label="Preview mode" className="flex rounded-2xl border border-line bg-white p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            onClick={() => props.onViewChange(v.id)}
            className={`rounded-xl px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-colors sm:px-3.5 ${view === v.id ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "slide" && (
        <>
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            <SlideCanvas
              template={template}
              project={project}
              slideIndex={slide}
              scale={PREVIEW_SCALE}
              delay={80}
              label={`Preview of slide ${slide + 1} of ${slideCount}, ${template.name} template`}
              className={`rounded-[20px] shadow-[0_24px_60px_-28px_rgb(22_19_31/0.45)] ${desktop ? "h-full max-h-full w-auto max-w-full" : "h-auto"}`}
              // Off desktop, size by width but cap the height so the slide strip stays in view.
              style={desktop ? undefined : { width: `min(100%, 400px, calc(${mode === "mobile" ? 58 : 66}dvh * ${ratio}))` }}
            />
          </div>
          <div className="flex w-full flex-col items-center gap-2">
            <ol aria-label="Slides, use arrow keys to move" onKeyDown={onStripKey} className="flex max-w-full gap-2 overflow-x-auto p-1">
              {slides.map((i) => (
                <li key={i} className="shrink-0">
                  <button
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    aria-current={i === slide ? "true" : undefined}
                    tabIndex={i === slide ? 0 : -1}
                    onClick={() => props.onSlideChange(i)}
                    className={`block rounded-lg p-0.5 ${i === slide ? "ring-2 ring-blue" : "ring-1 ring-line hover:ring-ink/30"}`}
                  >
                    <SlideCanvas template={template} project={project} slideIndex={i} scale={0.06} delay={200} lazy className="w-11 rounded-md" />
                  </button>
                </li>
              ))}
            </ol>
            <SlideToolbar slide={slide} count={slideCount} {...props.slideActions} />
            <p className="text-xs text-muted tabular-nums">
              Slide {slide + 1} of {slideCount}, {template.canvas.width} × {template.canvas.height} px
            </p>
          </div>
        </>
      )}

      {view === "set" && (
        <div className="flex min-h-0 w-full flex-1 flex-col justify-center gap-3">
          {/* Tight gaps, like a store carousel, so shapes that span slides read as one piece. */}
          <ol aria-label="Full set" className={`flex min-h-0 gap-1.5 overflow-x-auto pb-2 ${desktop ? "flex-1" : ""}`}>
            {slides.map((i) => (
              <li key={i} className={`flex shrink-0 ${desktop ? "h-full" : ""}`}>
                <button type="button" onClick={() => editSlide(i)} aria-label={`Edit slide ${i + 1}`} className={`block rounded-xl ${desktop ? "h-full" : ""}`}>
                  <SlideCanvas
                    template={template}
                    project={project}
                    slideIndex={i}
                    scale={0.3}
                    delay={120}
                    className={`w-auto rounded-xl ${desktop ? "h-full" : "h-[min(420px,60dvh)]"}`}
                  />
                </button>
              </li>
            ))}
          </ol>
          <p className="text-center text-xs text-muted">Select a slide to edit it.</p>
        </div>
      )}

      {view === "store" && (
        <div className={`flex w-full justify-center ${desktop ? "min-h-0 flex-1 overflow-y-auto" : ""}`}>
          <StorePreview template={template} project={project} appName={props.appName} onAppNameChange={props.onAppNameChange} onSelectSlide={editSlide} />
        </div>
      )}
    </>
  );
}
