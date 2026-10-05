import { describe, expect, it } from "vitest";
import type { Project, Screenshot } from "@/types/project";
import type { CalloutElement, SlideSpec, TemplateElement } from "@/types/template";
import { exportPlan } from "@/renderer/exportRenderer";
import { resolveFeatureGraphic } from "./featureGraphic";
import { templates } from "./registry";
import { resolveSlide } from "./resolve";
import { adaptSpec, chosenSizes, getSize, spreadShift } from "./sizes";

const shot = (id: string): Screenshot => ({ id, name: `${id}.png`, url: `blob:${id}`, width: 720, height: 1560 });
const project = (templateId: string, changes: Partial<Project> = {}): Project => ({
  templateId, screenshots: ["a", "b", "c", "d"].map(shot), variables: {}, slideVariables: {}, theme: {}, deviceFrame: true, ...changes,
});
const find = (spec: SlideSpec, id: string) => spec.elements.find((el) => el.id === id) as TemplateElement;

describe("spreadShift", () => {
  it("shares spare space above, between and below elements", () => {
    expect(spreadShift(100, 100, 1000, 200)).toBeCloseTo(65);
    expect(spreadShift(700, 100, 1000, 200)).toBeCloseTo(125);
    // Flush with the bottom edge: stays flush.
    expect(spreadShift(900, 100, 1000, 200)).toBeCloseTo(200);
  });

  it("elements bleeding off an edge keep bleeding", () => {
    // Bottom bleed of 100: after a 200 grow it must still reach past the new bottom (1200).
    const shift = spreadShift(400, 700, 1000, 200);
    expect(400 + 700 + shift).toBeGreaterThanOrEqual(1200);
    // Top bleed stays above 0.
    expect(-50 + spreadShift(-50, 300, 1000, 200)).toBeLessThanOrEqual(0);
  });
});

describe("adaptSpec", () => {
  const studio = templates.find((t) => t.id === "studio-blue")!;
  const base = resolveSlide(studio, project("studio-blue"), 3);

  it("leaves the template size untouched", () => {
    expect(adaptSpec(base, { width: 1080, height: 1920 })).toEqual({ spec: base, scale: 1 });
  });

  it("taller sizes fit the width and draw at the exact pixel size", () => {
    const size = getSize("ios-69");
    const { spec, scale } = adaptSpec(base, size);
    expect(spec.canvas.width * scale).toBeCloseTo(size.width);
    expect(spec.canvas.height * scale).toBeCloseTo(size.height);
    expect(spec.canvas.width).toBe(1080);
    // The headline moves less than the phone: space spreads out, nothing is cut.
    const moved = (id: string) => find(spec, id).y - find(base, id).y;
    expect(moved("headline")).toBeLessThan(moved("shot"));
  });

  it("pop-outs move with their phone", () => {
    const { spec } = adaptSpec(base, getSize("ios-69"));
    const phoneMove = find(spec, "shot").y - find(base, "shot").y;
    const callout = find(spec, "callout") as CalloutElement;
    expect(callout.y - find(base, "callout").y).toBeCloseTo(phoneMove);
  });

  it("wider sizes fit the height and center the design", () => {
    const { spec, scale } = adaptSpec(base, getSize("ipad-13"));
    expect(spec.canvas.height).toBe(1920);
    expect(spec.canvas.width * scale).toBeCloseTo(2064);
    const shotEl = find(spec, "shot");
    expect(shotEl.x + shotEl.width / 2).toBeCloseTo(spec.canvas.width / 2, 0);
    expect(spec.setWidth).toBeCloseTo(spec.canvas.width * studio.designs.length);
  });
});

describe("feature graphic", () => {
  it("is a 1024 × 500 banner with the app name, first headline and a phone", () => {
    const midnight = templates.find((t) => t.id === "midnight")!;
    const spec = resolveFeatureGraphic(midnight, project("midnight", { variables: { appName: "Orbit" } }));
    expect(spec.canvas).toEqual({ width: 1024, height: 500 });
    expect(find(spec, "app-name")).toMatchObject({ text: "Orbit" });
    expect(find(spec, "headline")).toMatchObject({ text: "Plan your day in **seconds**", font: "serif" });
    expect(spec.screenshots[0]?.id).toBe("a");
  });
});

describe("export plan", () => {
  it("keeps flat names for the default phone size", () => {
    expect(exportPlan(2, ["play-phone"]).map((f) => f.name)).toEqual(["01.png", "02.png"]);
  });

  it("uses store folders and one banner when more sizes are picked", () => {
    expect(exportPlan(2, ["play-phone", "play-feature", "ios-69"]).map((f) => f.name)).toEqual([
      "google-play/phone/01.png",
      "google-play/phone/02.png",
      "google-play/feature-graphic.png",
      "app-store/iphone-6.9/01.png",
      "app-store/iphone-6.9/02.png",
    ]);
  });

  it("ignores unknown saved sizes", () => {
    expect(chosenSizes(["nope", "ios-65"])).toEqual(["ios-65"]);
    expect(chosenSizes(undefined)).toEqual(["play-phone"]);
  });
});
