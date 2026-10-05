import { describe, expect, it } from "vitest";
import type { Screenshot } from "@/types/project";
import { templates } from "@/templates/registry";
import { canRedo, canUndo, HISTORY_LIMIT, historyReducer, initialHistory, referencedImages, type HistoryAction, type HistoryState } from "./history";

const shot = (id: string): Screenshot => ({ id, name: `${id}.png`, url: `blob:${id}`, width: 1080, height: 2340 });
const samples = ["s1", "s2", "s3", "s4"].map(shot);
const [first, second] = templates;

function run(...actions: HistoryAction[]): HistoryState {
  return actions.reduce(historyReducer, historyReducer(initialHistory(first.id), { type: "samplesReady", samples }));
}

const headline = (state: HistoryState) => state.present.project.variables.headline;
const type = (value: string, at: number): HistoryAction => ({ type: "variable", key: "headline", value, perSlide: false, at });

describe("historyReducer", () => {
  it("starts with nothing to undo; selection and samples are not edits", () => {
    const s = run({ type: "slide", index: 2 });
    expect(canUndo(s)).toBe(false);
    expect(s.present.slide).toBe(2);
  });

  it("undoes and redoes an edit", () => {
    const edited = run({ type: "template", id: second.id });
    const undone = historyReducer(edited, { type: "undo" });
    expect(undone.present.project.templateId).toBe(first.id);
    expect(canRedo(undone)).toBe(true);
    expect(historyReducer(undone, { type: "redo" }).present.project.templateId).toBe(second.id);
  });

  it("merges a burst of typing in one field into one step", () => {
    const s = run(type("H", 0), type("He", 200), type("Hey", 400));
    expect(s.past).toHaveLength(1);
    expect(headline(historyReducer(s, { type: "undo" }))).toBeUndefined();
  });

  it("starts a new step after a pause or a different field", () => {
    const paused = run(type("Hey", 0), type("Hey you", 5000));
    expect(paused.past).toHaveLength(2);
    expect(headline(historyReducer(paused, { type: "undo" }))).toBe("Hey");

    const other = run(type("Hey", 0), { type: "variable", key: "subtitle", value: "x", perSlide: false, at: 100 });
    expect(other.past).toHaveLength(2);
  });

  it("keeps per-slide text steps apart per slide", () => {
    const edit = (value: string, at: number): HistoryAction => ({ type: "variable", key: "headline", value, perSlide: true, at });
    const s = run(edit("One", 0), { type: "slide", index: 1 }, edit("Two", 100));
    expect(s.past).toHaveLength(2);
  });

  it("a new edit after undo drops the redo branch", () => {
    const s = run({ type: "template", id: second.id }, { type: "undo" }, { type: "deviceFrame", on: false });
    expect(canRedo(s)).toBe(false);
  });

  it("restores the selected slide with the step", () => {
    const s = run({ type: "slide", index: 2 }, { type: "deviceFrame", on: false }, { type: "slide", index: 0 }, { type: "undo" });
    expect(s.present.slide).toBe(2);
  });

  it("undoing the first upload brings the samples back", () => {
    const s = run({ type: "addScreenshots", screenshots: [shot("a")] }, { type: "undo" });
    expect(s.present.usingSamples).toBe(true);
    expect(s.present.project.screenshots.map((x) => x.id)).toEqual(["s1", "s2", "s3", "s4"]);
  });

  it("caps the number of steps", () => {
    const actions = Array.from({ length: HISTORY_LIMIT + 20 }, (_, i): HistoryAction => ({ type: "deviceFrame", on: i % 2 === 0 }));
    expect(run(...actions).past).toHaveLength(HISTORY_LIMIT);
  });

  it("start over is undoable and keeps the template", () => {
    const s = run({ type: "template", id: second.id }, type("Mine", 0), { type: "addScreenshots", screenshots: [shot("a")] }, { type: "reset" });
    expect(s.present.project.templateId).toBe(second.id);
    expect(s.present.usingSamples).toBe(true);
    expect(headline(s)).toBeUndefined();
    const back = historyReducer(s, { type: "undo" });
    expect(headline(back)).toBe("Mine");
    expect(back.present.project.screenshots.map((x) => x.id)).toEqual(["a"]);
  });

  it("restore loads a session without history; a URL template wins", () => {
    const session = { slide: 1, usingSamples: false, project: { ...initialHistory(first.id).present.project, screenshots: [shot("a"), shot("b")], theme: { primary: "#FF0000" } } };
    const s = run({ type: "deviceFrame", on: false }, { type: "restore", session });
    expect(canUndo(s)).toBe(false);
    expect(s.present.slide).toBe(1);
    expect(s.present.project.screenshots.map((x) => x.id)).toEqual(["a", "b"]);

    const picked = run({ type: "restore", session, templateId: second.id });
    expect(picked.present.project.templateId).toBe(second.id);
    // Colors belong to the saved template's palette.
    expect(picked.present.project.theme).toEqual({});
    expect(picked.present.project.screenshots).toHaveLength(2);
  });

  it("references images from every step so undo can bring them back", () => {
    const s = run({ type: "addScreenshots", screenshots: [shot("a"), shot("b")] }, { type: "removeScreenshot", id: "a" });
    expect([...referencedImages(s).keys()]).toContain("blob:a");
    const ended = run({ type: "addScreenshots", screenshots: [shot("a")] }, { type: "replaceScreenshot", id: "a", screenshot: shot("c") });
    expect([...referencedImages(ended).keys()]).toEqual(expect.arrayContaining(["blob:a", "blob:c"]));
  });
});
