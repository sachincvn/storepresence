import { describe, expect, it } from "vitest";
import { fitWithin, isAcceptedFile, MAX_SIDE } from "./upload";

describe("isAcceptedFile", () => {
  it.each([
    ["image/png", "a.png", true],
    ["image/jpeg", "a.jpg", true],
    ["image/webp", "a.webp", true],
    ["image/gif", "a.gif", false],
    ["image/heic", "a.heic", false],
    ["image/svg+xml", "a.svg", false],
    ["", "shot.JPEG", true],
    ["", "shot.webp", true],
    ["", "notes.txt", false],
  ])("%s %s → %s", (type, name, expected) => {
    expect(isAcceptedFile({ type, name })).toBe(expected);
  });
});

describe("fitWithin", () => {
  it("keeps images that already fit", () => {
    expect(fitWithin(1080, 2340, MAX_SIDE)).toEqual({ width: 1080, height: 2340 });
  });

  it("scales the longest side down, keeping the ratio", () => {
    expect(fitWithin(1440, 6000, 3000)).toEqual({ width: 720, height: 3000 });
    expect(fitWithin(4000, 2500, 3000)).toEqual({ width: 3000, height: 1875 });
  });

  it("never upscales", () => {
    expect(fitWithin(200, 400, 3000)).toEqual({ width: 200, height: 400 });
  });
});
