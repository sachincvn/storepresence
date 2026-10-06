import { describe, expect, it } from "vitest";
import type { Layout, ScreenshotElement, Template } from "@/types/template";
import type { Project, Screenshot } from "@/types/project";
import { getSlides, resolveSlide, resolveTemplate, slotScreenshots } from "./resolve";

const canvas = { width: 1080, height: 1920 };
const shotEl: ScreenshotElement = { type: "screenshot", id: "shot", slot: 0, x: 0, y: 0, width: 500, height: 1000, fit: "cover" };
const phone: Layout = {
  id: "phone", canvas, variables: [{ key: "headline", label: "Headline", default: "Hi", perSlide: true }],
  elements: [shotEl],
};
const words: Layout = {
  id: "words", canvas, variables: [{ key: "headline", label: "Headline", default: "Hi", perSlide: true }],
  elements: [{ type: "text", id: "headline", text: "{{headline}}", x: 0, y: 0, width: 1000, height: 400, font: "display", size: 90, weight: 800, align: "center", color: "#000" }],
};
const base = { name: "T", category: "Test", canvas, theme: { background: "#FFFFFF" }, background: { type: "solid" as const, color: "$background" } };
// intro (text), A, B, outro (text)
const framed = resolveTemplate({ ...base, id: "framed", slides: [{ layout: "words" }, { layout: "phone" }, { layout: "phone" }, { layout: "words" }] } as Template, [phone, words]);
const plain = resolveTemplate({ ...base, id: "plain", slides: [{ layout: "phone" }, { layout: "phone" }, { layout: "phone" }, { layout: "phone" }] } as Template, [phone, words]);

const shot = (id: string): Screenshot => ({ id, name: `${id}.png`, url: `blob:${id}`, width: 1080, height: 1920 });
const project = (ids: string[], changes: Partial<Project> = {}): Project => ({
  templateId: "x", screenshots: ids.map(shot), variables: {}, slideVariables: {}, theme: {}, deviceFrame: true, ...changes,
});
const keys = (p: Project, t = framed) => getSlides(t, p).map((s) => `${s.key}@${s.design}`);

describe("getSlides", () => {
  it("keeps one slide per screenshot when every design has a phone", () => {
    expect(keys(project(["a", "b", "c", "d", "e"]), plain)).toEqual(["a@0", "b@1", "c@2", "d@3", "e@0"]);
    expect(keys(project([]), plain)).toEqual(["slide-0@0", "slide-1@1", "slide-2@2", "slide-3@3"]);
  });

  it("text-only designs appear in place without using a screenshot", () => {
    expect(keys(project(["a", "b"]))).toEqual(["text-0@0", "a@1", "b@2", "text-3@3"]);
  });

  it("extra screenshots cycle the phone designs before the closing text slide", () => {
    expect(keys(project(["a", "b", "c", "d"]))).toEqual(["text-0@0", "a@1", "b@2", "c@1", "d@2", "text-3@3"]);
  });

  it("fewer screenshots skip the remaining phone designs", () => {
    expect(keys(project(["a"]))).toEqual(["text-0@0", "a@1", "text-3@3"]);
  });

  it("extra slots show the following screenshots of the slide's own one", () => {
    const duoLayout: Layout = { ...phone, id: "duo", elements: [shotEl, { ...shotEl, id: "back", slot: 1 }] };
    const duo = resolveTemplate({ ...base, id: "duo", slides: Array(4).fill({ layout: "duo" }) } as Template, [duoLayout]);
    expect(slotScreenshots(duo, project(["a", "b", "c"]), 2).map((s) => s?.id)).toEqual(["c", "a"]);
  });

  it("panorama offsets follow the slide's design", () => {
    expect(resolveSlide(framed, project(["a", "b", "c"]), 3).panoramaOffset).toBe(1080);
  });

});
