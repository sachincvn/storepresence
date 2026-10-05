import { describe, expect, it } from "vitest";
import { fitImageToSlot, safeFitMode, type FitResult } from "./imageFit";

describe("safeFitMode", () => {
  it.each([
    ["phone shot into phone slot", 1080, 2340, "cover"],
    ["very tall capture (bottom cropped, header kept)", 1080, 6000, "cover"],
    ["slightly wider 9:16 shot", 1080, 1920, "cover"],
    ["tablet 3:4 (cuts ~35%+ of the sides)", 1536, 2048, "contain"],
    ["landscape", 2560, 1600, "contain"],
    ["square", 1000, 1000, "contain"],
  ] as const)("%s → %s", (_, w, h, expected) => {
    expect(safeFitMode(w, h, 700, 1440, "cover")).toBe(expected);
  });

  it("never changes contain", () => {
    expect(safeFitMode(2560, 1600, 700, 1440, "contain")).toBe("contain");
  });
});

// Phone-style slot used by most templates.
const SLOT_W = 700;
const SLOT_H = 1440;

function ratio(w: number, h: number) {
  return w / h;
}

/** Source crop and destination rect must keep the image's proportions. */
function expectUndistorted(r: FitResult) {
  expect(ratio(r.dw, r.dh)).toBeCloseTo(ratio(r.sw, r.sh), 6);
}

/** Destination must stay inside the slot, source inside the image. */
function expectInBounds(r: FitResult, iw: number, ih: number, sw = SLOT_W, sh = SLOT_H) {
  expect(r.dx).toBeGreaterThanOrEqual(-1e-9);
  expect(r.dy).toBeGreaterThanOrEqual(-1e-9);
  expect(r.dx + r.dw).toBeLessThanOrEqual(sw + 1e-9);
  expect(r.dy + r.dh).toBeLessThanOrEqual(sh + 1e-9);
  expect(r.sx).toBeGreaterThanOrEqual(-1e-9);
  expect(r.sy).toBeGreaterThanOrEqual(-1e-9);
  expect(r.sx + r.sw).toBeLessThanOrEqual(iw + 1e-9);
  expect(r.sy + r.sh).toBeLessThanOrEqual(ih + 1e-9);
}

const cases: [name: string, w: number, h: number][] = [
  ["portrait 9:16", 1080, 1920],
  ["modern phone 9:19.5", 1080, 2340],
  ["very tall scrolling capture", 1080, 6000],
  ["landscape 16:10", 2560, 1600],
  ["tablet 3:4", 1536, 2048],
  ["square", 1000, 1000],
  ["tiny", 120, 240],
];

describe("fitImageToSlot", () => {
  describe.each(cases)("%s", (_, iw, ih) => {
    it("contain shows the whole image, undistorted, inside the slot", () => {
      const r = fitImageToSlot(iw, ih, SLOT_W, SLOT_H, "contain");
      expect(r).toMatchObject({ sx: 0, sy: 0, sw: iw, sh: ih });
      expectUndistorted(r);
      expectInBounds(r, iw, ih);
      // At least one side touches the slot edges.
      expect(Math.max(r.dw / SLOT_W, r.dh / SLOT_H)).toBeCloseTo(1, 9);
    });

    it("cover fills the slot, undistorted, cropping only the source", () => {
      const r = fitImageToSlot(iw, ih, SLOT_W, SLOT_H, "cover");
      expect(r).toMatchObject({ dx: 0, dy: 0, dw: SLOT_W, dh: SLOT_H });
      expectUndistorted(r);
      expectInBounds(r, iw, ih);
    });
  });

  it("contain centers vertically by default and pins to top with align top", () => {
    const centered = fitImageToSlot(2560, 1600, SLOT_W, SLOT_H, "contain");
    expect(centered.dw).toBe(SLOT_W);
    expect(centered.dh).toBeCloseTo(437.5, 9);
    expect(centered.dx).toBe(0);
    expect(centered.dy).toBeCloseTo((SLOT_H - 437.5) / 2, 9);

    const top = fitImageToSlot(2560, 1600, SLOT_W, SLOT_H, "contain", "top");
    expect(top.dy).toBe(0);
  });

  it("cover crops a tall capture from the center, or from the top with align top", () => {
    // 1080×6000 into 700×1440: scale = 700/1080, visible source height = 1440 / scale.
    const visible = 1440 / (700 / 1080);
    const centered = fitImageToSlot(1080, 6000, SLOT_W, SLOT_H, "cover");
    expect(centered.sw).toBeCloseTo(1080, 9);
    expect(centered.sh).toBeCloseTo(visible, 9);
    expect(centered.sy).toBeCloseTo((6000 - visible) / 2, 9);

    const top = fitImageToSlot(1080, 6000, SLOT_W, SLOT_H, "cover", "top");
    expect(top.sy).toBe(0);
    expect(top.sh).toBeCloseTo(visible, 9);
  });

  it("cover crops a wide image from the sides, always centered horizontally", () => {
    const r = fitImageToSlot(2560, 1600, SLOT_W, SLOT_H, "cover", "top");
    const visibleW = 700 / (1440 / 1600);
    expect(r.sh).toBeCloseTo(1600, 9);
    expect(r.sw).toBeCloseTo(visibleW, 9);
    expect(r.sx).toBeCloseTo((2560 - visibleW) / 2, 9);
  });

  it("exact ratio match fills the slot in both modes", () => {
    for (const mode of ["contain", "cover"] as const) {
      expect(fitImageToSlot(1400, 2880, SLOT_W, SLOT_H, mode)).toEqual({
        sx: 0, sy: 0, sw: 1400, sh: 2880, dx: 0, dy: 0, dw: SLOT_W, dh: SLOT_H,
      });
    }
  });

  it("upscales small images to the slot", () => {
    const r = fitImageToSlot(120, 240, SLOT_W, SLOT_H, "contain");
    expect(r.dw).toBeCloseTo(SLOT_W, 9);
    expect(r.dh).toBeCloseTo(1400, 9);
  });

  it.each([
    [0, 100, 100, 100],
    [100, -1, 100, 100],
    [100, 100, Number.NaN, 100],
    [100, 100, 100, Number.POSITIVE_INFINITY],
  ])("rejects invalid size %s×%s → %s×%s", (iw, ih, sw, sh) => {
    expect(() => fitImageToSlot(iw, ih, sw, sh, "contain")).toThrow(RangeError);
  });
});
