"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { renderSlide } from "@/renderer/templateRenderer";

type SlideCanvasProps = {
  template: ResolvedTemplate;
  project: Project;
  slideIndex: number;
  /** Render resolution relative to the template size. */
  scale: number;
  /** Debounce in ms, so typing does not re-render on every key. */
  delay?: number;
  /** Accessible name. Omit for decorative thumbnails inside a labelled control. */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/** Live preview of one slide. Renders off-screen, then swaps in, so it never flashes blank. */
export function SlideCanvas({ template, project, slideIndex, scale, delay = 0, label, className = "", style }: SlideCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const rendered = await renderSlide(template, project, slideIndex, { scale });
        const canvas = ref.current;
        if (cancelled || !canvas) return;
        canvas.width = rendered.width;
        canvas.height = rendered.height;
        canvas.getContext("2d")?.drawImage(rendered, 0, 0);
      } catch (error) {
        console.error(`Preview failed for template "${template.id}"`, error);
      }
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [template, project, slideIndex, scale, delay]);

  return (
    <canvas
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      width={Math.round(template.canvas.width * scale)}
      height={Math.round(template.canvas.height * scale)}
      style={{ aspectRatio: `${template.canvas.width} / ${template.canvas.height}`, ...style }}
      className={className}
    />
  );
}
