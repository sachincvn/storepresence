import { describe, expect, it } from "vitest";
import type { Screenshot } from "@/types/project";
import type { ScreenshotElement, TextElement } from "@/types/template";
import { editorReducer, initialEditorState } from "@/components/editor/editorState";
import { applyEdit, clampEdit, EDIT_LIMITS, hitTest, SAFE_MARGIN, snapMove } from "./edits";
import { templates } from "./registry";
import { resolveSlide } from "./resolve";

const canvas = { width: 1080, height: 1920 };
const text: TextElement = { type: "text", id: "headline", text: "Hi", x: 80, y: 140, width: 920, height: 300, font: "display", size: 90, weight: 800, align: "center", color: "#000" };
const phone: ScreenshotElement = { type: "screenshot", id: "shot", slot: 0, x: 195, y: 640, width: 690, height: 1495, fit: "cover" };

describe("clampEdit", () => {
  it("keeps text inside the safe margin", () => {
    const edit = clampEdit(text, { dx: -500, dy: -500 }, canvas);
    const moved = applyEdit(text, edit);
    expect(moved.x).toBeGreaterThanOrEqual(SAFE_MARGIN - 0.1);
    expect(moved.y).toBeGreaterThanOrEqual(SAFE_MARGIN - 0.1);
  });

  it("lets phones bleed but keeps their center on the slide", () => {
    const moved = applyEdit(phone, clampEdit(phone, { dx: 2000, dy: 2000 }, canvas));
    expect(moved.x + moved.width / 2).toBeLessThanOrEqual(1080);
    expect(moved.y + moved.height / 2).toBeLessThanOrEqual(1920);
  });

  it("limits scale and rotation, and drops no-op edits", () => {
    expect(clampEdit(text, { scale: 9, rotation: 99 }, canvas)).toEqual({ scale: EDIT_LIMITS.maxScale, rotation: EDIT_LIMITS.maxRotation });
    expect(clampEdit(text, { dx: 0, scale: 1 }, canvas)).toEqual({});
    expect(clampEdit(text, { hidden: true }, canvas)).toEqual({ hidden: true });
  });
});

describe("snapMove", () => {
  it("snaps the center to the middle and shows a guide", () => {
    const small: TextElement = { ...text, x: 300, width: 400 };
    const { dx, guides } = snapMove(small, 35, 0, canvas);
    expect(small.x + small.width / 2 + dx).toBe(540);
    expect(guides).toContainEqual({ axis: "x", at: 540 });
  });

  it("leaves far moves alone", () => {
    expect(snapMove({ ...text, x: 300, width: 400 }, 200, 0, canvas)).toMatchObject({ dx: 200, guides: [] });
  });
});

describe("hitTest", () => {
  it("finds the topmost element, honoring rotation and scale", () => {
    expect(hitTest([phone, text], 540, 200)?.id).toBe("headline");
    expect(hitTest([phone, text], 540, 1200)?.id).toBe("shot");
    expect(hitTest([phone, text], 20, 20)).toBeNull();
    const big = { ...text, scale: 1.4 };
    expect(hitTest([big], 540, 470)?.id).toBe("headline");
  });
});

describe("element edits in the editor", () => {
  const shot = (id: string): Screenshot => ({ id, name: `${id}.png`, url: `blob:${id}`, width: 720, height: 1560 });
  const studio = templates.find((t) => t.id === "studio-blue")!;
  const start = editorReducer(initialEditorState(studio.id), { type: "addScreenshots", screenshots: [shot("a"), shot("b")] });

  it("moves, scales and hides elements on one slide only", () => {
    const before = resolveSlide(studio, start.project, 0).elements.find((el) => el.id === "headline")!;
    const s = editorReducer(start, { type: "elementEdit", id: "headline", edit: { dy: 60, scale: 1.2 } });
    const after = resolveSlide(studio, s.project, 0).elements.find((el) => el.id === "headline")!;
    expect(after.y - before.y).toBe(60);
    expect(after.scale).toBeCloseTo(1.2);
    // Slide 2 is untouched.
    expect(resolveSlide(studio, s.project, 1).elements.find((el) => el.id === "headline")?.scale).toBeUndefined();

    const hidden = editorReducer(s, { type: "elementEdit", id: "rating", edit: { hidden: true } });
    expect(resolveSlide(studio, hidden.project, 0).elements.some((el) => el.id === "rating")).toBe(false);

    const reset = editorReducer(hidden, { type: "resetElementEdits" });
    expect(resolveSlide(studio, reset.project, 0).elements.find((el) => el.id === "headline")).toEqual(before);
  });

  it("clamps edits from any caller", () => {
    const s = editorReducer(start, { type: "elementEdit", id: "headline", edit: { dx: -5000 } });
    const el = resolveSlide(studio, s.project, 0).elements.find((e) => e.id === "headline")!;
    expect(el.x).toBeGreaterThanOrEqual(SAFE_MARGIN - 0.1);
  });
});
