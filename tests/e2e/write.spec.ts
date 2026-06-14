// Write-path E2E — MUTATING tests. Run ONLY against the staging stack.
//
// Double safety gate so these never touch production:
//   1. E2E_ALLOW_WRITES must equal "1" (set only in the e2e-staging workflow), and
//   2. the target baseURL must be a *.staging.cote-lapyx.com host.
// Credentials come from the dedicated staging test user (E2E_EMAIL/E2E_PASSWORD).
import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "";
const PASSWORD = process.env.E2E_PASSWORD ?? "";
const BASE = process.env.E2E_BASE_URL ?? "";
const API_BASE = process.env.E2E_API_BASE ?? "";
// A published post seeded into the staging DB (see staging-seed.sql).
const SEED_POST_SLUG = "staging-welcome";
const WRITES_ALLOWED = process.env.E2E_ALLOW_WRITES === "1";
// Must point at the staging host (prod baseURL "cote-lapyx.com" lacks "staging.").
const ON_STAGING = BASE.includes("staging.cote-lapyx.com");

test.describe("Write paths (staging only)", () => {
  // Hard guard — skip entirely unless explicitly enabled AND pointed at staging.
  test.skip(
    !WRITES_ALLOWED || !ON_STAGING || !EMAIL || !PASSWORD,
    "write-path specs require E2E_ALLOW_WRITES=1, a staging baseURL and test creds",
  );

  // Log in once per test as the dedicated non-owner staging user.
  test.beforeEach(async ({ page }) => {
    await page.goto("/login.html", { waitUntil: "load" });
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator("#login-submit").click();
    await page.waitForURL(/dashboard\.html/, { timeout: 15_000 });
  });

  // Profile edit is idempotent: each run writes a fresh unique bio, then verifies
  // the value round-trips from the API (PATCH /users/me -> reload -> repopulated).
  test("profile edit persists a new bio (PATCH /users/me round-trip)", async ({
    page,
  }) => {
    const marker = `E2E staging bio ${Date.now()}`;

    // Open the profile section and write the new bio.
    await page.locator('[data-section="profile"]').click();
    const bio = page.locator("#profile-bio");
    await expect(bio).toBeVisible({ timeout: 10_000 });
    await bio.fill(marker);

    // Submit the profile form and wait for the PATCH to succeed.
    const [resp] = await Promise.all([
      page.waitForResponse(
        (r) =>
          /\/api\/v1\/users\/me$/.test(r.url()) &&
          r.request().method() === "PATCH",
        { timeout: 15_000 },
      ),
      page.locator('#dash-profile-form [type="submit"]').click(),
    ]);
    expect(resp.status(), "PATCH /users/me should succeed").toBe(200);

    // Reload and confirm the persisted value repopulates from /users/me.
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('[data-section="profile"]').click();
    await expect(page.locator("#profile-bio")).toHaveValue(marker, {
      timeout: 10_000,
    });
  });

  // Registration write-path (API): a brand-new account must be created without the
  // user_activity FK 500 (regression guard for fix/registration-activity-fk).
  // Uses a unique email each run (idempotent); the new account then logs in.
  test("registration creates a new account and it can log in", async ({
    request,
  }) => {
    const email = `e2e-reg-${Date.now()}@example.test`;
    const password = "E2eRegTest123!";

    const reg = await request.post(`${API_BASE}/auth/register`, {
      data: { email, password, name: "E2E Reg" },
    });
    expect(reg.status(), "register should return 201").toBe(201);
    expect((await reg.json()).accessToken, "register returns a token").toBeTruthy();

    const login = await request.post(`${API_BASE}/auth/login`, {
      data: { email, password },
    });
    expect(login.status(), "new account can log in").toBe(200);
  });

  // Comment posting (API): an authenticated subscriber posts a comment on a seeded
  // published post. New comments are created PENDING moderation, so we assert the
  // create succeeds (201) rather than public visibility. Unique content each run.
  test("authenticated user can post a comment (PENDING)", async ({ request }) => {
    const login = await request.post(`${API_BASE}/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(login.status()).toBe(200);
    const token = (await login.json()).accessToken;
    expect(token).toBeTruthy();

    const res = await request.post(
      `${API_BASE}/posts/${SEED_POST_SLUG}/comments`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { content: `E2E staging comment ${Date.now()}` },
      },
    );
    expect(res.status(), "comment create should return 201").toBe(201);
    const body = await res.json();
    expect(body.id, "created comment has an id").toBeTruthy();
  });
});
