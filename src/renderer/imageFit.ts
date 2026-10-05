import type { FitAlign, FitMode } from "@/types/template";

/** Arguments for `ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)`, relative to the slot origin. */
export type FitResult = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

/** Share of the image width that cover may cut from the sides before falling back to contain. */
export const MAX_SIDE_CROP = 0.35;

/**
 * "Crop safely": cover may trim the bottom of tall screenshots (the header
 * stays visible), but must not cut away most of a wide image's sides.
 */
export function safeFitMode(imageWidth: number, imageHeight: number, slotWidth: number, slotHeight: number, mode: FitMode): FitMode {
  if (mode !== "cover") return mode;
  const imageRatio = imageWidth / imageHeight;
  const slotRatio = slotWidth / slotHeight;
  const sideCrop = imageRatio > slotRatio ? 1 - slotRatio / imageRatio : 0;
  return sideCrop > MAX_SIDE_CROP ? "contain" : "cover";
}

/**
 * Places an image in a slot without distortion.
 *
 * - `contain`: whole image visible, centered, empty bands where ratios differ.
 * - `cover`: slot filled, overflow cropped from the source.
 *
 * `align: "top"` pins the image to the top edge (keeps status bar and header
 * when cropping tall screenshots); horizontal placement is always centered.
 */
export function fitImageToSlot(
  imageWidth: number,
  imageHeight: number,
  slotWidth: number,
  slotHeight: number,
  mode: FitMode,
  align: FitAlign = "center",
): FitResult {
  for (const [name, value] of [
    ["imageWidth", imageWidth],
    ["imageHeight", imageHeight],
    ["slotWidth", slotWidth],
    ["slotHeight", slotHeight],
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError(`fitImageToSlot: ${name} must be a positive number, got ${value}`);
    }
  }

  const scaleX = slotWidth / imageWidth;
  const scaleY = slotHeight / imageHeight;

  if (mode === "contain") {
    const scale = Math.min(scaleX, scaleY);
    const dw = imageWidth * scale;
    const dh = imageHeight * scale;
    return {
      sx: 0,
      sy: 0,
      sw: imageWidth,
      sh: imageHeight,
      dx: (slotWidth - dw) / 2,
      dy: align === "top" ? 0 : (slotHeight - dh) / 2,
      dw,
      dh,
    };
  }

  const scale = Math.max(scaleX, scaleY);
  const sw = slotWidth / scale;
  const sh = slotHeight / scale;
  return {
    sx: (imageWidth - sw) / 2,
    sy: align === "top" ? 0 : (imageHeight - sh) / 2,
    sw,
    sh,
    dx: 0,
    dy: 0,
    dw: slotWidth,
    dh: slotHeight,
  };
}
