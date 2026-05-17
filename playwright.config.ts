// Playwright E2E configuration for cote-lapyx.com
// Runs against the live production site after each deploy.
// See: https://playwright.dev/docs/test-configuration
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // All E2E specs live in tests/e2e/
  testDir: "./tests/e2e",

  // Per-test timeout (single page+assertion budget)
  timeout: 30_000,

  // Retry once on failure to absorb transient network/CDN blips
  retries: 1,

  // Serial execution keeps server load low and avoids login races
  workers: 1,

  // Compact reporter — full HTML report is heavy and unused in CI logs
  reporter: "list",

  use: {
    // All relative URLs in specs resolve against production
    baseURL: "https://cote-lapyx.com",
    headless: true,
    // Production must have valid TLS — fail loudly on cert errors
    ignoreHTTPSErrors: false,
  },

  // Single browser project — Chromium covers ~90% of real traffic
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
