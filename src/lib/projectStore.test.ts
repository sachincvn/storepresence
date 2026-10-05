import { describe, expect, it } from "vitest";
import type { Project, Screenshot } from "@/types/project";
import { fromStored, sessionImages, toStored } from "./projectStore";

const shot = (id: string): Screenshot => ({ id, name: `${id}.png`, url: `blob:old-${id}`, width: 1080, height: 2340 });

const project: Project = {
  templateId: "aurora",
  screenshots: [shot("a"), shot("b")],
  variables: { appName: "Taskly" },
  slideVariables: { a: { headline: "Hi" } },
  theme: { primary: "#3D5AFE" },
  deviceFrame: true,
  images: { appIcon: shot("icon") },
  slideLayouts: { b: "duo" },
};

describe("projectStore serialization", () => {
  it("stores references without URLs and revives them with new ones", () => {
    const stored = toStored({ project, slide: 1, usingSamples: false }, 123);
    expect(JSON.stringify(stored)).not.toContain("blob:");

    const session = fromStored(stored, (id) => `blob:new-${id}`)!;
    expect(session.slide).toBe(1);
    expect(session.project.screenshots.map((s) => s.url)).toEqual(["blob:new-a", "blob:new-b"]);
    expect(session.project.images?.appIcon?.url).toBe("blob:new-icon");
    expect(session.project.slideVariables).toEqual(project.slideVariables);
    expect(session.project.slideLayouts).toEqual(project.slideLayouts);
  });

  it("never stores sample screenshots", () => {
    const session = { project: { ...project, screenshots: [{ ...shot("sample-x"), url: "data:image/png;base64,AA" }] }, slide: 0, usingSamples: true };
    expect(toStored(session, 0).project.screenshots).toEqual([]);
    expect(sessionImages(session).map((s) => s.id)).toEqual(["icon"]);
  });

  it("drops images that went missing and falls back to samples when none are left", () => {
    const stored = toStored({ project, slide: 0, usingSamples: false }, 0);
    const partial = fromStored(stored, (id) => (id === "a" ? "blob:a" : undefined))!;
    expect(partial.project.screenshots.map((s) => s.id)).toEqual(["a"]);
    expect(partial.project.images).toEqual({});

    const none = fromStored(stored, () => undefined)!;
    expect(none.usingSamples).toBe(true);
  });

  it("ignores saves in an unknown format", () => {
    expect(fromStored({ ...toStored({ project, slide: 0, usingSamples: false }, 0), format: 99 }, () => "blob:x")).toBeNull();
  });
});
