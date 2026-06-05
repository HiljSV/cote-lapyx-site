// =============================================================================
// Blog page — loads published posts from the API
// =============================================================================

import { translate } from "@js/i18n.js";

const API = "https://api.cote-lapyx.com/api/v1";
const PAGE_SIZE = 12;

let currentPage = 0;
let currentTag = "";
let currentSearch = "";
let totalPages = 1;
let searchTimer = null;

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso) {
  if (!iso) return "";
  // Use the currently active UI language for locale-aware date formatting
  const lang = localStorage.getItem("cl_lang") || "uk";
  return new Date(iso).toLocaleDateString(lang, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function authorInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

// Return Latin displayName for non-UK locales, fall back to Cyrillic name
function authorDisplayName(author) {
  if (!author) return "—";
  const lang = localStorage.getItem("cl_lang") || "uk";
  return lang !== "uk" && author.displayName
    ? author.displayName
    : author.name || "—";
}

function buildBlogCard(post) {
  const authorName = authorDisplayName(post.author);
  const initials = authorInitials(post.author?.name);
  const category =
    post.categories?.length > 0
      ? escHtml(post.categories[0].name)
      : translate("blog.category.general");
  const date = post.publishedAt || post.createdAt;
  // Cover image: alt carries the post title for screen readers (meaningful image, not decorative).
  // Broken-src fallback is handled by a delegated error listener (see initBrokenCoverFallback),
  // not an inline onerror handler — inline handlers would violate the site CSP.
  const coverHtml = post.coverImage
    ? `<img class="blog-card__cover" src="${escHtml(post.coverImage)}" alt="${escHtml(post.title)}" />`
    : `<div class="blog-card__cover-placeholder" aria-hidden="true">✦</div>`;

  // Render avatar img if available, otherwise show initials text
  const avatarInner = post.author?.avatar
    ? `<img src="${escHtml(post.author.avatar)}" alt="" aria-hidden="true" />`
    : initials;

  // SEO-friendly article URL (Apache rewrites /blog/<slug> → post.html)
  const href = post.slug ? `/blog/${encodeURIComponent(post.slug)}` : "#";
  return `<li>
    <a href="${href}" class="blog-card__link">
      <article class="blog-card">
        ${coverHtml}
        <div class="blog-card__body">
          <div class="blog-card__meta">
            <span class="blog-card__category">${category}</span>
          </div>
          <h2 class="blog-card__title">${escHtml(post.title)}</h2>
          <p class="blog-card__excerpt">${escHtml(post.excerpt || "")}</p>
          <div class="blog-card__footer">
            <div class="blog-card__author">
              <div class="blog-card__author-avatar" aria-hidden="true">${avatarInner}</div>
              ${escHtml(authorName)}
            </div>
            <time class="blog-card__date">${fmtDate(date)}</time>
          </div>
        </div>
      </article>
    </a>
  </li>`;
}

async function loadPosts(page, append = false) {
  const listEl = document.getElementById("blog-list");
  const loadingEl = document.getElementById("blog-loading");
  const moreWrap = document.getElementById("blog-more-wrap");
  if (!listEl) return;

  if (loadingEl) loadingEl.removeAttribute("hidden");
  if (moreWrap) moreWrap.setAttribute("hidden", "");

  const params = new URLSearchParams({
    size: PAGE_SIZE,
    sort: "publishedAt,desc",
    page,
  });
  // Filter by tag slug (public endpoint param is `tag`) + free-text search.
  if (currentTag) params.set("tag", currentTag);
  if (currentSearch) params.set("search", currentSearch);

  // Read current UI language so the backend returns translated post content
  const lang = localStorage.getItem("cl_lang") || "uk";
  params.set("locale", lang);

  try {
    // GET /api/v1/posts — public endpoint, no auth needed; locale passed for translations
    const res = await fetch(`${API}/posts?${params}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const cards = (data.content || []).map(buildBlogCard).join("");

    if (append) {
      const tmp = document.createElement("ul");
      tmp.innerHTML = cards;
      Array.from(tmp.children).forEach((li) => listEl.appendChild(li));
    } else {
      if (loadingEl) loadingEl.setAttribute("hidden", "");
      listEl.innerHTML =
        cards || `<li class="blog-page__empty">${translate("blog.empty")}</li>`;
    }

    totalPages = data.page?.totalPages ?? 1;
    currentPage = page;

    if (loadingEl) loadingEl.setAttribute("hidden", "");
    if (moreWrap && currentPage + 1 < totalPages) {
      moreWrap.removeAttribute("hidden");
    }
  } catch (err) {
    console.error("Blog load error:", err);
    if (loadingEl) loadingEl.setAttribute("hidden", "");
    if (!append) {
      listEl.innerHTML = `<li class="blog-page__empty">${translate("blog.error_load")}</li>`;
    }
  }
}

// Latest posts widget used on home page (#blog-latest)
async function loadLatestPosts() {
  const latestEl = document.getElementById("blog-latest");
  if (!latestEl) return;
  try {
    // Read current UI language so the backend returns translated post content
    const lang = localStorage.getItem("cl_lang") || "uk";
    // GET /api/v1/posts — public endpoint; locale appended for translations
    const res = await fetch(
      `${API}/posts?size=3&sort=publishedAt,desc&locale=${lang}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    const posts = data.content || [];
    // P1-4: hide the whole #blog section when there are no posts (avoid empty block)
    const blogSection = document.getElementById("blog");
    if (posts.length === 0) {
      if (blogSection) blogSection.style.display = "none";
      latestEl.innerHTML = "";
      return;
    }
    // Posts exist — ensure section is visible (in case it was hidden on a prior empty load)
    if (blogSection) blogSection.style.display = "";
    latestEl.innerHTML = posts.map(buildBlogCard).join("");
  } catch (_) {}
}

// CSP-safe broken-cover fallback: replace a failed .blog-card__cover image with
// the same placeholder used when no cover exists. Uses capture-phase delegation
// because the `error` event does not bubble.
function initBrokenCoverFallback() {
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement)) return;
      if (!img.classList.contains("blog-card__cover")) return;
      const placeholder = document.createElement("div");
      placeholder.className = "blog-card__cover-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.textContent = "✦";
      img.replaceWith(placeholder);
    },
    true,
  );
}

// Build the topic (tag) filter buttons from tags actually used by published posts.
// Fetches a large page once, collects unique {slug,name}, and injects buttons so
// every button maps to at least one real post (no dead filters).
async function loadTagFilters() {
  const group = document.getElementById("blog-filter-group");
  if (!group) return;
  try {
    const lang = localStorage.getItem("cl_lang") || "uk";
    const res = await fetch(
      `${API}/posts?size=100&sort=publishedAt,desc&locale=${lang}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    const seen = new Map();
    (data.content || []).forEach((p) =>
      (p.tags || []).forEach((t) => {
        if (t && t.slug && !seen.has(t.slug))
          seen.set(t.slug, t.name || t.slug);
      }),
    );
    // Alphabetical by display name for stable ordering.
    const tags = [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    const html = tags
      .map(
        ([slug, name]) =>
          `<button class="filter-bar__btn" data-filter-tag="${escHtml(slug)}">${escHtml(name)}</button>`,
      )
      .join("");
    group.insertAdjacentHTML("beforeend", html);
  } catch (_) {
    /* filter keeps just the "All" button on error */
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("blog-list");
  const latestEl = document.getElementById("blog-latest");

  // Wire the CSP-safe broken-cover fallback once for all blog cards on the page
  initBrokenCoverFallback();

  if (listEl) {
    // Initial load
    loadPosts(0);

    // Populate dynamic tag buttons, then delegate clicks (buttons added async).
    loadTagFilters();
    const filterGroup = document.getElementById("blog-filter-group");
    filterGroup?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter-tag]");
      if (!btn) return;
      filterGroup
        .querySelectorAll("[data-filter-tag]")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentTag = btn.dataset.filterTag || "";
      loadPosts(0);
    });

    // Search input (debounced 500ms)
    const searchInput = document.getElementById("blog-search");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          currentSearch = searchInput.value.trim();
          loadPosts(0);
        }, 500);
      });
    }

    // Load more button
    document.getElementById("blog-load-more")?.addEventListener("click", () => {
      loadPosts(currentPage + 1, true);
    });
  }

  if (latestEl) {
    loadLatestPosts();
  }

  // Re-render cards when user switches language so dates and category labels update
  document.addEventListener("cl:languagechange", () => {
    if (listEl) {
      currentPage = 0;
      loadPosts(0);
    }
    if (latestEl) {
      loadLatestPosts();
    }
  });
});
