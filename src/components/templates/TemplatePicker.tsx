"use client";

import { useMemo } from "react";
import type { Project } from "@/types/project";
import { templates } from "@/templates/registry";
import { SlideCanvas } from "@/components/editor/SlideCanvas";

type TemplatePickerProps = {
  project: Project;
  selectedId: string;
  onSelect: (id: string) => void;
  /** Vertical list in the desktop sidebar, horizontal carousel elsewhere. */
  layout: "list" | "carousel";
};

const STRIP_SLIDES = 4;

/** Each template shown as its first slides side by side, with the user's own screenshots and text. */
export function TemplatePicker({ project, selectedId, onSelect, layout }: TemplatePickerProps) {
  // Thumbnails show each template's own palette, not the user's color overrides.
  const preview = useMemo(() => ({ ...project, theme: {} }), [project]);

  return (
    <nav aria-labelledby="templates-heading">
      <h2 id="templates-heading" className="font-display text-lg font-extrabold tracking-[-0.02em]">
        Templates
      </h2>
      <ul className={layout === "list" ? "mt-3 flex flex-col gap-3" : "-mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-3"}>
        {templates.map((t) => {
          const selected = t.id === selectedId;
          return (
            <li key={t.id} className={layout === "list" ? "" : "w-56 shrink-0 snap-start"}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(t.id)}
                className={`w-full rounded-2xl p-2 text-left transition-colors ${
                  selected ? "bg-white ring-2 ring-blue" : "ring-1 ring-line hover:bg-white"
                }`}
              >
                <span className="flex gap-0.5 overflow-hidden rounded-[10px]">
                  {Array.from({ length: STRIP_SLIDES }, (_, i) => (
                    <SlideCanvas key={i} template={t} project={preview} slideIndex={i} scale={0.08} delay={300} lazy className="min-w-0 flex-1" />
                  ))}
                </span>
                <span className="mt-2 flex items-baseline justify-between gap-2 px-0.5">
                  <span className="truncate text-sm font-bold">{t.name}</span>
                  <span className="shrink-0 text-xs text-muted">{t.category}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
