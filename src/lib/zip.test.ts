import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildZip, zipName } from "./zip";

describe("buildZip", () => {
  it("contains every file, in order, with identical bytes", async () => {
    const files = [1, 2, 3, 4, 5].map((n) => ({
      name: `${String(n).padStart(2, "0")}.png`,
      blob: new Blob([new Uint8Array([137, 80, 78, 71, n])], { type: "image/png" }),
    }));
    const zip = await JSZip.loadAsync(await (await buildZip(files)).arrayBuffer());

    expect(Object.keys(zip.files)).toEqual(["01.png", "02.png", "03.png", "04.png", "05.png"]);
    expect([...(await zip.file("05.png")!.async("uint8array"))]).toEqual([137, 80, 78, 71, 5]);
  });
});

describe("zipName", () => {
  it.each([
    ["Taskly", "taskly-screenshots.zip"],
    ["Taskly Pro 2", "taskly-pro-2-screenshots.zip"],
    ["  Café & Co!  ", "cafe-co-screenshots.zip"],
    ["", "my-app-screenshots.zip"],
    ["日本", "my-app-screenshots.zip"],
  ])("%j → %s", (input, expected) => {
    expect(zipName(input)).toBe(expected);
  });
});
