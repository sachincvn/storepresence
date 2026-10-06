import JSZip from "jszip";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createFixtures, exportFrom, pngSize, readDownload, yourScreenshots } from "./helpers";

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
  const headline = page.getByRole("textbox", { name: "Headline", exact: true });
  await headline.fill("Track every habit, goal and streak in one place and then some more words");
  await expect(headline).toHaveValue(/^.{1,48}$/);
  expect(pngSize((await exportFrom(page, /Export slide 1 as PNG/)).buffer).height).toBe(1920);

  await headline.fill("");
  await page.getByRole("textbox", { name: "Description", exact: true }).fill("");
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

test("inline markup styles text without showing the markers", async ({ page }) => {
  await page.getByRole("textbox", { name: "Headline", exact: true }).fill("Learn **anywhere**");
  const marked = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  await page.getByRole("textbox", { name: "Headline", exact: true }).fill("Learn anywhere");
  const plain = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  expect(marked.equals(plain)).toBe(false);
  expect(pngSize(marked)).toEqual({ width: 1080, height: 1920 });
});

test("undo and redo edits from the header and keyboard", async ({ page }) => {
  const undo = page.getByRole("button", { name: "Undo" });
  const redo = page.getByRole("button", { name: "Redo" });
  await expect(undo).toBeDisabled();

  await page.getByRole("textbox", { name: "Headline", exact: true }).fill("First");
  await page.getByText("Editorial serif").click();
  await undo.click();
  await expect(page.getByRole("radio", { name: "Editorial serif" })).not.toBeChecked();
  await undo.click();
  await expect(page.getByRole("textbox", { name: "Headline", exact: true })).not.toHaveValue("First");
  await expect(undo).toBeDisabled();

  await redo.click();
  await expect(page.getByRole("textbox", { name: "Headline", exact: true })).toHaveValue("First");

  // Outside text fields, Ctrl+Z / Ctrl+Shift+Z drive the editor history.
  await page.getByRole("button", { name: "Slide 1", exact: true }).focus();
  await page.keyboard.press("Control+Shift+Z");
  await expect(page.getByRole("radio", { name: "Editorial serif" })).toBeChecked();
  await page.keyboard.press("Control+Z");
  await expect(page.getByRole("radio", { name: "Editorial serif" })).not.toBeChecked();

  // A removed screenshot comes back on undo, image intact.
  await page.locator('input[type="file"][multiple]').setInputFiles(fixtures.images.slice(0, 2));
  await expect(yourScreenshots(page)).toHaveCount(2);
  await page.getByRole("button", { name: "Remove portrait.png" }).click();
  await expect(yourScreenshots(page)).toHaveCount(1);
  await undo.click();
  await expect(yourScreenshots(page)).toHaveCount(2);
  expect(pngSize((await exportFrom(page, /Download all 2 slides as ZIP/)).buffer).width).toBeGreaterThan(0);
});

test("work is saved in the browser and restored after reload; start over clears it", async ({ page }) => {
  await page.locator('input[type="file"][multiple]').setInputFiles(fixtures.images.slice(0, 3));
  await expect(yourScreenshots(page)).toHaveCount(3);
  await page.getByRole("textbox", { name: "Headline", exact: true }).fill("Saved headline");
  await page.getByText("Editorial serif").click();
  await expect(page.getByText("Saved in this browser only")).toBeVisible();
  await page.waitForTimeout(800); // past the save debounce

  // Without a template in the URL, the saved template comes back too.
  await page.goto("/editor");
  await expect(yourScreenshots(page)).toHaveCount(3);
  await expect(page.getByRole("button", { name: /^Lilac Clay/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("textbox", { name: "Headline", exact: true })).toHaveValue("Saved headline");
  await expect(page.getByRole("radio", { name: "Editorial serif" })).toBeChecked();
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
  const zip = await JSZip.loadAsync((await exportFrom(page, /Download all 3 slides as ZIP/)).buffer);
  expect(Object.keys(zip.files)).toHaveLength(3);

  // A template picked in the URL wins, keeping screenshots and text.
  await page.goto("/editor?template=midnight");
  await expect(page.getByRole("button", { name: /^Midnight/ })).toHaveAttribute("aria-pressed", "true");
  await expect(yourScreenshots(page)).toHaveCount(3);

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByText("Showing 4 sample screenshots")).toBeVisible();
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByText("Showing 4 sample screenshots")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Headline", exact: true })).not.toHaveValue("Saved headline");
});

test("export dialog adds store sizes as folders at exact pixel sizes", async ({ page }) => {
  await page.getByRole("button", { name: /Download all 4 slides as ZIP/ }).click();
  const dialog = page.getByRole("dialog", { name: "Export" });
  await expect(dialog).toBeVisible();
  expect((await new AxeBuilder({ page }).include("dialog").analyze()).violations).toEqual([]);
  await dialog.getByText("Feature graphic").click();
  await dialog.getByText('iPhone 6.9"').click();
  await expect(dialog.getByRole("status")).toHaveText("9 files");

  const [download] = await Promise.all([page.waitForEvent("download"), dialog.getByRole("button", { name: "Download ZIP" }).click()]);
  const zip = await JSZip.loadAsync(await readDownload(download));
  const files = Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
  expect(files).toEqual([
    "app-store/iphone-6.9/01.png",
    "app-store/iphone-6.9/02.png",
    "app-store/iphone-6.9/03.png",
    "app-store/iphone-6.9/04.png",
    "google-play/feature-graphic.png",
    "google-play/phone/01.png",
    "google-play/phone/02.png",
    "google-play/phone/03.png",
    "google-play/phone/04.png",
  ]);
  const size = async (name: string) => pngSize(await zip.file(name)!.async("nodebuffer"));
  expect(await size("app-store/iphone-6.9/01.png")).toEqual({ width: 1320, height: 2868 });
  expect(await size("google-play/feature-graphic.png")).toEqual({ width: 1024, height: 500 });
  expect(await size("google-play/phone/04.png")).toEqual({ width: 1080, height: 1920 });
  await expect(dialog).toBeHidden();

  // The preview size switch drives "Export slide" too.
  await page.getByRole("combobox", { name: "Size" }).selectOption("ipad-13");
  expect(pngSize((await exportFrom(page, /Export slide 1 as PNG/)).buffer)).toEqual({ width: 2064, height: 2752 });
  await page.getByRole("combobox", { name: "Size" }).selectOption("play-feature");
  expect(pngSize((await exportFrom(page, /Export feature graphic as PNG/)).buffer)).toEqual({ width: 1024, height: 500 });
});
