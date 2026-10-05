import JSZip from "jszip";
import { expect, test } from "@playwright/test";
import { createFixtures, exportFrom, pngSize, yourScreenshots } from "./helpers";

const TEMPLATES = [
  ["aurora", "Aurora"],
  ["studio-blue", "Studio Blue"],
  ["mono-minimal", "Mono Minimal"],
  ["sunny-pop", "Sunny Pop"],
  ["calm-wellness", "Calm Wellness"],
  ["lilac-clay", "Lilac Clay"],
  ["midnight", "Midnight"],
  ["pro-productivity", "Pro Productivity"],
  ["health-stats", "Health Stats"],
  ["fresh-mint", "Fresh Mint"],
] as const;

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

    const zip = await JSZip.loadAsync((await exportFrom(page, /Download all 5 slides as ZIP/)).buffer);
    const names = Object.keys(zip.files);
    expect(names).toHaveLength(5);
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
