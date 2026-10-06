import { describe, expect, it } from "vitest";
import type { Project, Screenshot } from "@/types/project";
import type { ScreenshotElement } from "@/types/template";
import { templates } from "@/templates/registry";
import { resolveSlide } from "@/templates/resolve";
import { perspectivePoint } from "./perspective";

const box = { x: 200, y: 400, width: 600, height: 1300 };

describe("perspectivePoint", () => {
  it("keeps the device centered on its box", () => {
    for (const p of ["left", "right", "flat", "iso"] as const) {
      const [x, y] = perspectivePoint(box, p, 500, 1050);
      expect(Math.abs(x - 500), p).toBeLessThan(120);
      expect(Math.abs(y - 1050), p).toBeLessThan(120);
    }
  });

  it("turning left and right mirror each other", () => {
    const [lx] = perspectivePoint(box, "left", 200, 400);
    const [rx] = perspectivePoint(box, "right", 800, 400);
    expect(lx - 500).toBeCloseTo(-(rx - 500), 0);
  });
});

describe("device angle and panorama phones", () => {
  const shot = (id: string): Screenshot => ({ id, name: `${id}.png`, url: `blob:${id}`, width: 720, height: 1560 });
  const project = (templateId: string, changes: Partial<Project> = {}): Project => ({
    templateId, screenshots: ["a", "b", "c"].map(shot), variables: {}, slideVariables: {}, theme: {}, deviceFrame: true, ...changes,
  });

  it("the set-wide angle applies to device phones; straight removes a template angle", () => {
    const studio = templates.find((t) => t.id === "studio-blue")!;
    const phone = (p: Project) => resolveSlide(studio, p, 0).elements.find((el) => el.type === "screenshot") as ScreenshotElement;
    expect(phone(project("studio-blue")).perspective).toBeUndefined();
    expect(phone(project("studio-blue", { deviceAngle: "left" })).perspective).toBe("left");

    const panorama = templates.find((t) => t.id === "panorama")!;
    const angled = () => resolveSlide(panorama, project("panorama", { deviceAngle: "straight" }), 0).panorama.filter((el) => el.type === "screenshot");
    expect(angled().every((el) => (el as ScreenshotElement).perspective === undefined)).toBe(true);
  });

  it("panorama phones show screenshots by upload position, wrapping", () => {
    const panorama = templates.find((t) => t.id === "panorama")!;
    const spec = resolveSlide(panorama, project("panorama"), 1);
    const phones = spec.panorama.filter((el): el is ScreenshotElement => el.type === "screenshot");
    // Template slots 0,1,2,3,0 over 3 uploads: a, b, c, a, a.
    expect(phones.map((el) => spec.screenshots[el.slot]?.id)).toEqual(["a", "b", "c", "a", "a"]);
  });
});
