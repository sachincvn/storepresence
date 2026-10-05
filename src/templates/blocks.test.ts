import { describe, expect, it } from "vitest";
import type { Screenshot } from "@/types/project";
import type { ReviewElement, TextElement } from "@/types/template";
import { editorReducer, initialEditorState, type EditorState } from "@/components/editor/editorState";
import { blockElement, blockOptions, BLOCKS, placeBlock } from "./blocks";
import { templates } from "./registry";
import { designFor, getSlides, resolveSlide, variablesForSlide } from "./resolve";

const shot = (id: string): Screenshot => ({ id, name: `${id}.png`, url: `blob:${id}`, width: 720, height: 1560 });
const byId = (id: string) => templates.find((t) => t.id === id)!;

function start(templateId: string): EditorState {
  return editorReducer(initialEditorState(templateId), { type: "addScreenshots", screenshots: [shot("a"), shot("b")] });
}

describe("block catalog", () => {
  it("every block is available on a phone slide of every template", () => {
    for (const t of templates) {
      const options = blockOptions(t, designFor(t, 0, start(t.id).project));
      // Slide 1 may be text-only; pop-outs need a phone. Everything else must work.
      expect(options.filter((o) => o.kind !== "popout" && o.reason), t.id).toEqual([]);
    }
  });

  it("pop-outs need a screenshot on the slide", () => {
    const studio = byId("studio-blue");
    const textDesign = studio.alternates[0].statement;
    expect(blockOptions(studio, textDesign).find((o) => o.kind === "popout")?.reason).toBe("Needs a screenshot on the slide");
  });

  it("borrows the template's look for the block", () => {
    const midnight = byId("midnight");
    const review = blockElement(midnight, { id: "block-review-1", kind: "review", x: 100, y: 200 }) as ReviewElement;
    const example = midnight.alternates[0]["review-phone"].elements.find((el) => el.type === "review") as ReviewElement;
    expect(review).toMatchObject({ id: "block-review-1", x: 100, y: 200, cardColor: example.cardColor, quote: "{{reviewQuote}}" });
  });
});

describe("placeBlock", () => {
  it("avoids covering text", () => {
    const headline: TextElement = { type: "text", id: "headline", text: "Hi", x: 80, y: 40, width: 920, height: 300, font: "display", size: 90, weight: 800, align: "center", color: "#000" };
    const spot = placeBlock("rating", [headline], { width: 1080, height: 1920 });
    const def = BLOCKS.find((b) => b.kind === "rating")!;
    const overlapsHeadline = spot.y < headline.y + headline.height && spot.y + def.height > headline.y;
    expect(overlapsHeadline).toBe(false);
  });
});

describe("adding blocks in the editor", () => {
  const studio = byId("studio-blue");

  it("adds a styled block in a free spot, with text fields, on this slide only", () => {
    const s = editorReducer(start(studio.id), { type: "addBlock", kind: "review", id: "block-review-x" });
    const el = resolveSlide(studio, s.project, 0).elements.find((e) => e.id === "block-review-x");
    expect(el?.type).toBe("review");
    expect(variablesForSlide(studio, 0, s.project).map((v) => v.key)).toEqual(expect.arrayContaining(["reviewQuote", "reviewAuthor"]));
    expect(resolveSlide(studio, s.project, 1).elements.some((e) => e.id === "block-review-x")).toBe(false);
  });

  it("added pop-outs follow their phone and appear in the pop-out picker", () => {
    const s = editorReducer(start(studio.id), { type: "addBlock", kind: "popout", id: "block-popout-x" });
    expect(designFor(studio, 0, s.project).elements.some((e) => e.id === "block-popout-x" && e.type === "callout")).toBe(true);
  });

  it("blocks move with edits, follow the slide and can be removed", () => {
    let s = editorReducer(start(studio.id), { type: "addBlock", kind: "stat", id: "block-stat-x" });
    const before = resolveSlide(studio, s.project, 0).elements.find((e) => e.id === "block-stat-x")!;
    s = editorReducer(s, { type: "elementEdit", id: "block-stat-x", edit: { dy: 40 } });
    expect(resolveSlide(studio, s.project, 0).elements.find((e) => e.id === "block-stat-x")!.y).toBe(before.y + 40);

    s = editorReducer(s, { type: "duplicateSlide", key: "copy" });
    const copyIndex = getSlides(studio, s.project).findIndex((p) => p.key === "copy");
    expect(resolveSlide(studio, s.project, copyIndex).elements.find((e) => e.id === "block-stat-x")!.y).toBe(before.y + 40);

    s = editorReducer({ ...s, slide: 0 }, { type: "removeBlock", id: "block-stat-x" });
    expect(resolveSlide(studio, s.project, 0).elements.some((e) => e.id === "block-stat-x")).toBe(false);
  });
});
