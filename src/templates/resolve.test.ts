import { describe, expect, it } from "vitest";
import type { Project, Screenshot } from "@/types/project";
import type { Layout, Template } from "@/types/template";
import {
  fillPlaceholders,
  getSlideCount,
  getSlideValues,
  listPlaceholders,
  resolveColor,
  resolveSlide,
  resolveTemplate,
  themeFor,
  usedImageSlots,
  variablesForSlide,
} from "./resolve";

const single: Layout = {
  id: "single",
  canvas: { width: 1080, height: 1920 },
  variables: [
    { key: "headline", label: "Headline", default: "Default headline", perSlide: true },
    { key: "appName", label: "App name", default: "MyApp" },
  ],
  elements: [
    {
      type: "text", id: "headline", text: "{{headline}} · {{ appName }}",
      x: 0, y: 0, width: 1080, height: 200, font: "display", size: 90, weight: 800, align: "center", color: "$foreground",
    },
    {
      type: "screenshot", id: "shot", slot: 0, x: 200, y: 400, width: 680, height: 1400,
      fit: "cover", device: "phone", shadow: { blur: 40, color: "$primary" },
    },
  ],
};

const duo: Layout = {
  id: "duo",
  canvas: { width: 1080, height: 1920 },
  variables: [
    { key: "badge", label: "Badge", default: "New", perSlide: true },
    { key: "headline", label: "Headline", default: "Duo headline", perSlide: true },
  ],
  elements: [
    {
      type: "text", id: "badge", text: "{{badge}}", x: 0, y: 0, width: 500, height: 80,
      font: "sans", size: 30, weight: 700, align: "center", color: "$background", pill: { fill: "$foreground" },
    },
    { type: "screenshot", id: "shot-back", slot: 1, x: 0, y: 500, width: 500, height: 1000, fit: "cover" },
    { type: "screenshot", id: "shot", slot: 0, x: 400, y: 500, width: 500, height: 1000, fit: "cover" },
  ],
};

const template: Template = {
  id: "test",
  name: "Test",
  category: "Bold",
  canvas: { width: 1080, height: 1920 },
  theme: { background: "#000000", foreground: "#FFFFFF", primary: "#3D5AFE", accent: "#FFD43B" },
  editableColors: ["background", "primary"],
  background: { type: "linear", angle: 180, stops: [{ color: "$background", at: 0 }, { color: "$primary", at: 1 }] },
  grain: 0.05,
  variables: [{ key: "headline", label: "Headline", default: "Template headline", perSlide: true }],
  overrides: { headline: { size: 70 } },
  elements: [{ type: "shape", id: "logo", shape: "circle", x: 0, y: 0, width: 50, height: 50, fill: "$accent", layer: "front" }],
  panorama: [{ type: "shape", id: "glow", shape: "circle", x: 900, y: 0, width: 400, height: 400, fill: "$accent", blur: 100 }],
  slides: [
    { layout: "single", defaults: { headline: "First slide" } },
    {
      layout: "duo",
      background: { type: "solid", color: "$accent" },
      overrides: { shot: { radius: 10 } },
      elements: [{ type: "shape", id: "behind", shape: "rect", x: 0, y: 0, width: 100, height: 100, fill: "#fff" }],
    },
    { layout: "single", overrides: { headline: { size: 60 } } },
    { layout: "duo" },
  ],
};

function shot(id: string): Screenshot {
  return { id, name: `${id}.png`, url: `blob:${id}`, width: 1080, height: 2340 };
}

function project(overrides: Partial<Project> = {}): Project {
  return { templateId: "test", screenshots: [], variables: {}, slideVariables: {}, theme: {}, deviceFrame: true, ...overrides };
}

const resolved = resolveTemplate(template, [single, duo]);

describe("resolveTemplate", () => {
  it("resolves one design per slide with its own layout and background", () => {
    expect(resolved.designs).toHaveLength(4);
    expect(resolved.designs.map((d) => d.slots)).toEqual([1, 2, 1, 2]);
    expect(resolved.designs[0].background).toBe(template.background);
    expect(resolved.designs[1].background).toEqual({ type: "solid", color: "$accent" });
  });

  it("orders template back, slide back, layout, slide front, template front", () => {
    expect(resolved.designs[1].elements.map((e) => e.id)).toEqual(["behind", "badge", "shot-back", "shot", "logo"]);
  });

  it("applies template overrides, then slide overrides", () => {
    const size = (i: number) => resolved.designs[i].elements.find((e) => e.id === "headline");
    expect(size(0)).toMatchObject({ size: 70, weight: 800 });
    expect(size(2)).toMatchObject({ size: 60 });
    expect(resolved.designs[1].elements.find((e) => e.id === "shot")).toMatchObject({ radius: 10 });
    expect(resolved.designs[3].elements.find((e) => e.id === "shot")).not.toHaveProperty("radius");
    expect(single.elements[0]).toMatchObject({ size: 90 }); // layout not mutated
  });

  it("merges variables from all layouts; template variables replace by key", () => {
    expect(resolved.variables.map((v) => [v.key, v.default])).toEqual([
      ["headline", "Template headline"],
      ["appName", "MyApp"],
      ["badge", "New"],
    ]);
  });

  it("keeps panorama and grain", () => {
    expect(resolved.panorama.map((e) => e.id)).toEqual(["glow"]);
    expect(resolved.grain).toBe(0.05);
  });

  it("throws on an unknown layout", () => {
    expect(() => resolveTemplate(template, [single])).toThrow(/unknown layout "duo"/);
  });
});

describe("colors and placeholders", () => {
  it("resolves tokens and passes literals through", () => {
    expect(resolveColor("$accent", resolved.theme)).toBe("#FFD43B");
    expect(resolveColor("rgba(0,0,0,0.5)", resolved.theme)).toBe("rgba(0,0,0,0.5)");
    expect(() => resolveColor("$surface", resolved.theme)).toThrow(/Unknown theme token/);
  });

  it("applies user colors only for editable keys", () => {
    const theme = themeFor(resolved, { theme: { background: "#111111", accent: "#FF0000" } });
    expect(theme.background).toBe("#111111");
    expect(theme.accent).toBe("#FFD43B");
  });

  it("lists and fills, tolerating spaces and unknown keys", () => {
    expect(listPlaceholders("{{a}} and {{ b-c }}")).toEqual(["a", "b-c"]);
    expect(fillPlaceholders("{{a}} and {{ b-c }} {{missing}}", { a: "1", "b-c": "2" })).toBe("1 and 2 ");
  });
});

describe("slides", () => {
  it("shows the full set before upload, then one slide per screenshot", () => {
    expect(getSlideCount(resolved, project())).toBe(4);
    expect(getSlideCount(resolved, project({ screenshots: [shot("a"), shot("b")] }))).toBe(2);
    expect(getSlideCount(resolved, project({ screenshots: "abcdef".split("").map(shot) }))).toBe(6);
  });

  it("lists only the variables a slide uses", () => {
    expect(variablesForSlide(resolved, 0).map((v) => v.key)).toEqual(["headline", "appName"]);
    expect(variablesForSlide(resolved, 1).map((v) => v.key)).toEqual(["badge"]);
    expect(variablesForSlide(resolved, 5).map((v) => v.key)).toEqual(["badge"]); // designs repeat
  });

  it("uses user value, then slide default, then variable default", () => {
    const p = project({
      screenshots: [shot("a"), shot("b"), shot("c")],
      variables: { appName: "Taskly" },
      slideVariables: { c: { headline: "Mine" }, b: { headline: "" } },
    });
    expect(getSlideValues(resolved, p, 0).headline).toBe("First slide");
    expect(getSlideValues(resolved, p, 1).headline).toBe("");
    expect(getSlideValues(resolved, p, 2)).toMatchObject({ headline: "Mine", appName: "Taskly" });

    // Text follows its screenshot when reordered.
    const reordered = { ...p, screenshots: [shot("c"), shot("a"), shot("b")] };
    expect(getSlideValues(resolved, reordered, 0).headline).toBe("Mine");
  });
});

describe("resolveSlide", () => {
  it("produces literal colors, filled text and the panorama segment", () => {
    const p = project({ screenshots: [shot("a"), shot("b"), shot("c")], theme: { primary: "#00FF00" } });
    const spec = resolveSlide(resolved, p, 0);

    expect(spec.background).toEqual({ type: "linear", angle: 180, stops: [{ color: "#000000", at: 0 }, { color: "#00FF00", at: 1 }] });
    expect(spec.grain).toBe(0.05);
    expect(spec.panoramaOffset).toBe(0);
    expect(spec.panorama[0]).toMatchObject({ fill: "#FFD43B", blur: 100 });
    const byId = Object.fromEntries(spec.elements.map((e) => [e.id, e]));
    expect(byId.headline).toMatchObject({ text: "First slide · MyApp", color: "#FFFFFF" });
    expect(byId.shot).toMatchObject({ device: "phone", shadow: { blur: 40, color: "#00FF00" } });
  });

  it("fills extra slots with the next screenshots, wrapping around", () => {
    const p = project({ screenshots: [shot("a"), shot("b"), shot("c")] });
    expect(resolveSlide(resolved, p, 1).screenshots.map((s) => s?.id)).toEqual(["b", "c"]);
    expect(resolveSlide(resolved, p, 2).screenshots.map((s) => s?.id)).toEqual(["c"]);
    // Slide 4 has no own screenshot when only 3 exist, but designs still repeat by index.
    expect(resolveSlide(resolved, project({ screenshots: [shot("a")] }), 0).screenshots.map((s) => s?.id)).toEqual(["a"]);
  });

  it("repeats the panorama segment with the designs", () => {
    const p = project({ screenshots: "abcdef".split("").map(shot) });
    expect(resolveSlide(resolved, p, 1).panoramaOffset).toBe(1080);
    expect(resolveSlide(resolved, p, 5).panoramaOffset).toBe(1080);
  });

  it("resolves pill colors and removes device frames when switched off", () => {
    const spec = resolveSlide(resolved, project({ deviceFrame: false }), 1);
    expect(spec.screenshots).toEqual([null, null]);
    expect(spec.elements.find((e) => e.id === "badge")).toMatchObject({ color: "#000000", pill: { fill: "#FFFFFF" } });
    const own = resolveSlide(resolved, project({ deviceFrame: false }), 0);
    expect(own.elements.find((e) => e.id === "shot")).toMatchObject({ device: undefined });
  });
});

describe("headline font choice", () => {
  it("swaps display/serif text to the chosen font with its weight and spacing", () => {
    const spec = resolveSlide(resolved, project({ headlineFont: "serif" }), 0);
    expect(spec.elements.find((e) => e.id === "headline")).toMatchObject({ font: "serif", weight: 500, letterSpacing: -0.02, size: 70 });
  });

  it("leaves body text (sans) alone", () => {
    const spec = resolveSlide(resolved, project({ headlineFont: "serif" }), 1);
    expect(spec.elements.find((e) => e.id === "badge")).toMatchObject({ font: "sans", weight: 700 });
  });

  it("keeps the template font when nothing is chosen", () => {
    const spec = resolveSlide(resolved, project(), 0);
    expect(spec.elements.find((e) => e.id === "headline")).toMatchObject({ font: "display", weight: 800 });
  });
});

describe("per-slide layout picks", () => {
  it("offers the template's own layouts first, then other compatible ones", () => {
    const tall = { ...single, id: "tall", canvas: { width: 1290, height: 2796 } };
    const extra = { ...single, id: "extra" };
    const r = resolveTemplate(template, [extra, single, duo, tall]);
    expect(r.layoutChoices).toEqual(["single", "duo", "extra"]);
    expect(Object.keys(r.alternates[0])).toEqual(["single", "duo", "extra"]);
  });

  it("swaps a slide's layout, keeping background, extras and defaults", () => {
    const p = project({ screenshots: [shot("a"), shot("b")], slideLayouts: { b: "single" } });
    const spec = resolveSlide(resolved, p, 1);
    expect(spec.background).toMatchObject({ type: "solid", color: "#FFD43B" }); // slide 2's own background
    expect(spec.elements.map((e) => e.id)).toEqual(["behind", "headline", "shot", "logo"]);
    expect(spec.screenshots).toHaveLength(1);
  });

  it("drops slide overrides on other layouts but keeps template overrides", () => {
    const p = project({ slideLayouts: { "slide-2": "duo" } });
    const headless = resolveSlide(resolved, p, 2); // slide 3 normally single with headline size 60
    expect(headless.elements.find((e) => e.id === "headline")).toBeUndefined();
    const back = resolveSlide(resolved, project({ slideLayouts: { "slide-1": "single" } }), 1);
    expect(back.elements.find((e) => e.id === "headline")).toMatchObject({ size: 70 }); // template override
    expect(back.elements.find((e) => e.id === "shot")).not.toHaveProperty("radius", 10); // slide-2 override not applied
  });

  it("lists variables of the picked layout", () => {
    const p = project({ slideLayouts: { "slide-1": "single" } });
    expect(variablesForSlide(resolved, 1, p).map((v) => v.key)).toEqual(["headline", "appName"]);
  });

  it("ignores unknown picks", () => {
    const p = project({ slideLayouts: { "slide-0": "nope" } });
    expect(resolveSlide(resolved, p, 0).elements.map((e) => e.id)).toEqual(resolveSlide(resolved, project(), 0).elements.map((e) => e.id));
  });
});

describe("emphasis defaults", () => {
  it("uses the accent for emphasis and marker unless the template sets them", () => {
    const headline = resolveSlide(resolved, project(), 0).elements.find((e) => e.id === "headline");
    expect(headline).toMatchObject({ emphasis: { color: "#FFD43B" }, marker: "#FFD43B" });
  });
});

describe("generated backdrops", () => {
  it("replaces every slide background with a theme-colored mesh spanning the set", () => {
    const spec = resolveSlide(resolved, project({ backdrop: { kind: "mesh", seed: 1 } }), 1);
    expect(spec.background).toMatchObject({ type: "mesh", seed: 1 });
    expect(spec.background.type === "mesh" && spec.background.colors[0]).toBe("#000000");
    expect(spec.setWidth).toBe(1080 * 4);
  });

  it("produces only real colors (regression: tokens once lost their $)", () => {
    for (const seed of [1, 2, 3, 4]) {
      const bg = resolveSlide(resolved, project({ backdrop: { kind: "mesh", seed } }), 0).background;
      const colors = bg.type === "mesh" ? bg.colors : [];
      expect(colors.length).toBeGreaterThan(2);
      for (const c of colors) expect(c).toMatch(/^(#[0-9A-F]{3,8}|rgba?\()/i);
    }
  });

  it("shuffling rotates the blob colors", () => {
    const colors = (seed: number) => {
      const bg = resolveSlide(resolved, project({ backdrop: { kind: "mesh", seed } }), 0).background;
      return bg.type === "mesh" ? bg.colors : [];
    };
    expect(colors(1)).not.toEqual(colors(2));
    expect(colors(1)[0]).toBe(colors(2)[0]); // base stays the background
  });

  it("builds patterns from background and foreground", () => {
    expect(resolveSlide(resolved, project({ backdrop: { kind: "dots", seed: 1 } }), 0).background).toMatchObject({
      type: "pattern",
      pattern: "dots",
      color: "#000000",
      ink: "#FFFFFF",
    });
  });
  it("collage uses every screenshot as tiles, dimmed with the background", () => {
    const p = project({ backdrop: { kind: "collage", seed: 2 }, screenshots: [shot("a"), shot("b"), shot("c")] });
    expect(p.screenshots).toHaveLength(3);
    const spec = resolveSlide(resolved, p, 0);
    expect(spec.background).toMatchObject({ type: "collage", color: "#000000", seed: 2 });
    expect(spec.collage).toEqual(p.screenshots);
    // Shuffle changes the tilt.
    const tilt = (seed: number) => {
      const bg = resolveSlide(resolved, project({ backdrop: { kind: "collage", seed } }), 0).background;
      return bg.type === "collage" ? bg.tilt : undefined;
    };
    expect(tilt(1)).not.toBe(tilt(2));
    expect(resolveSlide(resolved, project(), 0).collage).toEqual([]);
  });
});

describe("device overrides", () => {
  it("swaps the model and color only where the template shows a device", () => {
    const spec = resolveSlide(resolved, project({ deviceModel: "phone-island", deviceColor: "#E3E5EA" }), 0);
    expect(spec.elements.find((e) => e.id === "shot")).toMatchObject({ device: "phone-island", frameColor: "#E3E5EA" });
    const duoSpec = resolveSlide(resolved, project({ deviceModel: "flat" }), 1);
    expect(duoSpec.elements.find((e) => e.id === "shot-back")).toMatchObject({ device: undefined }); // had no device
  });
});

describe("image slots", () => {
  const withIcon: Template = {
    ...template,
    elements: [
      ...(template.elements ?? []),
      { type: "imageSlot", id: "icon", key: "appIcon", x: 0, y: 0, width: 100, height: 100, fit: "cover", monogram: { text: "{{appName}}", fill: "$accent", color: "#FFFFFF" } },
    ],
  };
  const r = resolveTemplate(withIcon, [single, duo]);

  it("lists the slot keys a template uses", () => {
    expect(usedImageSlots(r)).toEqual(["appIcon"]);
    expect(usedImageSlots(resolved)).toEqual([]);
  });

  it("fills the monogram from the app name and passes user images through", () => {
    const icon = shot("icon");
    const spec = resolveSlide(r, project({ variables: { appName: "Taskly" }, images: { appIcon: icon } }), 0);
    expect(spec.elements.find((e) => e.id === "icon")).toMatchObject({ monogram: { text: "Taskly", fill: "#FFD43B" } });
    expect(spec.images.appIcon).toBe(icon);
  });
});
