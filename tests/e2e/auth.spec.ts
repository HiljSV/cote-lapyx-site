// Auth flow tests — login, dashboard load, admin panel critical paths.
// Uses the Andrii OWNER account (read-only operations only — no mutations).
// Credentials come from env vars so they can be stored as GitHub Secrets.
import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "";
const PASSWORD = process.env.E2E_PASSWORD ?? "";

test.describe("Auth — login flow", () => {
  // Skip the whole suite unless a dedicated E2E test user is provided via env
  // (E2E_EMAIL / E2E_PASSWORD). This keeps the gate green without credentials and
  // prevents accidental use of a personal/owner account. See Phase 2F report.
  test.skip(
    !EMAIL || !PASSWORD,
    "E2E_EMAIL/E2E_PASSWORD not set — dedicated test user required for auth suite",
  );

  // Shared login state: log in once, reuse for subsequent tests in this suite
  test.beforeEach(async ({ page }) => {
    await page.goto("/login.html", { waitUntil: "load" });
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    // Use the specific submit button ID — header also has .btn--cyan elements that
    // would be selected first by a generic selector and would not submit the form.
    await page.locator("#login-submit").click();
    // Wait for redirect to dashboard (token stored in localStorage on success)
    await page.waitForURL(/dashboard\.html/, { timeout: 15_000 });
  });

  test("dashboard loads with sidebar after login", async ({ page }) => {
    // Sidebar must be present — it renders immediately from HTML
    await expect(page.locator("#dash-sidebar")).toBeVisible();
    // Wrapper is revealed once /users/me resolves (JS removes visibility:hidden)
    await expect(page.locator(".wrapper")).toBeVisible({ timeout: 10_000 });
  });

  test("dashboard profile panel shows no error state", async ({ page }) => {
    // Activate profile section
    await page.locator('[data-section="profile"]').click();
    // Name input must be visible and not stuck at empty/error state
    await expect(page.locator("#profile-name")).toBeVisible();
    // Profile panel (data-panel="profile") must not show an error state
    await expect(page.locator('[data-panel="profile"]')).not.toContainText(
      "Помилка",
    );
  });

  test("admin.html loads and users section has no 500 error", async ({
    page,
  }) => {
    await page.goto("/admin.html", { waitUntil: "domcontentloaded" });
    // Sidebar must render
    await expect(page.locator("#admin-sidebar")).toBeVisible();
    // Navigate to users section
    await page.locator('[data-section="users"]').click();
    // Wait for list to populate — should NOT show "Помилка завантаження"
    const usersBody = page.locator("#admin-users-body");
    await usersBody.waitFor({ timeout: 10_000 });
    await expect(usersBody).not.toContainText("Помилка завантаження");
  });
});
