import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end tests against a production build (`next dev` edits AGENTS.md
 * when an agent runs it, and production is what users get).
 * Uses the installed Google Chrome; set PW_BUNDLED=1 to use Playwright's
 * Chromium instead (run `npx playwright install chromium` first, e.g. in CI).
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // Each editor page renders dozens of canvases; too many browsers at once starves the CPU.
  workers: process.env.CI ? 2 : 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_BUNDLED ? undefined : "chrome" },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    // Opens the dev-only Template Lab on the production build.
    env: { TEMPLATE_LAB: "1" },
  },
});
