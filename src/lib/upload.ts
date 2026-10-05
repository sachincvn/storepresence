import type { Screenshot } from "@/types/project";

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const ACCEPT_ATTR = ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";
const ACCEPTED_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

/** Longest side kept in memory. Larger uploads are downscaled; exports never need more. */
export const MAX_SIDE = 3000;

/** Stores accept up to 8 phone screenshots; a little headroom for alternatives. */
export const MAX_SCREENSHOTS = 10;

/** Some systems leave `type` empty, so fall back to the extension. */
export function isAcceptedFile(file: { type: string; name: string }): boolean {
  return file.type ? ACCEPTED_TYPES.includes(file.type) : ACCEPTED_EXTENSIONS.test(file.name);
}

export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Decodes an uploaded file into an in-memory screenshot (object URL). Browser only. */
export async function readScreenshot(file: File): Promise<Screenshot> {
  const bitmap = await createImageBitmap(file);
  try {
    const size = fitWithin(bitmap.width, bitmap.height, MAX_SIDE);
    if (size.width === bitmap.width && size.height === bitmap.height) {
      return { id: newId(), name: file.name, url: URL.createObjectURL(file), width: bitmap.width, height: bitmap.height };
    }

    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is not available");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    const type = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not resize image"))), type, 0.92),
    );
    return { id: newId(), name: file.name, url: URL.createObjectURL(blob), ...size };
  } finally {
    bitmap.close();
  }
}
