// =============================================================================
// Unit tests — frontend utility functions for cote-lapyx
//
// Strategy
// --------
// 1. Pure helpers (escHtml / fmtDate / authorInitials / build*Card / *RowHtml)
//    live INSIDE event-listener closures or at module scope without `export`,
//    so we test verbatim copies kept in `_fixtures.js`. This keeps tests
//    side-effect-free — importing the real modules would auto-fire fetch()
//    against api.cote-lapyx.com.
//
// 2. `auth.js` already exports signOut / isLoggedIn / fetchWithAuth — those
//    are tested directly with jsdom + a mocked fetch + real localStorage.
//
// 3. Negative paths: nullish input, empty input, XSS payloads, malformed
//    dates, edge cases (single-name authors, long names, multi-space names).
// =============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  escHtml,
  fmtDateBlog,
  fmtDateDash,
  authorInitials,
  buildBlogCard,
  postListRowHtml,
  projectListRowHtml,
} from "./_fixtures.js";

// -----------------------------------------------------------------------------
// escHtml
// -----------------------------------------------------------------------------

describe("escHtml()", () => {
  it("returns empty string for empty input", () => {
    expect(escHtml("")).toBe("");
  });

  it("returns empty string for null", () => {
    expect(escHtml(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escHtml(undefined)).toBe("");
  });

  it("escapes <script>alert(1)</script> XSS payload", () => {
    const out = escHtml("<script>alert(1)</script>");
    expect(out).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("</script");
  });

  it('escapes ampersand: "Hello & World" -> "Hello &amp; World"', () => {
    expect(escHtml("Hello & World")).toBe("Hello &amp; World");
  });

  it("escapes double-quotes (so that attribute injection is impossible)", () => {
    expect(escHtml('a"b')).toBe("a&quot;b");
  });

  it("does NOT escape single quotes (matches production behaviour)", () => {
    // Documents an actual property of the production code — escHtml leaves '
    // untouched. If this ever changes the test will catch it.
    expect(escHtml("a'b")).toBe("a'b");
  });

  it("escapes & before < and > (no double-encoding bug)", () => {
    // Order matters: replacing < first and then & would produce &amp;lt; for
    // "<&". The production order is &, then <, then > — we verify it.
    expect(escHtml("<&>")).toBe("&lt;&amp;&gt;");
  });

  it("passes through already-escaped input safely (idempotent in shape, but re-encodes &)", () => {
    // This is a "gotcha" — escaping is NOT idempotent: &amp; becomes &amp;amp;
    // We assert the actual behaviour so anyone changing it is forced to
    // confirm the regression intentionally.
    expect(escHtml("&amp;")).toBe("&amp;amp;");
    expect(escHtml("&lt;b&gt;")).toBe("&amp;lt;b&amp;gt;");
  });

  it("coerces numbers and booleans to strings", () => {
    expect(escHtml(42)).toBe("42");
    expect(escHtml(true)).toBe("true");
    expect(escHtml(0)).toBe("0");
  });

  it("preserves unicode (Cyrillic, emoji)", () => {
    expect(escHtml("Привіт ✦")).toBe("Привіт ✦");
  });
});

// -----------------------------------------------------------------------------
// fmtDate (two flavours: blog returns "", dashboard returns "—")
// -----------------------------------------------------------------------------

describe("fmtDate()", () => {
  describe("blog flavour (empty fallback)", () => {
    it('returns "" for null', () => expect(fmtDateBlog(null)).toBe(""));
    it('returns "" for undefined', () =>
      expect(fmtDateBlog(undefined)).toBe(""));
    it('returns "" for ""', () => expect(fmtDateBlog("")).toBe(""));

    it("formats a valid ISO date string", () => {
      const out = fmtDateBlog("2025-03-14T10:00:00Z");
      // Must contain a digit (day or year) — exact wording depends on Node ICU
      expect(out).toMatch(/\d/);
      // Year present
      expect(out).toContain("2025");
    });

    it("does not throw on invalid date string (returns 'Invalid Date'-ish)", () => {
      expect(() => fmtDateBlog("not-a-date")).not.toThrow();
      // Node's toLocaleDateString returns the literal "Invalid Date"
      // for invalid inputs — assert it does not crash.
      const out = fmtDateBlog("not-a-date");
      expect(typeof out).toBe("string");
    });
  });

  describe("dashboard flavour (em-dash fallback)", () => {
    it('returns "—" for null', () => expect(fmtDateDash(null)).toBe("—"));
    it('returns "—" for undefined', () =>
      expect(fmtDateDash(undefined)).toBe("—"));
    it('returns "—" for ""', () => expect(fmtDateDash("")).toBe("—"));

    it("formats a valid ISO date string with year", () => {
      const out = fmtDateDash("2024-12-01T00:00:00Z");
      expect(out).toContain("2024");
    });
  });
});

// -----------------------------------------------------------------------------
// authorInitials
// -----------------------------------------------------------------------------

describe("authorInitials()", () => {
  it('"Сергій Хільченко" -> "СХ"', () => {
    expect(authorInitials("Сергій Хільченко")).toBe("СХ");
  });

  it('single name "Сергій" -> "СЕ" (first 2 letters, upper)', () => {
    // The source code uses .toUpperCase() on the 2-char slice — for Cyrillic
    // "Сергій" the first two chars are "Се" -> "СЕ"
    expect(authorInitials("Сергій")).toBe("СЕ");
  });

  it('returns "?" for null', () => expect(authorInitials(null)).toBe("?"));
  it('returns "?" for undefined', () =>
    expect(authorInitials(undefined)).toBe("?"));
  it('returns "?" for ""', () => expect(authorInitials("")).toBe("?"));

  it("handles a name with leading/trailing whitespace", () => {
    expect(authorInitials("  Anna Karenina  ")).toBe("AK");
  });

  it("handles 3+ word names by using first two words only", () => {
    expect(authorInitials("John Ronald Tolkien")).toBe("JR");
  });

  it("handles double-space between names", () => {
    // "Anna  Karenina" -> split(/\s+/) -> ["Anna","Karenina"] -> "AK"
    const out = authorInitials("Anna  Karenina");
    expect(out).toBe("AK");
  });

  it('uppercases ASCII single-name input: "bob" -> "BO"', () => {
    expect(authorInitials("bob")).toBe("BO");
  });
});

// -----------------------------------------------------------------------------
// buildBlogCard (structure / XSS hardening)
// -----------------------------------------------------------------------------

describe("buildBlogCard()", () => {
  const basePost = {
    title: "Hello world",
    excerpt: "Lorem ipsum",
    publishedAt: "2025-03-14T10:00:00Z",
    author: { name: "Сергій Хільченко" },
    categories: [{ name: "Tech" }],
    coverImage: "https://example.com/img.jpg",
  };

  it('returns a string containing <article class="blog-card">', () => {
    const html = buildBlogCard(basePost);
    expect(typeof html).toBe("string");
    expect(html).toContain('<article class="blog-card">');
  });

  it("includes the author name (escaped)", () => {
    const html = buildBlogCard(basePost);
    expect(html).toContain("Сергій Хільченко");
  });

  it("includes the author initials avatar", () => {
    const html = buildBlogCard(basePost);
    expect(html).toContain("СХ");
  });

  it('renders fallback "—" author + "?" initials when author is missing', () => {
    const html = buildBlogCard({ ...basePost, author: undefined });
    expect(html).toContain("—");
    expect(html).toContain(">?<");
  });

  it("renders the category name when categories[] is non-empty", () => {
    const html = buildBlogCard(basePost);
    expect(html).toContain("Tech");
  });

  it('falls back to "Загальне" category when categories[] missing/empty', () => {
    const html = buildBlogCard({ ...basePost, categories: [] });
    expect(html).toContain("Загальне");
    const html2 = buildBlogCard({ ...basePost, categories: undefined });
    expect(html2).toContain("Загальне");
  });

  it("escapes XSS in title — '<img onerror=alert(1)>' must not produce a real <img>", () => {
    const html = buildBlogCard({
      ...basePost,
      title: "<img onerror=alert(1)>",
    });
    // The title placement is inside <h2 class="blog-card__title">…</h2>.
    // The XSS payload must appear ONLY in escaped form there.
    expect(html).toContain("&lt;img onerror=alert(1)&gt;");
    // Sanity: outside of the legitimate <img class="blog-card__cover" …>,
    // there must be no other <img tag (i.e. the injection didn't break out).
    // (We don't assert "no onerror= text" because the escaped form legitimately
    // contains the literal substring 'onerror=' as harmless text.)
    const withoutCover = html.replace(
      /<img class="blog-card__cover"[^>]*>/g,
      "",
    );
    expect(withoutCover).not.toMatch(/<img\b/i);
    // The unescaped attribute "onerror=alert" with no preceding & escape must
    // never appear — only the &lt; / &gt; encoded form is acceptable.
    expect(withoutCover).not.toMatch(/(?<!&lt;img )onerror\s*=/);
  });

  it("escapes XSS in excerpt", () => {
    const html = buildBlogCard({
      ...basePost,
      excerpt: '<script>alert("x")</script>',
    });
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert");
  });

  it("escapes XSS in author name", () => {
    const html = buildBlogCard({
      ...basePost,
      author: { name: "<b>Bad</b>" },
    });
    expect(html).toContain("&lt;b&gt;Bad&lt;/b&gt;");
    // The avatar initials block intentionally renders raw initials (not the
    // injected tag) — verify <b> never appears verbatim.
    expect(html).not.toContain("<b>Bad</b>");
  });

  it("escapes XSS in coverImage URL (attribute-injection guard)", () => {
    const html = buildBlogCard({
      ...basePost,
      coverImage: '"><script>alert(1)</script>',
    });
    // Double-quote must be encoded so attribute-context is safe
    expect(html).toContain("&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;");
    // No real script tag broke out
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("renders cover-placeholder when no coverImage", () => {
    const html = buildBlogCard({ ...basePost, coverImage: null });
    expect(html).toContain("blog-card__cover-placeholder");
    expect(html).not.toContain('<img class="blog-card__cover"');
  });

  it('renders <img class="blog-card__cover"> when coverImage URL provided', () => {
    const html = buildBlogCard(basePost);
    expect(html).toContain('<img class="blog-card__cover"');
    expect(html).toContain('src="https://example.com/img.jpg"');
    expect(html).not.toContain("blog-card__cover-placeholder");
  });

  it("uses createdAt when publishedAt is missing", () => {
    const html = buildBlogCard({
      ...basePost,
      publishedAt: undefined,
      createdAt: "2024-01-15T00:00:00Z",
    });
    expect(html).toContain("2024");
  });

  it('renders empty <time> string when both publishedAt and createdAt are missing (blog flavour fallback "")', () => {
    const html = buildBlogCard({
      ...basePost,
      publishedAt: undefined,
      createdAt: undefined,
    });
    expect(html).toContain('<time class="blog-card__date"></time>');
  });
});

// -----------------------------------------------------------------------------
// postListRowHtml (dashboard.js)
// -----------------------------------------------------------------------------

describe("postListRowHtml()", () => {
  const basePost = {
    title: "First post",
    slug: "first-post",
    type: "GENERAL",
    status: "PUBLISHED",
    createdAt: "2025-01-10T00:00:00Z",
  };

  it("returns a string containing .dash-list__row", () => {
    const html = postListRowHtml(basePost);
    expect(html).toContain('class="dash-list__row"');
  });

  it('contains data-action="edit" and data-action="delete" buttons', () => {
    const html = postListRowHtml(basePost);
    expect(html).toContain('data-action="edit"');
    expect(html).toContain('data-action="delete"');
  });

  it('places the slug into data-slug="…" attributes (escaped)', () => {
    const html = postListRowHtml(basePost);
    expect(html).toContain('data-slug="first-post"');
  });

  it("XSS-escapes the title", () => {
    const html = postListRowHtml({
      ...basePost,
      title: "<img src=x onerror=alert(1)>",
    });
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
  });

  it("XSS-escapes the slug (so attribute-injection is impossible)", () => {
    const html = postListRowHtml({
      ...basePost,
      slug: '"><script>alert(1)</script>',
    });
    // The double-quote must be encoded inside the data-slug attribute
    expect(html).toContain(
      'data-slug="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"',
    );
    expect(html).not.toContain('data-slug=""><script>');
  });

  it("renders Cyrillic status label for PUBLISHED", () => {
    const html = postListRowHtml(basePost);
    expect(html).toContain("Опубліковано");
    expect(html).toContain("dash-status--published");
  });

  it("renders DRAFT label + class", () => {
    const html = postListRowHtml({ ...basePost, status: "DRAFT" });
    expect(html).toContain("Чернетка");
    expect(html).toContain("dash-status--draft");
  });

  it("falls back to draft class on unknown status (and shows raw label)", () => {
    const html = postListRowHtml({ ...basePost, status: "WEIRD" });
    expect(html).toContain("dash-status--draft");
    expect(html).toContain("WEIRD");
  });

  it("renders GENERAL badge with cyan colour", () => {
    const html = postListRowHtml(basePost);
    expect(html).toContain("neon-badge--cyan");
    expect(html).toContain("Загальне");
  });

  it("renders PERSONAL badge with magenta colour", () => {
    const html = postListRowHtml({ ...basePost, type: "PERSONAL" });
    expect(html).toContain("neon-badge--magenta");
    expect(html).toContain("Особисте");
  });

  it("falls back to cyan + raw type label for unknown type", () => {
    const html = postListRowHtml({ ...basePost, type: "FOO" });
    expect(html).toContain("neon-badge--cyan");
    expect(html).toContain(">FOO<");
  });
});

// -----------------------------------------------------------------------------
// projectListRowHtml (dashboard.js) — sanity coverage as bonus
// -----------------------------------------------------------------------------

describe("projectListRowHtml()", () => {
  const baseProject = {
    title: "Cool Project",
    slug: "cool",
    technologies: ["JS", "PHP", "SQL", "Redis"],
    status: "PUBLISHED",
  };

  it("contains .dash-list__row", () => {
    expect(projectListRowHtml(baseProject)).toContain('class="dash-list__row"');
  });

  it("renders only the first 3 technologies", () => {
    const html = projectListRowHtml(baseProject);
    expect(html).toContain(">JS<");
    expect(html).toContain(">PHP<");
    expect(html).toContain(">SQL<");
    expect(html).not.toContain(">Redis<");
  });

  it("shows em-dash when technologies is empty", () => {
    const html = projectListRowHtml({
      ...baseProject,
      technologies: [],
    });
    expect(html).toContain('data-label="Технології">—<');
  });

  it("XSS-escapes title and slug", () => {
    const html = projectListRowHtml({
      ...baseProject,
      title: "<x>",
      slug: '"><x>',
    });
    expect(html).toContain("&lt;x&gt;");
    expect(html).toContain("&quot;&gt;&lt;x&gt;");
    expect(html).not.toContain("<x>");
  });

  it("XSS-escapes technologies", () => {
    const html = projectListRowHtml({
      ...baseProject,
      technologies: ["<img onerror=alert(1)>"],
    });
    expect(html).toContain("&lt;img onerror=alert(1)&gt;");
    expect(html).not.toContain("<img onerror=");
  });
});

// -----------------------------------------------------------------------------
// auth.js — real exported functions, tested via jsdom + mocked fetch
// -----------------------------------------------------------------------------

describe("auth.js", () => {
  let auth;

  beforeEach(async () => {
    // Fresh module each time to defeat any in-module state
    vi.resetModules();
    localStorage.clear();
    // jsdom by default exposes `location`; make replace() a spy
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        pathname: "/dashboard.html",
        replace: vi.fn(),
      },
    });
    // Stub fetch globally — individual tests override per-call
    globalThis.fetch = vi.fn();

    auth = await import("../common/auth.js");
  });

  describe("isLoggedIn()", () => {
    it("returns false when no token present", () => {
      expect(auth.isLoggedIn()).toBe(false);
    });

    it("returns true when cl_access token exists", () => {
      localStorage.setItem("cl_access", "abc.def.ghi");
      expect(auth.isLoggedIn()).toBe(true);
    });

    it("returns false when token is empty string (falsy)", () => {
      localStorage.setItem("cl_access", "");
      expect(auth.isLoggedIn()).toBe(false);
    });

    it("returns true even for invalid-looking tokens (no validation performed)", () => {
      // Documents the explicit JSDoc note: "not validated"
      localStorage.setItem("cl_access", "not-a-real-jwt");
      expect(auth.isLoggedIn()).toBe(true);
    });
  });

  describe("signOut()", () => {
    it("removes cl_access and cl_refresh from localStorage", () => {
      localStorage.setItem("cl_access", "a");
      localStorage.setItem("cl_refresh", "r");
      auth.signOut();
      expect(localStorage.getItem("cl_access")).toBeNull();
      expect(localStorage.getItem("cl_refresh")).toBeNull();
    });

    it("redirects to /login.html when not on login page", () => {
      window.location.pathname = "/dashboard.html";
      auth.signOut();
      expect(window.location.replace).toHaveBeenCalledWith("/login.html");
    });

    it("does NOT redirect when already on login page", () => {
      window.location.pathname = "/login.html";
      auth.signOut();
      expect(window.location.replace).not.toHaveBeenCalled();
    });

    it("does NOT redirect when path contains 'login' substring", () => {
      window.location.pathname = "/some/login-page.html";
      auth.signOut();
      expect(window.location.replace).not.toHaveBeenCalled();
    });

    it("is idempotent — second call is safe with no tokens", () => {
      auth.signOut();
      expect(() => auth.signOut()).not.toThrow();
    });
  });

  describe("fetchWithAuth()", () => {
    it("attaches Bearer token from localStorage", async () => {
      localStorage.setItem("cl_access", "TOKEN1");
      globalThis.fetch.mockResolvedValueOnce(
        new Response("{}", { status: 200 }),
      );

      await auth.fetchWithAuth("https://api.example.com/data");

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = globalThis.fetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/data");
      expect(options.headers.Authorization).toBe("Bearer TOKEN1");
    });

    it("returns the response unchanged for non-401 status", async () => {
      localStorage.setItem("cl_access", "TOKEN1");
      const ok = new Response('{"ok":true}', { status: 200 });
      globalThis.fetch.mockResolvedValueOnce(ok);
      const res = await auth.fetchWithAuth("https://api.example.com/data");
      expect(res.status).toBe(200);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("on 401 with no refresh token: signs out and returns the original 401", async () => {
      localStorage.setItem("cl_access", "EXPIRED");
      globalThis.fetch.mockResolvedValueOnce(
        new Response("Unauthorized", { status: 401 }),
      );

      const res = await auth.fetchWithAuth("https://api.example.com/data");

      expect(res.status).toBe(401);
      expect(localStorage.getItem("cl_access")).toBeNull();
      expect(window.location.replace).toHaveBeenCalledWith("/login.html");
    });

    it("on 401 with refresh token: refreshes and retries with new token", async () => {
      localStorage.setItem("cl_access", "OLD");
      localStorage.setItem("cl_refresh", "REFRESH");

      globalThis.fetch
        // 1st call: original request -> 401
        .mockResolvedValueOnce(new Response("nope", { status: 401 }))
        // 2nd call: /auth/refresh -> 200 with new tokens
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              accessToken: "NEW_ACCESS",
              refreshToken: "NEW_REFRESH",
            }),
            { status: 200 },
          ),
        )
        // 3rd call: retried original -> 200
        .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));

      const res = await auth.fetchWithAuth("https://api.example.com/data");

      expect(res.status).toBe(200);
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
      expect(localStorage.getItem("cl_access")).toBe("NEW_ACCESS");
      expect(localStorage.getItem("cl_refresh")).toBe("NEW_REFRESH");

      // Retried call uses the NEW token
      const lastCallOptions = globalThis.fetch.mock.calls[2][1];
      expect(lastCallOptions.headers.Authorization).toBe("Bearer NEW_ACCESS");
    });

    it("on 401 with bad refresh token: signs out and returns original 401", async () => {
      localStorage.setItem("cl_access", "OLD");
      localStorage.setItem("cl_refresh", "BAD");

      globalThis.fetch
        .mockResolvedValueOnce(new Response("nope", { status: 401 }))
        .mockResolvedValueOnce(new Response("nope", { status: 401 }));

      const res = await auth.fetchWithAuth("https://api.example.com/data");

      expect(res.status).toBe(401);
      expect(localStorage.getItem("cl_access")).toBeNull();
      expect(localStorage.getItem("cl_refresh")).toBeNull();
      expect(window.location.replace).toHaveBeenCalledWith("/login.html");
    });

    it("merges custom headers with Authorization", async () => {
      localStorage.setItem("cl_access", "T");
      globalThis.fetch.mockResolvedValueOnce(new Response("", { status: 200 }));

      await auth.fetchWithAuth("https://api.example.com/data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Custom": "1" },
        body: '{"a":1}',
      });

      const [, options] = globalThis.fetch.mock.calls[0];
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers["X-Custom"]).toBe("1");
      expect(options.headers.Authorization).toBe("Bearer T");
      expect(options.body).toBe('{"a":1}');
    });
  });
});
