import { describe, expect, it } from "vitest";
import type { Screenshot } from "@/types/project";
import { templates } from "@/templates/registry";
import { editorReducer, initialEditorState, type EditorAction, type EditorState } from "./editorState";

const shot = (id: string): Screenshot => ({ id, name: `${id}.png`, url: `blob:${id}`, width: 1080, height: 2340 });
const samples = ["s1", "s2", "s3", "s4"].map(shot);

function run(...actions: EditorAction[]): EditorState {
  return actions.reduce(editorReducer, initialEditorState(templates[0].id));
}

const ids = (s: EditorState) => s.project.screenshots.map((x) => x.id);

describe("editorReducer screenshots", () => {
  it("shows samples until the first upload replaces them", () => {
    const ready = run({ type: "samplesReady", samples });
    expect(ready.usingSamples).toBe(true);
    expect(ids(ready)).toEqual(["s1", "s2", "s3", "s4"]);

    const uploaded = editorReducer(ready, { type: "addScreenshots", screenshots: [shot("a"), shot("b")] });
    expect(uploaded.usingSamples).toBe(false);
    expect(ids(uploaded)).toEqual(["a", "b"]);
  });

  it("moves text typed on sample slides to the uploads", () => {
    const s = run(
      { type: "samplesReady", samples },
      { type: "slide", index: 1 },
      { type: "variable", key: "headline", value: "Typed early", perSlide: true },
      { type: "addScreenshots", screenshots: [shot("a"), shot("b")] },
    );
    expect(s.project.slideVariables.b).toEqual({ headline: "Typed early" });
  });

  it("appends later uploads and selects the first new slide", () => {
    const s = run(
      { type: "samplesReady", samples },
      { type: "addScreenshots", screenshots: [shot("a")] },
      { type: "addScreenshots", screenshots: [shot("b"), shot("c")] },
    );
    expect(ids(s)).toEqual(["a", "b", "c"]);
    expect(s.slide).toBe(1);
  });

  it("does not let samples be overwritten when uploads arrive first", () => {
    const s = run({ type: "addScreenshots", screenshots: [shot("a")] }, { type: "samplesReady", samples });
    expect(ids(s)).toEqual(["a"]);
    expect(s.samples).toHaveLength(4);
  });

  it("moves screenshots and keeps the selection on the moved one", () => {
    const base = run({ type: "samplesReady", samples }, { type: "addScreenshots", screenshots: ["a", "b", "c"].map(shot) });
    const moved = editorReducer({ ...base, slide: 0 }, { type: "moveScreenshot", id: "a", offset: 1 });
    expect(ids(moved)).toEqual(["b", "a", "c"]);
    expect(moved.slide).toBe(1);
    expect(editorReducer(moved, { type: "moveScreenshot", id: "b", offset: -1 })).toBe(moved); // already first
  });

  it("removes screenshots and falls back to samples when none are left", () => {
    const base = run({ type: "samplesReady", samples }, { type: "addScreenshots", screenshots: ["a", "b", "c"].map(shot) });
    const selectedLast = { ...base, slide: 2 };
    const removed = editorReducer(selectedLast, { type: "removeScreenshot", id: "a" });
    expect(ids(removed)).toEqual(["b", "c"]);
    expect(removed.slide).toBe(1); // still on "c"

    const empty = [
      { type: "removeScreenshot", id: "b" },
      { type: "removeScreenshot", id: "c" },
    ].reduce<EditorState>((s, a) => editorReducer(s, a as EditorAction), removed);
    expect(empty.usingSamples).toBe(true);
    expect(ids(empty)).toEqual(["s1", "s2", "s3", "s4"]);
  });

  it("replaces a screenshot in place, keeping its id and text", () => {
    const s = run(
      { type: "samplesReady", samples },
      { type: "addScreenshots", screenshots: ["a", "b"].map(shot) },
      { type: "slide", index: 1 },
      { type: "variable", key: "headline", value: "Mine", perSlide: true },
      { type: "replaceScreenshot", id: "b", screenshot: { ...shot("new"), width: 1440 } },
    );
    expect(s.project.screenshots[1]).toMatchObject({ id: "b", url: "blob:new", width: 1440 });
    expect(s.project.slideVariables.b).toEqual({ headline: "Mine" });
  });

  it("ignores remove and replace on samples", () => {
    const s = run({ type: "samplesReady", samples });
    expect(editorReducer(s, { type: "removeScreenshot", id: "s1" })).toBe(s);
    expect(editorReducer(s, { type: "replaceScreenshot", id: "s1", screenshot: shot("x") })).toBe(s);
  });
});

describe("editorReducer backdrop and device", () => {
  it("sets, shuffles and clears a generated backdrop", () => {
    let s = run({ type: "backdrop", kind: "mesh" });
    expect(s.project.backdrop).toEqual({ kind: "mesh", seed: 1 });
    s = editorReducer(s, { type: "backdrop", shuffle: true });
    expect(s.project.backdrop).toEqual({ kind: "mesh", seed: 2 });
    s = editorReducer(s, { type: "backdrop", kind: "dots" });
    expect(s.project.backdrop).toEqual({ kind: "dots", seed: 2 });
    s = editorReducer(s, { type: "backdrop", kind: null });
    expect(s.project.backdrop).toBeUndefined();
  });

  it("sets and resets device model and color independently", () => {
    let s = run({ type: "device", model: "phone-island" }, { type: "device", color: "#FFFFFF" });
    expect(s.project).toMatchObject({ deviceModel: "phone-island", deviceColor: "#FFFFFF" });
    s = editorReducer(s, { type: "device", color: null });
    expect(s.project).toMatchObject({ deviceModel: "phone-island", deviceColor: undefined });
  });
});
