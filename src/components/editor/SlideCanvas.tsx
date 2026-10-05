"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { renderSlide } from "@/renderer/templateRenderer";
import type { OutputSize } from "@/templates/sizes";

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
  /** Wait until the canvas is near the viewport before rendering (thumbnails). */
  lazy?: boolean;
  /** Store size to preview; defaults to the template size. */
  size?: OutputSize;
};

/** Live preview of one slide. Renders off-screen, then swaps in, so it never flashes blank. */
export function SlideCanvas({ template, project, slideIndex, scale, delay = 0, label, className = "", style, lazy = false, size }: SlideCanvasProps) {
  const box = size ?? template.canvas;
  // Reflowed sizes draw at the size's own resolution; keep the preview about as heavy as the template size.
  const relative = size ? scale * (template.canvas.width / size.width) : scale;
  const ref = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(!lazy);

  useEffect(() => {
    const canvas = ref.current;
    if (visible || !canvas) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setVisible(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const rendered = await renderSlide(template, project, slideIndex, { scale: relative, size });
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
  }, [template, project, slideIndex, relative, size, delay, visible]);

  return (
    <canvas
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      width={Math.round(box.width * relative)}
      height={Math.round(box.height * relative)}
      style={{ aspectRatio: `${box.width} / ${box.height}`, ...style }}
      className={className}
    />
  );
}
