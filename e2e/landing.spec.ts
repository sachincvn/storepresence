import { expect, test } from "@playwright/test";

test("template gallery shows real renders and links open the right template", async ({ page }) => {
  await page.goto("/");
  const gallery = page.locator("#templates");
  await gallery.scrollIntoViewIfNeeded();

  const cards = gallery.getByRole("listitem");
  await expect(cards).toHaveCount(10);

  // Previews are real renderer output: the first canvas gets painted once in view.
  const firstCanvas = gallery.locator("canvas").first();
  await expect(firstCanvas).toBeVisible();
  await expect
    .poll(() =>
      firstCanvas.evaluate((c: HTMLCanvasElement) => {
        const { data } = c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
        return data.some((v, i) => i % 4 === 3 && v > 0);
      }),
    )
    .toBe(true);

  // Regression: gallery links used mock ids that the editor did not know.
  await gallery.getByRole("link", { name: "Sunny Pop" }).click();
  await expect(page).toHaveURL(/\/editor\?template=sunny-pop/);
  await expect(page.getByRole("button", { name: /^Sunny Pop/ })).toHaveAttribute("aria-pressed", "true");
});

