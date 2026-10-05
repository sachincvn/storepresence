import { describe, expect, it } from "vitest";
import { templates } from "@/templates/registry";
import { contrast, ensureContrast } from "./color";
import { brandThemes, extractPalette } from "./palette";

/** RGBA pixels: [hex, count] pairs, plus optional transparent pixels. */
function pixels(parts: [string, number][], transparent = 0): Uint8ClampedArray {
  const out: number[] = [];
  for (const [hex, count] of parts) {
    const n = Number.parseInt(hex.slice(1), 16);
    for (let i = 0; i < count; i++) out.push((n >> 16) & 255, (n >> 8) & 255, n & 255, 255);
  }
  for (let i = 0; i < transparent; i++) out.push(0, 0, 0, 0);
  return new Uint8ClampedArray(out);
}

describe("color helpers", () => {
  it("computes WCAG contrast", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21);
    expect(contrast("#777777", "#777777")).toBeCloseTo(1);
  });

  it("nudges colors until they reach the contrast asked for", () => {
    const fixed = ensureContrast("#FFE14D", "#FFFFFF", 3);
    expect(contrast(fixed, "#FFFFFF")).toBeGreaterThanOrEqual(3);
    expect(ensureContrast("#16131F", "#FFFFFF", 4.5)).toBe("#16131F");
  });
});

describe("extractPalette", () => {
  it("finds main colors by share, ignoring transparent pixels", () => {
    const palette = extractPalette(pixels([["#7B5CFF", 600], ["#FF6FAE", 300], ["#FFFFFF", 100]], 500));
    expect(palette.map((c) => c.hex)).toEqual(["#7B5CFF", "#FF6FAE", "#FFFFFF"]);
    expect(palette[0].weight).toBeCloseTo(0.6);
  });

  it("merges near shades into one color", () => {
    const palette = extractPalette(pixels([["#3D5AFE", 500], ["#4060F8", 500]]));
    expect(palette).toHaveLength(1);
  });

  it("returns nothing for a fully transparent image", () => {
    expect(extractPalette(pixels([], 100))).toEqual([]);
  });
});

describe("brandThemes", () => {
  const purpleIcon = extractPalette(pixels([["#FFFFFF", 500], ["#7B5CFF", 400], ["#FF6FAE", 100]]));

  it("only touches colors the template lets users edit, with readable text", () => {
    for (const template of templates) {
      for (const s of brandThemes(purpleIcon, template.theme, template.editableColors)) {
        expect(Object.keys(s.theme).every((k) => template.editableColors.includes(k as never)), `${template.id}/${s.id}`).toBe(true);
        const look = { ...template.theme, ...s.theme };
        if (s.theme.background) expect(contrast(look.background!, look.foreground!), `${template.id}/${s.id} text`).toBeGreaterThanOrEqual(4.5);
        if (s.theme.accent && look.background) expect(contrast(look.accent!, look.background), `${template.id}/${s.id} accent`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("offers accent, bold and soft when the background is editable", () => {
    const studio = templates.find((t) => t.id === "studio-blue")!;
    const suggestions = brandThemes(purpleIcon, studio.theme, studio.editableColors);
    expect(suggestions.map((s) => s.id)).toEqual(["accent", "bold", "soft"]);
    // The brand color (not the white icon background) leads.
    expect(suggestions[1].theme.background).not.toBe("#FFFFFF");
  });

  it("offers only an accent when the background is fixed", () => {
    const cinematic = templates.find((t) => t.id === "cinematic")!;
    expect(brandThemes(purpleIcon, cinematic.theme, cinematic.editableColors).map((s) => s.id)).toEqual(["accent"]);
  });
});
