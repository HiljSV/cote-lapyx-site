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
    // Relative URLs resolve against this host. Production by default; the staging
    // CI workflow overrides E2E_BASE_URL to target https://staging.cote-lapyx.com.
    baseURL: process.env.E2E_BASE_URL || "https://cote-lapyx.com",
    headless: true,
    // Production/staging both have valid TLS — fail loudly on cert errors
    ignoreHTTPSErrors: false,
    // The staging FE sits behind HTTP basic-auth; pass credentials when present.
    // No-op against production (vars unset) so prod behaviour is unchanged.
    ...(process.env.STAGING_BASIC_AUTH_USER && process.env.STAGING_BASIC_AUTH_PASSWORD
      ? {
          httpCredentials: {
            username: process.env.STAGING_BASIC_AUTH_USER,
            password: process.env.STAGING_BASIC_AUTH_PASSWORD,
          },
        }
      : {}),
  },

  // Single browser project — Chromium covers ~90% of real traffic
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
