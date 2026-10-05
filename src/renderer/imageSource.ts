export type ImageSource = HTMLImageElement | ImageBitmap | HTMLCanvasElement;

export function sizeOf(img: ImageSource): { w: number; h: number } {
  return img instanceof HTMLImageElement ? { w: img.naturalWidth, h: img.naturalHeight } : { w: img.width, h: img.height };
}
