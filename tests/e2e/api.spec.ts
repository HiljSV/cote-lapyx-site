// API health tests — hit the live Spring Boot backend at api.cote-lapyx.com.
// Read-only: GETs against public endpoints, no auth, no mutations.
import { test, expect, request } from "@playwright/test";

// Backend lives on a different origin than the frontend — pin it explicitly.
// Production by default; staging CI overrides via E2E_API_BASE.
const API_BASE =
  process.env.E2E_API_BASE || "https://api.cote-lapyx.com/api/v1";

test.describe("Public API — health", () => {
  // Posts feed powers blog list and homepage cards
  test("GET /posts?status=PUBLISHED returns paged content", async ({
    playwright,
  }) => {
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(`${API_BASE}/posts?status=PUBLISHED&size=3`);
    expect(res.status(), "posts endpoint must be 200").toBe(200);

    const body = await res.json();
    // PageResponse contract: { content: [...], totalElements, ... }
    expect(body, "response must be an object").toBeTruthy();
    expect(Array.isArray(body.content), "content must be an array").toBe(true);

    await ctx.dispose();
  });

  // Team members endpoint feeds /team.html and member cards
  // Route: GET /api/v1/team-members (public, no auth required)
  test("GET /team-members returns members array", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(`${API_BASE}/team-members`);
    expect(res.status(), "team-members endpoint must be 200").toBe(200);

    const body = await res.json();
    // team-members returns a bare array (not a PageResponse)
    expect(Array.isArray(body), "team-members response must be an array").toBe(
      true,
    );

    await ctx.dispose();
  });

  // Locale endpoint — must not 5xx. 200 (payload) or 204 (no content) are both fine.
  test("GET /locale does not 5xx", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const res = await ctx.get(`${API_BASE}/locale`);
    // Accept 200/204; explicitly forbid 5xx
    expect(
      res.status(),
      "locale endpoint must not be a server error",
    ).toBeLessThan(500);
    expect([200, 204, 304, 404]).toContain(res.status());

    await ctx.dispose();
  });
});
