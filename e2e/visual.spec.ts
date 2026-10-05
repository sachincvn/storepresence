import { readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

/*
 * Golden images: every template's full set, rendered in the editor with the
 * built-in sample screenshots, compared to stored PNGs. Catches renderer or
 * template changes that silently alter output.
 *
 * Baselines are per platform (fonts rasterize differently). After an intended
 * visual change, review the diff and run: npx playwright test e2e/visual.spec.ts --update-snapshots
 */

const templateIds = readdirSync(path.join(__dirname, "..", "src", "templates"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "layouts")
  .map((d) => d.name)
  .sort();

for (const id of templateIds) {
  test(`${id} renders its full set unchanged`, async ({ page }) => {
    await page.goto(`/editor?template=${id}`);
    await page.getByRole("button", { name: "Full set" }).click();
    const canvases = page.getByRole("list", { name: "Full set" }).locator("canvas");
    await expect(canvases).toHaveCount(4);

    // Wait until every canvas is painted and two reads in a row match (fonts and images loaded).
    const read = () => canvases.evaluateAll((list) => list.map((c) => (c as HTMLCanvasElement).toDataURL("image/png")));
    let frames = await read();
    for (let i = 0; i < 25; i++) {
      await page.waitForTimeout(400);
      const next = await read();
      const stable = next.every((f, j) => f === frames[j]);
      frames = next;
      if (stable && i > 1) break;
    }

    for (const [i, frame] of frames.entries()) {
      expect(Buffer.from(frame.split(",")[1], "base64")).toMatchSnapshot(`${id}-${i + 1}.png`, { maxDiffPixelRatio: 0.002 });
    }
  });
}
