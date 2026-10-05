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

test("layout picker switches the current slide and markup styles text", async ({ page }) => {
  const before = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;

  await page.getByText("Review", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Review" })).toBeChecked();
  await expect(page.getByRole("textbox", { name: "Review", exact: true })).toBeVisible(); // review quote field appears
  const review = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  expect(review.equals(before)).toBe(false);
  expect(pngSize(review)).toEqual({ width: 1080, height: 1920 });

  // Other slides keep their own layout.
  await page.getByRole("button", { name: "Slide 2", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Review" })).not.toBeChecked();

  // Inline markup renders without the markers.
  await page.getByRole("button", { name: "Slide 1", exact: true }).click();
  await page.getByLabel("Headline").fill("Learn **anywhere**");
  const marked = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  await page.getByLabel("Headline").fill("Learn anywhere");
  const plain = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  expect(marked.equals(plain)).toBe(false);
});

test("undo and redo edits from the header and keyboard", async ({ page }) => {
  const undo = page.getByRole("button", { name: "Undo" });
  const redo = page.getByRole("button", { name: "Redo" });
  await expect(undo).toBeDisabled();

  await page.getByLabel("Headline").fill("First");
  await page.getByText("Editorial serif").click();
  await undo.click();
  await expect(page.getByRole("radio", { name: "Editorial serif" })).not.toBeChecked();
  await undo.click();
  await expect(page.getByLabel("Headline")).not.toHaveValue("First");
  await expect(undo).toBeDisabled();

  await redo.click();
  await expect(page.getByLabel("Headline")).toHaveValue("First");

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
  await page.getByLabel("Headline").fill("Saved headline");
  await page.getByText("Editorial serif").click();
  await expect(page.getByText("Saved in this browser only")).toBeVisible();
  await page.waitForTimeout(800); // past the save debounce

  // Without a template in the URL, the saved template comes back too.
  await page.goto("/editor");
  await expect(yourScreenshots(page)).toHaveCount(3);
  await expect(page.getByRole("button", { name: /^Lilac Clay/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Headline")).toHaveValue("Saved headline");
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
  await expect(page.getByLabel("Headline")).not.toHaveValue("Saved headline");
});

test("pop-out area can be re-picked from the keyboard and hidden per slide", async ({ page }) => {
  await page.goto("/editor?template=studio-blue");
  await page.getByRole("button", { name: "Slide 4", exact: true }).click();
  const area = page.getByRole("group", { name: /^Pop-out area/ });
  await expect(area).toBeVisible();
  const before = (await exportFrom(page, /Export slide 4 as PNG/)).buffer;

  const label = await area.getAttribute("aria-label");
  await area.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Shift+ArrowDown");
  await expect(area).not.toHaveAttribute("aria-label", label!);
  const moved = (await exportFrom(page, /Export slide 4 as PNG/)).buffer;
  expect(moved.equals(before)).toBe(false);
  expect(pngSize(moved)).toEqual({ width: 1080, height: 1920 });

  // Other slides keep their own (no pop-out on slide 1 of this template).
  await page.getByRole("button", { name: "Slide 1", exact: true }).click();
  await expect(area).toBeHidden();
  await page.getByRole("button", { name: "Slide 4", exact: true }).click();
  await expect(area).not.toHaveAttribute("aria-label", label!);

  await page.getByRole("checkbox", { name: "Show pop-out" }).uncheck();
  await expect(area).toBeHidden();
  const hidden = (await exportFrom(page, /Export slide 4 as PNG/)).buffer;
  expect(hidden.equals(moved)).toBe(false);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(area).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).first().click();
  await expect(area).toHaveAttribute("aria-label", label!);
});

test("slides can be added, duplicated, moved and deleted; text slides export with the set", async ({ page }) => {
  const strip = page.getByRole("list", { name: /^Slides/ }).getByRole("listitem");
  await expect(strip).toHaveCount(4);

  await page.getByRole("button", { name: "Text slide" }).click();
  await expect(strip).toHaveCount(5);
  await expect(page.getByRole("button", { name: "Slide 2", exact: true })).toHaveAttribute("aria-current", "true");
  await expect(page.getByLabel("Headline")).toHaveValue(/in one place/);
  // Text slides have no screenshot to pick.
  await expect(page.getByRole("heading", { name: /^Screenshot, slide/ })).toBeHidden();

  await page.getByRole("button", { name: "Duplicate" }).click();
  await expect(strip).toHaveCount(6);
  await page.getByRole("button", { name: "Move slide left" }).click();
  await expect(page.getByRole("button", { name: "Slide 2", exact: true })).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Delete slide" }).click();
  await expect(strip).toHaveCount(5);

  // Upload 3 screenshots: the text slide stays, each screenshot gets a slide.
  await page.locator('input[type="file"][multiple]').setInputFiles(fixtures.images.slice(0, 3));
  await expect(strip).toHaveCount(3);
  await page.getByRole("button", { name: "Slide 1", exact: true }).click();
  await page.getByRole("button", { name: "Text slide" }).click();
  await expect(strip).toHaveCount(4);

  // Slide 3 shows the 2nd screenshot; switch it to the 3rd.
  await page.getByRole("button", { name: "Slide 3", exact: true }).click();
  await page.locator("label").filter({ has: page.getByRole("radio", { name: "tall-capture.png" }) }).click();
  await expect(page.getByRole("radio", { name: "tall-capture.png" })).toBeChecked();

  const zip = await JSZip.loadAsync((await exportFrom(page, /Download all 4 slides as ZIP/)).buffer);
  const names = Object.keys(zip.files);
  expect(names).toHaveLength(4);
  for (const file of names) expect(pngSize(await zip.file(file)!.async("nodebuffer"))).toEqual({ width: 1080, height: 1920 });
});

test("brand colors come from the app icon and apply as one undo step", async ({ page }) => {
  const before = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  const match = page.getByRole("button", { name: /Match colors to your app icon/ });
  await match.locator("xpath=..").locator('input[type="file"]').setInputFiles(fixtures.images[0]);

  const bold = page.getByRole("button", { name: "Use bold brand colors" });
  await expect(bold).toBeVisible();
  await bold.click();
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
  const branded = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  expect(branded.equals(before)).toBe(false);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(bold).toHaveAttribute("aria-pressed", "false");
});

test("collage background and full screen layout render and export", async ({ page }) => {
  const before = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  await page.getByText("Collage", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Collage" })).toBeChecked();
  const collage = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  expect(collage.equals(before)).toBe(false);
  await page.getByRole("button", { name: "Shuffle" }).click();
  const shuffled = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  expect(shuffled.equals(collage)).toBe(false);

  await page.getByText("Full screen", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "Full screen" })).toBeChecked();
  const full = (await exportFrom(page, /Export slide 1 as PNG/)).buffer;
  expect(pngSize(full)).toEqual({ width: 1080, height: 1920 });
});
