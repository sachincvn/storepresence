"use client";

import { useMemo } from "react";
import type { Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { designFor, getSlideKey } from "@/templates/resolve";
import { layoutName } from "./layoutNames";
import { SlideCanvas } from "./SlideCanvas";

type LayoutPickerProps = {
  template: ResolvedTemplate;
  project: Project;
  slide: number;
  onPick: (layout: string) => void;
};

/** The current slide rendered in every layout it can switch to. */
export function LayoutPicker({ template, project, slide, onPick }: LayoutPickerProps) {
  const key = getSlideKey(template, project, slide);
  const current = designFor(template, slide, project).layout;
  const own = designFor(template, slide).layout;

  const variants = useMemo(
    () =>
      template.layoutChoices.map((id) => ({
        id,
        project: { ...project, slideLayouts: { ...project.slideLayouts, [key]: id } },
      })),
    [template, project, key],
  );

  return (
    <fieldset>
      <legend className="sr-only">Layout for slide {slide + 1}</legend>
      <div className="grid grid-cols-3 gap-2">
        {variants.map((v) => {
          const checked = v.id === current;
          return (
            <label
              key={v.id}
              className={`flex cursor-pointer flex-col gap-1.5 rounded-xl border bg-white p-1.5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue ${
                checked ? "border-blue ring-1 ring-blue" : "border-line hover:border-ink/30"
              }`}
            >
              <input type="radio" name="slide-layout" checked={checked} onChange={() => onPick(v.id)} className="sr-only" />
              <span className="relative block">
                <SlideCanvas template={template} project={v.project} slideIndex={slide} scale={0.07} delay={300} lazy className="w-full rounded-lg" />
                {v.id === own && (
                  <span className="absolute top-1 left-1 rounded-md bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold text-white">Default</span>
                )}
              </span>
              <span className="truncate px-0.5 text-[11px] leading-tight font-bold">{layoutName(v.id)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
