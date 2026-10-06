import { describe, expect, it } from "vitest";
import { getTemplate, templateIssues, templates } from "./registry";

// Guards every template.json in the repo: a bad file fails `npm test`.
describe("template registry", () => {
  it("has no invalid layouts or templates", () => {
    expect(templateIssues.flatMap((i) => i.errors)).toEqual([]);
  });

  it("has unique ids and finds templates by id", () => {
    const ids = templates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(getTemplate(id)?.id).toBe(id);
    expect(getTemplate("does-not-exist")).toBeUndefined();
  });

  it("every slide of every template shows at least one screenshot", () => {
    for (const t of templates) {
      for (const [i, d] of t.designs.entries()) {
        // A phone in the panorama that crosses this slide counts too.
        const [start, end] = [i * t.canvas.width, (i + 1) * t.canvas.width];
        const panoramaPhones = t.panorama.filter((el) => el.type === "screenshot" && el.x < end && el.x + el.width > start).length;
        expect(d.slots + panoramaPhones, `${t.id} slide ${i + 1}`).toBeGreaterThan(0);
      }
    }
  });
});
