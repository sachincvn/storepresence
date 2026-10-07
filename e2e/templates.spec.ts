import JSZip from "jszip";
import { expect, test } from "@playwright/test";
import { createFixtures, exportFrom, pngSize, yourScreenshots } from "./helpers";

const TEMPLATES = [
  ["aurora", "Aurora"],
  ["studio-blue", "Studio Blue"],
  ["mono-minimal", "Mono Minimal"],
  ["sunny-pop", "Sunny Pop"],
  ["calm-wellness", "Calm Wellness"],
  ["lilac-clay", "Lilac Mist"],
  ["midnight", "Midnight"],
  ["pro-productivity", "Pro Productivity"],
  ["health-stats", "Health Stats"],
  ["fresh-mint", "Fresh Mint"],
  ["playful-learning", "Playful Learning"],
  ["cinematic", "Cinematic"],
  ["fintech-glass", "Fintech Glass"],
  ["social-pop", "Social Pop"],
  ["panorama", "Panorama"],
] as const;

/** Slides per set with 5 uploads: one per screenshot, except fixed panorama sets. */
const SLIDES_WITH_FIVE: Record<string, number> = { panorama: 4 };

let images: string[];

test.beforeAll(async ({ browser }, info) => {
  ({ images } = await createFixtures(browser, info.outputPath("fixtures")));
});

for (const [id, name] of TEMPLATES) {
  test(`${name} exports a full set at exact size`, async ({ page }) => {
    await page.goto(`/editor?template=${id}`);
    await expect(page.getByRole("button", { name: new RegExp(`^${name}`) })).toHaveAttribute("aria-pressed", "true");

    await page.locator('input[type="file"][multiple]').setInputFiles(images);
    await expect(yourScreenshots(page)).toHaveCount(5);

    const count = SLIDES_WITH_FIVE[id] ?? 5;
    const zip = await JSZip.loadAsync((await exportFrom(page, new RegExp(`Download all ${count} slides as ZIP`))).buffer);
    const names = Object.keys(zip.files);
    expect(names).toHaveLength(count);
    for (const file of names) {
      const png = await zip.file(file)!.async("nodebuffer");
      expect(pngSize(png), `${id}/${file}`).toEqual({ width: 1080, height: 1920 });
    }
  });
}

test("Template Lab reports every template valid", async ({ page }) => {
  await page.goto("/dev/templates");
  await expect(page.getByRole("region", { name: "Validation" })).toContainText(`All ${TEMPLATES.length} templates`);
  await expect(page.locator("article")).toHaveCount(TEMPLATES.length);
});
