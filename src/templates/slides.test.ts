import { describe, expect, it } from "vitest";
import type { Layout, ScreenshotElement, Template } from "@/types/template";
import type { Project, Screenshot } from "@/types/project";
import { editorReducer, initialEditorState, TEXT_SLIDE_HEADLINE, type EditorAction, type EditorState } from "@/components/editor/editorState";
import { templates } from "./registry";
import { designFor, getSlides, resolveSlide, resolveTemplate, slotScreenshots, textLayoutFor } from "./resolve";

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

  it("arranged slides win and can show any screenshot or none", () => {
    const p = project(["a", "b"], { slides: [{ key: "k1", shot: "b", design: 1 }, { key: "k2", shot: null, design: 0 }, { key: "k3", shot: "gone", design: 6 }] });
    const plans = getSlides(framed, p);
    expect(plans.map((s) => [s.key, s.shot?.id ?? null, s.design])).toEqual([["k1", "b", 1], ["k2", null, 0], ["k3", null, 2]]);
  });
});

describe("slide list actions", () => {
  const studio = templates.find((t) => t.id === "studio-blue")!;
  const start = (): EditorState => {
    const s = initialEditorState(studio.id);
    return editorReducer(s, { type: "addScreenshots", screenshots: ["a", "b", "c"].map(shot) });
  };
  const run = (...actions: EditorAction[]) => actions.reduce(editorReducer, start());
  const order = (s: EditorState) => getSlides(studio, s.project).map((p) => p.key);

  it("adds a text slide after the selected one, on a layout without screenshots", () => {
    const s = run({ type: "addTextSlide", key: "t1" });
    expect(order(s)).toEqual(["a", "t1", "b", "c"]);
    expect(s.slide).toBe(1);
    expect(designFor(studio, 1, s.project).slots).toBe(0);
    expect(s.project.slideVariables.t1.headline).toBe(TEXT_SLIDE_HEADLINE);
    expect(textLayoutFor(studio, 0)).toBe("statement");
  });

  it("duplicates a slide with its text, layout and callout choices", () => {
    const s = run(
      { type: "variable", key: "headline", value: "Mine", perSlide: true },
      { type: "slideLayout", layout: "zoom" },
      { type: "duplicateSlide", key: "copy" },
    );
    expect(order(s)).toEqual(["a", "copy", "b", "c"]);
    expect(s.project.slideVariables.copy).toEqual({ headline: "Mine" });
    expect(s.project.slideLayouts?.copy).toBe("zoom");
    expect(getSlides(studio, s.project)[1].shot?.id).toBe("a");
  });

  it("moves and deletes slides, keeping at least one", () => {
    const moved = run({ type: "moveSlide", offset: 1 });
    expect(order(moved)).toEqual(["b", "a", "c"]);
    expect(moved.slide).toBe(1);
    const removed = editorReducer(moved, { type: "removeSlide" });
    expect(order(removed)).toEqual(["b", "c"]);
    // The screenshot stays uploaded.
    expect(removed.project.screenshots).toHaveLength(3);
    const single = [removed, removed].reduce((s) => editorReducer(s, { type: "removeSlide" }));
    expect(order(editorReducer(single, { type: "removeSlide" }))).toHaveLength(1);
  });

  it("picks which screenshot a slide shows", () => {
    const s = run({ type: "slideShot", shotId: "c" });
    expect(getSlides(studio, s.project)[0].shot?.id).toBe("c");
  });

  it("new uploads join before closing text slides; removed ones take their slides", () => {
    const withText = run({ type: "slide", index: 2 }, { type: "addTextSlide", key: "outro" });
    expect(order(withText)).toEqual(["a", "b", "c", "outro"]);
    const more = editorReducer(withText, { type: "addScreenshots", screenshots: [shot("d")] });
    expect(order(more)).toEqual(["a", "b", "c", "d", "outro"]);
    expect(more.slide).toBe(3);
    const fewer = editorReducer(more, { type: "removeScreenshot", id: "b" });
    expect(order(fewer)).toEqual(["a", "c", "d", "outro"]);
  });

  it("text slides stay text-only after a template switch", () => {
    const s = run({ type: "addTextSlide", key: "t1" }, { type: "template", id: "midnight" });
    const midnight = templates.find((t) => t.id === "midnight")!;
    expect(designFor(midnight, 1, s.project).slots).toBe(0);
    expect(getSlides(midnight, s.project)[0].shot?.id).toBe("a");
  });
});
