"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project, Screenshot } from "@/types/project";
import { SlideCanvas } from "@/components/editor/SlideCanvas";
import { getSharedSampleScreenshots } from "@/lib/sampleShots";
import { getTemplate } from "@/templates/registry";

type TemplateSetPreviewProps = {
  templateId: string;
  /** How many slides of the set to show side by side. */
  slides?: number;
  className?: string;
};

/**
 * Real renderer output of a template's first slides, for marketing pages.
 * Renders only once scrolled near the viewport.
 */
export function TemplateSetPreview({ templateId, slides = 3, className = "" }: TemplateSetPreviewProps) {
  const template = getTemplate(templateId);
  const ref = useRef<HTMLDivElement>(null);
  const [samples, setSamples] = useState<Screenshot[] | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setSamples(getSharedSampleScreenshots());
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const project = useMemo<Project | null>(
    () =>
      template && samples
        ? { templateId: template.id, screenshots: samples, variables: {}, slideVariables: {}, theme: {}, deviceFrame: true }
        : null,
    [template, samples],
  );

  if (!template) return null;

  return (
    <div ref={ref} aria-hidden="true" className={`flex gap-1 overflow-hidden rounded-[20px] ${className}`}>
      {Array.from({ length: slides }, (_, i) => (
        <div key={i} className="aspect-[9/16] min-w-0 flex-1 bg-canvas">
          {project && <SlideCanvas template={template} project={project} slideIndex={i} scale={0.22} className="block h-full w-full" />}
        </div>
      ))}
    </div>
  );
}
