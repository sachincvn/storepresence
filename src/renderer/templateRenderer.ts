import type { Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { resolveSlide } from "@/templates/resolve";
import { resolveFeatureGraphic } from "@/templates/featureGraphic";
import { adaptSpec, type OutputSize } from "@/templates/sizes";
import { drawSlide, type ImageSource } from "./canvasRenderer";
import { ensureFonts } from "./fonts";

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(url: string): Promise<HTMLImageElement> {
  let pending = imageCache.get(url);
  if (!pending) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    pending = img.decode().then(
      () => img,
      (error: unknown) => {
        imageCache.delete(url);
        throw error;
      },
    );
    imageCache.set(url, pending);
  }
  return pending;
}

/** Call when an object URL is revoked. */
export function forgetImage(url: string): void {
  imageCache.delete(url);
}

export type RenderOptions = {
  /** 1 = exact template size (export). Smaller for previews. */
  scale?: number;
  /** Draw into this canvas instead of a new one. */
  canvas?: HTMLCanvasElement;
  /** Store size to render; at scale 1 the canvas matches it exactly. Defaults to the template size. */
  size?: OutputSize;
};

/** Renders one output image. Images that fail to load are drawn as placeholders. */
export async function renderSlide(
  template: ResolvedTemplate,
  project: Project,
  slideIndex: number,
  { scale = 1, canvas = document.createElement("canvas"), size }: RenderOptions = {},
): Promise<HTMLCanvasElement> {
  let spec = resolveSlide(template, project, slideIndex);
  let drawScale = scale;
  if (size?.kind === "feature") {
    spec = resolveFeatureGraphic(template, project);
    drawScale = scale * (size.width / spec.canvas.width);
  } else if (size) {
    const adapted = adaptSpec(spec, size);
    spec = adapted.spec;
    drawScale = scale * adapted.scale;
  }

  const allElements = [...spec.panorama, ...spec.elements];
  const urls = [
    ...spec.screenshots.flatMap((s) => (s ? [s.url] : [])),
    ...spec.collage.map((s) => s.url),
    ...allElements.flatMap((el) => (el.type === "image" ? [el.src] : [])),
    ...allElements.flatMap((el) => (el.type === "imageSlot" && spec.images[el.key] ? [spec.images[el.key]!.url] : [])),
  ];
  const [, results] = await Promise.all([
    ensureFonts(allElements),
    Promise.allSettled(urls.map(async (url) => [url, await loadImage(url)] as const)),
  ]);

  const images = new Map<string, ImageSource>();
  for (const r of results) if (r.status === "fulfilled") images.set(r.value[0], r.value[1]);

  drawSlide(canvas, spec, images, drawScale);
  return canvas;
}
