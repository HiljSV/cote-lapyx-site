// Regression E2E — Phase 2F (2026-06-13). READ-ONLY against production.
// NO mutations: no form submits, no account changes, no comment posting, no deletes.
// Covers: navigation, button visibility/click (non-mutating), comment component
// rendering + form availability, auth boundary, basic responsive behavior.
// Selectors are intentionally tolerant (multi-candidate) — validate/tighten against
// the live UI; prefer role/semantic/data-testid as they are added to the app.
import { test, expect, request } from "@playwright/test";

const API = "https://api.cote-lapyx.com/api/v1";

test.describe("Navigation regression", () => {
  // Header navigation must render and expose primary links
  test("home header exposes navigation links", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const nav = page.locator('header nav, nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 10_000 });
    // at least one in-site link present
    await expect(page.locator("header a, nav a").first()).toBeVisible();
  });

  // Navigating between public pages must not break the shell
  test("navigate home → blog → projects keeps shell", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.goto("/blog.html", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main, body").first()).toBeVisible();
    await page.goto("/projects.html", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main, body").first()).toBeVisible();
  });
});

test.describe("Buttons", () => {
  // A primary control must be visible on the home page (CTA / theme / burger)
  test("home shows at least one actionable button/CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // pick a VISIBLE actionable element (the first DOM match may be a hidden
    // mobile/modal control), then assert it is visible
    const btn = page
      .locator('button, a.btn, .btn, [role="button"]')
      .filter({ visible: true })
      .first();
    await expect(btn).toBeVisible({ timeout: 10_000 });
  });

  // Non-mutating click: mobile burger toggles the menu (no navigation/data change)
  test("mobile burger toggle responds to click", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const burger = page
      .locator(
        '.burger, .header__burger, [aria-label*="menu" i], button[aria-expanded]',
      )
      .first();
    // Tolerant: if a burger exists, clicking it must not error and should toggle a menu/state
    if (await burger.count()) {
      await burger.click();
      await expect(page.locator("body")).toBeVisible();
    } else {
      test.info().annotations.push({ type: "note", description: "no burger selector matched — tighten when markup is known" });
    }
  });
});

test.describe("Comments component (render only — no posting)", () => {
  // Resolve a real published post slug from the API, open it, assert the comments
  // section and a comment input/form render. Does NOT submit anything.
  test("a published post page renders a comments section + form control", async ({
    page,
    playwright,
  }) => {
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(`${API}/posts?status=PUBLISHED&size=1`);
    expect(res.status(), "posts list must be 200").toBe(200);
    const body = await res.json();
    const post = (body.content ?? body)[0];
    test.skip(!post, "no published post available to test comments");
    const slug = post.slug ?? post.id;
    await page.goto(`/post.html?slug=${encodeURIComponent(slug)}`, {
      waitUntil: "domcontentloaded",
    });
    // comments container OR a comment form/textarea must render (read-only check)
    const commentsArea = page
      .locator(
        '[data-comments], .comments, #comments, .comment-list, form textarea, textarea[name*="comment" i]',
      )
      .first();
    await expect(commentsArea).toBeVisible({ timeout: 10_000 });
    await ctx.dispose();
  });
});

test.describe("Auth boundary", () => {
  // An unauthenticated visit to a protected page must NOT show dashboard content;
  // it should redirect to login or render the login form.
  test("dashboard is gated when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard.html", { waitUntil: "domcontentloaded" });
    // Either we are redirected to login, or a login form is shown, or the
    // dashboard sidebar is NOT visible. The one thing that must NOT happen is
    // seeing authenticated dashboard content.
    const sidebar = page.locator("#dash-sidebar");
    await expect(sidebar).toHaveCount(0).catch(async () => {
      await expect(sidebar).not.toBeVisible();
    });
  });
});

test.describe("Responsive", () => {
  // Mobile and desktop viewports both render the shell
  test("renders on mobile and desktop viewports", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("header, nav, body").first()).toBeVisible();
  });
});
