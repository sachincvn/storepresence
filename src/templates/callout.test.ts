import { describe, expect, it } from "vitest";
import type { CalloutElement, Layout, ScreenshotElement, Template } from "@/types/template";
import type { Project, Screenshot } from "@/types/project";
import { calloutGeometry, clampRegion, MIN_REGION, regionCenterY } from "@/renderer/calloutRenderer";
import { templates } from "./registry";
import { resolveSlide, resolveTemplate, slideCallouts } from "./resolve";
import { validateLayout, validateTemplate } from "./validate";

const shotEl: ScreenshotElement = { type: "screenshot", id: "shot", slot: 0, x: 200, y: 400, width: 680, height: 1400, fit: "cover", align: "top" };
const callout: CalloutElement = {
  type: "callout", id: "callout", slot: 0, region: { x: 0.1, y: 0.5, w: 0.8, h: 0.1 },
  x: 100, y: 900, width: 880, height: 400, padding: 20, fill: "$surface",
};

const layout: Layout = { id: "pop", canvas: { width: 1080, height: 1920 }, variables: [], elements: [shotEl, callout] };
const template: Template = {
  id: "pop-test", name: "Pop", category: "Test", canvas: { width: 1080, height: 1920 },
  theme: { background: "#000000", foreground: "#FFFFFF", surface: "#EEEEEE" },
  background: { type: "solid", color: "$background" },
  slides: [{ layout: "pop" }, { layout: "pop" }, { layout: "pop" }, { layout: "pop" }],
};
const resolved = resolveTemplate(template, [layout]);
const shot = (id: string): Screenshot => ({ id, name: `${id}.png`, url: `blob:${id}`, width: 1000, height: 2000 });
const project = (changes: Partial<Project> = {}): Project => ({
  templateId: "pop-test", screenshots: [shot("a"), shot("b")], variables: {}, slideVariables: {}, theme: {}, deviceFrame: true, ...changes,
});
const calloutOf = (p: Project, slide = 0) => resolveSlide(resolved, p, slide).elements.find((el) => el.type === "callout") as CalloutElement | undefined;

describe("callout geometry", () => {
  it("keeps the area's aspect ratio, fits and centers it in the box", () => {
    // Region is 800×200 image px (4:1); box minus padding is 840×360.
    const { crop, panel, source } = calloutGeometry(callout, { w: 1000, h: 2000 });
    expect(crop.w / crop.h).toBeCloseTo(4);
    expect(crop.w).toBeCloseTo(840);
    expect(crop.y + crop.h / 2).toBeCloseTo(callout.y + callout.height / 2);
    expect(panel.w).toBeCloseTo(crop.w + 40);
    expect(source).toEqual({ x: 100, y: 1000, w: 800, h: 200 });
  });

  it("tall areas are limited by the box height", () => {
    const { crop } = calloutGeometry({ ...callout, region: { x: 0, y: 0, w: 0.2, h: 0.6 } }, { w: 1000, h: 2000 });
    expect(crop.h).toBeCloseTo(360);
    expect(crop.x + crop.w / 2).toBeCloseTo(callout.x + callout.width / 2);
  });

  it("clamps areas into the image with a minimum size", () => {
    expect(clampRegion({ x: 0.95, y: -0.2, w: 0.5, h: 0 })).toEqual({ x: 0.5, y: 0, w: 0.5, h: MIN_REGION });
  });

  it("maps an area to its height on the phone", () => {
    // Cover, top-aligned: 1000×2000 into 680×1400 scales by 0.7, width 700 (cropped), height 1400.
    expect(regionCenterY(shotEl, { w: 1000, h: 2000 }, { x: 0, y: 0.5, w: 1, h: 0.1 })).toBeCloseTo(400 + 0.55 * 1400);
  });
});

describe("callout resolve", () => {
  it("resolves colors and uses the template region by default", () => {
    const el = calloutOf(project())!;
    expect(el.fill).toBe("#EEEEEE");
    expect(el.region).toEqual(callout.region);
  });

  it("follow moves the box over its area", () => {
    const followed = resolveTemplate({ ...template, overrides: { callout: { follow: "y" } } }, [layout]);
    const el = resolveSlide(followed, project(), 0).elements.find((e) => e.type === "callout") as CalloutElement;
    expect(el.y + el.height / 2).toBeCloseTo(400 + 0.55 * 1400);
  });

  it("user areas apply per slide and follow the screenshot", () => {
    const region = { x: 0, y: 0, w: 0.5, h: 0.2 };
    const p = project({ calloutRegions: { b: { callout: region } } });
    expect(calloutOf(p, 1)!.region).toEqual(region);
    expect(calloutOf(p, 0)!.region).toEqual(callout.region);
    // Reordered: the area stays with screenshot "b".
    const swapped = { ...p, screenshots: [shot("b"), shot("a")] };
    expect(calloutOf(swapped, 0)!.region).toEqual(region);
  });

  it("null hides the pop-out on that slide only", () => {
    const p = project({ calloutRegions: { a: { callout: null } } });
    expect(calloutOf(p, 0)).toBeUndefined();
    expect(calloutOf(p, 1)).toBeDefined();
  });

  it("slideCallouts lists a slide's pop-outs", () => {
    expect(slideCallouts(resolved, 0, project()).map((el) => el.id)).toEqual(["callout"]);
  });

  it("Studio Blue's pop-out slide has its callout", () => {
    const studio = templates.find((t) => t.id === "studio-blue")!;
    expect(studio.designs[3].elements.filter((el) => el.type === "callout").map((el) => el.id)).toEqual(["callout"]);
  });
});

describe("callout validation", () => {
  it("rejects bad regions, styles and slots without a screenshot", () => {
    const errors = validateLayout({
      ...layout,
      elements: [shotEl, { ...callout, slot: 1, region: { x: 0.5, y: 0, w: 0.8, h: 0.1 }, style: "neon", tailAt: 2 }],
    });
    expect(errors).toEqual([
      "layout pop › callout: region must lie inside 0–1 with positive w and h",
      "layout pop › callout: style must be card, glass or bubble",
      "layout pop › callout: tailAt must be 0–1",
      "layout pop › callout: slot 1 has no screenshot on this slide to enlarge",
    ]);
  });

  it("accepts the test template", () => {
    expect(validateTemplate(template, [layout])).toEqual([]);
  });
});
