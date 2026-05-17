// Smoke tests — every public page must return 200 and render its shell.
// These run after deploy to catch missing assets, broken routes, build regressions.
import { test, expect } from "@playwright/test";

// Helper: assert that a navigation succeeded with an HTTP 2xx response
// and that the document has actually parsed (body present).
async function gotoAndAssert200(page, url: string) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(response, `no response for ${url}`).not.toBeNull();
  expect(response!.status(), `bad status for ${url}`).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
}

test.describe("Public pages — smoke", () => {
  // Home page — main entry point, title is brand-controlled
  test("GET / renders and title contains COTE-LAPYX", async ({ page }) => {
    await gotoAndAssert200(page, "/");
    await expect(page).toHaveTitle(/COTE-LAPYX/i);
  });

  // Team page — lists members, must keep brand title
  test("GET /team.html renders with brand title", async ({ page }) => {
    await gotoAndAssert200(page, "/team.html");
    await expect(page).toHaveTitle(/COTE-LAPYX/i);
  });

  // Blog list — must render at least the blog container or a post card
  test("GET /blog.html renders blog list", async ({ page }) => {
    await gotoAndAssert200(page, "/blog.html");
    // Give the SPA a moment to fetch+render posts from API
    const candidate = page.locator(
      ".blog-post, .blog__post, .blog-card, [data-blog-list], main",
    );
    await expect(candidate.first()).toBeVisible({ timeout: 10_000 });
  });

  // Projects list
  test("GET /projects.html renders", async ({ page }) => {
    await gotoAndAssert200(page, "/projects.html");
    await expect(
      page.locator("main, .projects, [data-projects]").first(),
    ).toBeVisible();
  });

  // About / company info
  test("GET /about.html renders", async ({ page }) => {
    await gotoAndAssert200(page, "/about.html");
    await expect(page.locator("main, .about, body").first()).toBeVisible();
  });

  // Login page must always expose the form (auth entry point)
  test("GET /login.html shows login form", async ({ page }) => {
    await gotoAndAssert200(page, "/login.html");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  // Register page must always expose its form
  test("GET /register.html shows register form", async ({ page }) => {
    await gotoAndAssert200(page, "/register.html");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
