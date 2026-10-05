import type { Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { getSlideCount } from "@/templates/resolve";
import { renderSlide } from "./templateRenderer";

export type RenderedFile = { name: string; blob: Blob };

/** "01.png", "02.png", … */
export function slideFileName(index: number): string {
  return `${String(index + 1).padStart(2, "0")}.png`;
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create PNG"))), "image/png");
  });
}

/** One slide at full template resolution, independent of preview zoom. */
export async function exportSlide(template: ResolvedTemplate, project: Project, slideIndex: number): Promise<RenderedFile> {
  const canvas = await renderSlide(template, project, slideIndex, { scale: 1 });
  return { name: slideFileName(slideIndex), blob: await canvasToPng(canvas) };
}

/** Every slide, rendered one at a time to keep memory flat. */
export async function exportSet(
  template: ResolvedTemplate,
  project: Project,
  onProgress?: (done: number, total: number) => void,
): Promise<RenderedFile[]> {
  const total = getSlideCount(template, project);
  const files: RenderedFile[] = [];
  for (let i = 0; i < total; i++) {
    files.push(await exportSlide(template, project, i));
    onProgress?.(i + 1, total);
  }
  return files;
}
