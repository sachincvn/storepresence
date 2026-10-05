import JSZip from "jszip";
import { expect, test } from "@playwright/test";
import { createFixtures, exportFrom, pngSize, yourScreenshots } from "./helpers";

let fixtures: Awaited<ReturnType<typeof createFixtures>>;

test.beforeAll(async ({ browser }, info) => {
  fixtures = await createFixtures(browser, info.outputPath("fixtures"));
});

test.beforeEach(async ({ page }) => {
  await page.goto("/editor?template=lilac-clay");
  await expect(page.getByText("Showing 4 sample screenshots")).toBeVisible();
});

test("upload handles every screenshot shape and rejects unsupported files", async ({ page }) => {
  await page.locator('input[type="file"][multiple]').setInputFiles([...fixtures.images, fixtures.unsupported]);

  await expect(yourScreenshots(page)).toHaveCount(5);
  // Next.js' route announcer is also an alert, so match by text.
  await expect(page.getByRole("alert").filter({ hasText: "anim.gif" })).toContainText("isn't supported. Use PNG, JPG or WEBP.");
  await expect(yourScreenshots(page).filter({ hasText: "portrait.png" })).toContainText("1080 × 2340");
  // Very tall capture is downscaled to a 3000px long side; small images are kept as-is.
  await expect(yourScreenshots(page).filter({ hasText: "tall-capture.png" })).toContainText("720 × 3000");
  await expect(yourScreenshots(page).filter({ hasText: "small.png" })).toContainText("200 × 400");
  await expect(page.getByRole("button", { name: "Download all 5 slides as ZIP" })).toBeVisible();
});

test("reorder, remove and replace keep the list consistent", async ({ page }) => {
  await page.locator('input[type="file"][multiple]').setInputFiles(fixtures.images.slice(0, 3));
  await expect(yourScreenshots(page)).toHaveCount(3);

  await page.getByRole("button", { name: "Move landscape.webp up" }).click();
  await expect(yourScreenshots(page).nth(0)).toContainText("landscape.webp");

  await page.getByRole("button", { name: "Remove portrait.png" }).click();
  await expect(yourScreenshots(page)).toHaveCount(2);

  await yourScreenshots(page).nth(1).locator('input[type="file"]').setInputFiles(fixtures.images[4]);
  await expect(yourScreenshots(page).nth(1)).toContainText("photo.jpg");

  // Removing everything brings the samples back.
  await page.getByRole("button", { name: "Remove landscape.webp" }).click();
  await page.getByRole("button", { name: "Remove photo.jpg" }).click();
  await expect(page.getByText("Showing 4 sample screenshots")).toBeVisible();
});

test("PNG export is exact size and deterministic", async ({ page }) => {
  await page.locator('input[type="file"][multiple]').setInputFiles(fixtures.images.slice(0, 2));
  await expect(yourScreenshots(page)).toHaveCount(2);

  const first = await exportFrom(page, /Export slide 1 as PNG/);
  expect(first.name).toBe("01.png");
  expect(pngSize(first.buffer)).toEqual({ width: 1080, height: 1920 });

  const second = await exportFrom(page, /Export slide 1 as PNG/);
  expect(second.buffer.equals(first.buffer)).toBe(true);
});

test("ZIP contains every slide in order at exact size", async ({ page }) => {
  await page.locator('input[type="file"][multiple]').setInputFiles(fixtures.images);
  await expect(yourScreenshots(page)).toHaveCount(5);

  const zipFile = await exportFrom(page, /Download all 5 slides as ZIP/);
  expect(zipFile.name).toBe("taskly-screenshots.zip");
  const zip = await JSZip.loadAsync(zipFile.buffer);
  expect(Object.keys(zip.files)).toEqual(["01.png", "02.png", "03.png", "04.png", "05.png"]);
  for (const name of Object.keys(zip.files)) {
    const png = await zip.file(name)!.async("nodebuffer");
    expect(pngSize(png), name).toEqual({ width: 1080, height: 1920 });
    expect(png.length, `${name} under the 8 MB store limit`).toBeLessThan(8 * 1024 * 1024);
  }
});

test("long text is capped and empty optional fields still export", async ({ page }) => {
  const headline = page.getByLabel("Headline");
  await headline.fill("Track every habit, goal and streak in one place and then some more words");
  await expect(headline).toHaveValue(/^.{1,48}$/);
  expect(pngSize((await exportFrom(page, /Export slide 1 as PNG/)).buffer).height).toBe(1920);

  await headline.fill("");
  await page.getByLabel("Description").fill("");
  expect(pngSize((await exportFrom(page, /Export slide 1 as PNG/)).buffer).height).toBe(1920);
});

test("headline font and colors change the export", async ({ page }) => {
  const before = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  // The radio is visually hidden; users click its label card.
  await page.getByText("Editorial serif").click();
  await expect(page.getByRole("radio", { name: "Editorial serif" })).toBeChecked();
  const serif = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  expect(serif.equals(before)).toBe(false);

  await page.getByLabel(/^Background/).fill("#112233");
  await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
});

test("Full set and Store preview show every slide", async ({ page }) => {
  await page.getByRole("button", { name: "Full set" }).click();
  await expect(page.getByRole("list", { name: "Full set" }).getByRole("button")).toHaveCount(4);

  await page.getByRole("button", { name: "Store preview" }).click();
  await expect(page.getByRole("list", { name: "Store screenshots" }).getByRole("listitem")).toHaveCount(4);
  await page.getByRole("button", { name: "Edit slide 3" }).click();
  await expect(page.getByRole("button", { name: "Slide 3", exact: true })).toHaveAttribute("aria-current", "true");
});
