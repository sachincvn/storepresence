import type { Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { getSlideCount } from "@/templates/resolve";
import { DEFAULT_SIZE, getSize, type OutputSize, type SizeId } from "@/templates/sizes";
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

/** One slide at full resolution for a store size, independent of preview zoom. */
export async function exportSlide(template: ResolvedTemplate, project: Project, slideIndex: number, size: OutputSize = getSize(DEFAULT_SIZE)): Promise<RenderedFile> {
  const canvas = await renderSlide(template, project, slideIndex, { scale: 1, size });
  const name = size.kind === "feature" ? "feature-graphic.png" : slideFileName(slideIndex);
  return { name, blob: await canvasToPng(canvas) };
}

/**
 * File list for an export: every slide per screenshot size, one banner per
 * feature size. Only the default phone size gives flat names (01.png);
 * otherwise files go into store folders (app-store/iphone-6.9/01.png).
 */
export function exportPlan(slideCount: number, sizeIds: readonly SizeId[]): { size: OutputSize; slide: number; name: string }[] {
  const sizes = (sizeIds.length > 0 ? sizeIds : [DEFAULT_SIZE]).map(getSize);
  const flat = sizes.length === 1 && sizes[0].id === DEFAULT_SIZE;
  return sizes.flatMap((size) => {
    const slides = size.kind === "feature" ? [0] : Array.from({ length: slideCount }, (_, i) => i);
    return slides.map((slide) => {
      const file = size.kind === "feature" ? "feature-graphic.png" : slideFileName(slide);
      return { size, slide, name: flat ? file : `${size.folder}/${file}` };
    });
  });
}

/** Every file for the chosen sizes, rendered one at a time to keep memory flat. */
export async function exportSet(
  template: ResolvedTemplate,
  project: Project,
  sizeIds: readonly SizeId[] = [DEFAULT_SIZE],
  onProgress?: (done: number, total: number) => void,
): Promise<RenderedFile[]> {
  const plan = exportPlan(getSlideCount(template, project), sizeIds);
  const files: RenderedFile[] = [];
  for (const [i, item] of plan.entries()) {
    const { blob } = await exportSlide(template, project, item.slide, item.size);
    files.push({ name: item.name, blob });
    onProgress?.(i + 1, plan.length);
  }
  return files;
}
