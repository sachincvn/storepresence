import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SIZES = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

for (const size of SIZES) {
  test(`editor has no axe violations and no horizontal scroll on ${size.name}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/editor");
    await expect(page.getByText("Showing 4 sample screenshots").or(page.getByRole("button", { name: /Screenshots/ }))).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBe(0);

    // Desktop is an app shell: only the columns scroll, never the page.
    if (size.name === "desktop") {
      const extra = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      expect(extra).toBe(0);
    }
  });
}

test("mobile sheets trap focus and return it on close", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/editor");

  const trigger = page.getByRole("navigation", { name: "Edit" }).getByRole("button", { name: "Text" });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: /Text, slide 1/ });
  await expect(sheet).toBeVisible();
  expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("keyboard: skip link and arrow keys on the slide strip", async ({ page }) => {
  await page.goto("/editor");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to preview" })).toBeFocused();

  await page.getByRole("button", { name: "Slide 1", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Slide 3", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "Slide 3", exact: true })).toHaveAttribute("aria-current", "true");
});
