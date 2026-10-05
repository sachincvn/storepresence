import { describe, expect, it } from "vitest";
import type { Layout } from "@/types/template";
import { validateLayout, validateTemplate } from "./validate";

const layout: Layout = {
  id: "phone",
  canvas: { width: 1080, height: 1920 },
  variables: [{ key: "headline", label: "Headline", default: "Hi", perSlide: true }],
  elements: [
    {
      type: "text", id: "headline", text: "{{headline}}",
      x: 90, y: 100, width: 900, height: 200, font: "display", size: 90, weight: 800, align: "center", color: "$foreground",
    },
    { type: "screenshot", id: "shot", slot: 0, x: 200, y: 400, width: 680, height: 1600, fit: "cover" },
  ],
};

const valid = {
  id: "my-template",
  name: "My Template",
  category: "Bold",
  canvas: { width: 1080, height: 1920 },
  theme: { background: "#000000", foreground: "#FFFFFF" },
  editableColors: ["background"],
  background: { type: "solid", color: "$background" },
  slides: [{ layout: "phone" }, { layout: "phone" }, { layout: "phone" }, { layout: "phone", defaults: { headline: "Last" } }],
};

/** Copy with changes, so cases stay independent. */
function withChanges(changes: Record<string, unknown>) {
  return { ...structuredClone(valid), ...changes };
}

function withSlide(index: number, changes: Record<string, unknown>) {
  const t = structuredClone(valid);
  t.slides[index] = { ...t.slides[index], ...changes } as (typeof t.slides)[number];
  return t;
}

describe("validateTemplate", () => {
  it("accepts a valid template", () => {
    expect(validateTemplate(valid, [layout])).toEqual([]);
  });

  it("rejects non-objects", () => {
    expect(validateTemplate(null, [layout])).toEqual(["Template must be a JSON object"]);
    expect(validateTemplate([], [layout])).toHaveLength(1);
  });

  it.each([
    ["bad id", { id: "My Template" }, /My Template › id: must be kebab-case/],
    ["missing name", { name: "" }, /name: is required/],
    ["missing canvas", { canvas: undefined }, /canvas: must be/],
    ["too few slides", { slides: [{ layout: "phone" }] }, /slides: needs at least 4 slide designs \(got 1\)/],
    ["slides not an array", { slides: {} }, /slides: must be an array/],
    ["grain out of range", { grain: 1 }, /grain: must be 0–0.3/],
    ["unknown theme key", { theme: { background: "#000", foreground: "#fff", brand: "#f00" } }, /theme.brand: unknown key/],
    ["token as theme value", { theme: { background: "$foreground", foreground: "#fff" } }, /theme.background: must be a literal color/],
    ["editable color not in theme", { editableColors: ["accent"] }, /"accent" is not defined in theme/],
    ["editable color not hex", { theme: { background: "rgb(0,0,0)", foreground: "#fff" } }, /must be a #RRGGBB hex color/],
    ["bad background", { background: { type: "wallpaper" } }, /background.type/],
    ["gradient with one stop", { background: { type: "linear", angle: 0, stops: [{ color: "#000", at: 0 }] } }, /at least 2 stops/],
    ["background token missing", { background: { type: "solid", color: "$accent" } }, /unknown theme token "\$accent"/],
    ["template override unknown element", { overrides: { nope: { size: 1 } } }, /overrides.nope: no element "nope"/],
    ["panorama screenshot", { panorama: [{ type: "screenshot", id: "s", slot: 0, x: 0, y: 0, width: 10, height: 10, fit: "cover" }] }, /panorama › s: screenshots are not allowed here/],
  ])("reports %s", (_, changes, message) => {
    expect(validateTemplate(withChanges(changes), [layout]).join("\n")).toMatch(message);
  });

  it.each([
    ["unknown layout", { layout: "nope" }, /slides\[1\] › layout: unknown layout "nope" \(known: phone\)/],
    ["override changes type", { overrides: { headline: { type: "shape" } } }, /slides\[1\] › overrides.headline: cannot change type or id/],
    ["override on slide without layout", { layout: undefined, overrides: { headline: { size: 1 } } }, /only work on slides with a layout/],
    ["bad slide background", { background: { type: "solid" } }, /slides\[1\] › background.color: must be a color string/],
    ["default for unknown variable", { defaults: { tagline: "x" } }, /slides\[1\] › defaults.tagline: no variable with this key/],
  ])("reports slide problem: %s", (_, changes, message) => {
    expect(validateTemplate(withSlide(1, changes), [layout]).join("\n")).toMatch(message);
  });

  it("reports layouts whose canvas differs from the template", () => {
    const wide = { ...layout, id: "wide", canvas: { width: 1290, height: 2796 } };
    expect(validateTemplate(withSlide(0, { layout: "wide" }), [layout, wide]).join("\n")).toMatch(/"wide" is 1290×2796, template is 1080×1920/);
  });

  it("catches values broken by overrides", () => {
    const errors = validateTemplate(withChanges({ overrides: { headline: { size: -5 } } }), [layout]);
    expect(errors).toContain("my-template › slides[0] › headline: size must be a positive number");
  });

  it("checks slide elements: tokens, ids, placeholders, slots, bounds, new fields", () => {
    const errors = validateTemplate(
      withSlide(2, {
        elements: [
          { type: "shape", id: "blob", shape: "circle", x: 0, y: 0, width: 10, height: 10, fill: "$accent", blur: -1 },
          { type: "shape", id: "headline", shape: "rect", x: 0, y: 0, width: 10, height: 10, fill: "#fff", gradient: { angle: 0, stops: [] } },
          { type: "shape", id: "gone", shape: "rect", x: 2000, y: 0, width: 10, height: 10, fill: "#fff" },
          {
            type: "text", id: "tag", text: "{{tagline}}", x: 0, y: 0, width: 10, height: 10,
            font: "mono", size: 10, weight: 800, align: "center", color: "#fff", pill: { fill: "$nope", paddingX: -2 },
          },
          { type: "screenshot", id: "extra", slot: 2, x: 0, y: 0, width: 10, height: 10, fit: "cover", frameColor: "$accent" },
        ],
      }),
      [layout],
    );
    const text = errors.join("\n");
    expect(text).toMatch(/slides\[2\] › blob.fill: unknown theme token "\$accent"/);
    expect(text).toMatch(/blob: blur must be ≥ 0/);
    expect(text).toMatch(/slides\[2\] › headline: duplicate id/);
    expect(text).toMatch(/headline.gradient.stops: needs at least 2 stops/);
    expect(text).toMatch(/gone: is completely outside the canvas/);
    expect(text).toMatch(/tag: placeholder \{\{tagline\}\} has no matching variable/);
    expect(text).toMatch(/tag: font must be display, sans, serif/);
    expect(text).toMatch(/tag.pill.fill: unknown theme token "\$nope"/);
    expect(text).toMatch(/tag: pill.paddingX must be ≥ 0/);
    expect(text).toMatch(/extra.frameColor: unknown theme token/);
    expect(text).toMatch(/slots must be 0, 1, 2… without gaps \(got 0, 2\)/);
  });

  it("measures panorama bounds across the whole set", () => {
    const panorama = (x: number) => [{ type: "shape", id: "p", shape: "circle", x, y: 0, width: 100, height: 100, fill: "#fff" }];
    expect(validateTemplate(withChanges({ panorama: panorama(4000) }), [layout])).toEqual([]);
    expect(validateTemplate(withChanges({ panorama: panorama(4400) }), [layout]).join("\n")).toMatch(/panorama › p: is completely outside/);
  });

  it("rejects malformed elements before merging", () => {
    expect(validateTemplate(withSlide(0, { elements: [null, { id: "x" }] }), [layout])).toEqual([
      "my-template › slides[0] › elements[0]: needs a string id and a type (text, screenshot, shape, image, rating, laurels, stat, review, imageSlot)",
      "my-template › slides[0] › elements[1]: needs a string id and a type (text, screenshot, shape, image, rating, laurels, stat, review, imageSlot)",
    ]);
  });
});

describe("validateLayout", () => {
  it("accepts a valid layout", () => {
    expect(validateLayout(layout)).toEqual([]);
  });

  it("reports structural problems without crashing", () => {
    const errors = validateLayout({ id: "x", canvas: { width: 10.5, height: 0 }, variables: [null], elements: [null, 3] });
    expect(errors.join("\n")).toMatch(/canvas: must be/);
    expect(errors.join("\n")).toMatch(/variables\[0\]: must be an object/);
    expect(errors.join("\n")).toMatch(/elements\[1\]: must be an object/);
  });

  it("flags tokens that are not theme keys and duplicate variables", () => {
    const errors = validateLayout({
      ...layout,
      variables: [...layout.variables, { key: "headline", label: "Again", default: "" }],
      elements: [{ ...layout.elements[0], color: "$brand" }],
    });
    expect(errors.join("\n")).toMatch(/duplicate key "headline"/);
    expect(errors.join("\n")).toMatch(/unknown theme token "\$brand"/);
  });
});

describe("validateTemplate: blocks, emphasis and layout choices", () => {
  const proofLayout: Layout = {
    id: "proof",
    canvas: { width: 1080, height: 1920 },
    variables: [{ key: "score", label: "Score", default: "4.9" }],
    elements: [
      { type: "rating", id: "rating", x: 90, y: 100, width: 900, height: 80, score: "{{score}}", label: "{{count}}", color: "$foreground", starColor: "#FFC53D" },
      { type: "screenshot", id: "shot", slot: 0, x: 200, y: 400, width: 680, height: 1600, fit: "cover" },
    ],
  };

  it("checks block placeholders and colors", () => {
    const errors = validateLayout(proofLayout).join("\n");
    expect(errors).toMatch(/rating: placeholder \{\{count\}\} has no matching variable/);
  });

  it("validates block fields", () => {
    const bad = {
      ...proofLayout,
      variables: [...proofLayout.variables, { key: "count", label: "Count", default: "" }],
      elements: [
        { type: "review", id: "review", x: 0, y: 0, width: 500, height: 300, quote: "Great", author: 7, color: "$foreground", cardColor: "$nope", starColor: "#fff" },
        { type: "stat", id: "stat", x: 0, y: 0, width: 500, height: 300, value: "10M+", label: "users", color: "#fff", align: "middle" },
      ],
    };
    const errors = validateLayout(bad).join("\n");
    expect(errors).toMatch(/review: author must be a string/);
    expect(errors).toMatch(/review.cardColor: unknown theme token "\$nope"/);
    expect(errors).toMatch(/stat: align must be left, center or right/);
  });

  it("checks emphasis styling on text", () => {
    const errors = validateTemplate(withChanges({ overrides: { headline: { emphasis: { weight: 1200, font: "mono" }, marker: "$nope" } } }), [layout]).join("\n");
    expect(errors).toMatch(/headline: emphasis.weight must be 100–900/);
    expect(errors).toMatch(/headline: emphasis.font must be display, sans, serif/);
    expect(errors).toMatch(/headline.marker: unknown theme token "\$nope"/);
  });

  it("checks layoutChoices and validates each alternate layout", () => {
    expect(validateTemplate(withChanges({ layoutChoices: ["phone", "nope"] }), [layout]).join("\n")).toMatch(/layoutChoices: unknown layout "nope"/);

    const fixed = { ...proofLayout, variables: [...proofLayout.variables, { key: "count", label: "Count", default: "" }] };
    // A template override that is fine on its own layout but breaks the alternate.
    const errors = validateTemplate(withChanges({ overrides: { rating: { color: "$accent" } } }), [layout, fixed]).join("\n");
    expect(errors).toMatch(/slides\[0\] › as proof › rating.color: unknown theme token "\$accent"/);
  });
});

describe("validateTemplate: generated backgrounds", () => {
  it.each([
    ["mesh with one color", { type: "mesh", colors: ["#000"] }, /colors: needs at least 2 colors/],
    ["mesh with bad token", { type: "mesh", colors: ["#000", "$nope"] }, /colors\[1\]: unknown theme token/],
    ["pattern kind", { type: "pattern", color: "#fff", ink: "#000", pattern: "waves" }, /pattern: must be grid, dots or lines/],
    ["pattern opacity", { type: "pattern", color: "#fff", ink: "#000", pattern: "grid", opacity: 2 }, /opacity: must be 0–1/],
  ])("reports %s", (_, background, message) => {
    expect(validateTemplate(withChanges({ background }), [layout]).join("\n")).toMatch(message);
  });

  it("accepts valid mesh and pattern backgrounds", () => {
    expect(validateTemplate(withChanges({ background: { type: "mesh", colors: ["$background", "$foreground"], seed: 3 } }), [layout])).toEqual([]);
    expect(validateTemplate(withChanges({ background: { type: "pattern", color: "$background", ink: "$foreground", pattern: "grid" } }), [layout])).toEqual([]);
  });
});

describe("validateLayout: image slots", () => {
  it("checks key, fit and monogram", () => {
    const errors = validateLayout({
      ...layout,
      elements: [
        ...layout.elements,
        { type: "imageSlot", id: "badge-logo", key: "banner", x: 0, y: 0, width: 100, height: 100, fit: "stretch", monogram: { text: "A", fill: "$nope", color: "#fff" } },
      ],
    }).join("\n");
    expect(errors).toMatch(/badge-logo: key must be appIcon, logo, mascot/);
    expect(errors).toMatch(/badge-logo: fit must be contain or cover/);
    expect(errors).toMatch(/badge-logo.monogram.fill: unknown theme token "\$nope"/);
  });
});
