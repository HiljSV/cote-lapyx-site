// =============================================================================
// Blog page — loads published posts from the API
// =============================================================================

const API = "https://api.cote-lapyx.com/api/v1";
const PAGE_SIZE = 12;

let currentPage = 0;
let currentCategory = "";
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
  return new Date(iso).toLocaleDateString("uk-UA", {
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

function buildBlogCard(post) {
  const authorName = post.author?.name || "—";
  const initials = authorInitials(post.author?.name);
  const category =
    post.categories?.length > 0 ? escHtml(post.categories[0].name) : "Загальне";
  const date = post.publishedAt || post.createdAt;
  const coverHtml = post.coverImage
    ? `<img class="blog-card__cover" src="${escHtml(post.coverImage)}" alt="" aria-hidden="true" />`
    : `<div class="blog-card__cover-placeholder" aria-hidden="true">✦</div>`;

  return `<li>
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
            <div class="blog-card__author-avatar" aria-hidden="true">${initials}</div>
            ${escHtml(authorName)}
          </div>
          <time class="blog-card__date">${fmtDate(date)}</time>
        </div>
      </div>
    </article>
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
  if (currentCategory) params.set("categorySlug", currentCategory);
  if (currentSearch) params.set("search", currentSearch);

  try {
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
        cards ||
        '<li class="blog-page__empty">Публікацій ще немає. Зайдіть пізніше!</li>';
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
      listEl.innerHTML =
        '<li class="blog-page__empty">Не вдалося завантажити статті.</li>';
    }
  }
}

// Latest posts widget used on home page (#blog-latest)
async function loadLatestPosts() {
  const latestEl = document.getElementById("blog-latest");
  if (!latestEl) return;
  try {
    const res = await fetch(`${API}/posts?size=3&sort=publishedAt,desc`);
    if (!res.ok) return;
    const data = await res.json();
    latestEl.innerHTML = (data.content || []).map(buildBlogCard).join("");
  } catch (_) {}
}

document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.getElementById("blog-list");
  const latestEl = document.getElementById("blog-latest");

  if (listEl) {
    // Initial load
    loadPosts(0);

    // Category filter buttons
    document.querySelectorAll("[data-filter-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("[data-filter-cat]")
          .forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const cat = btn.dataset.filterCat;
        currentCategory = cat === "all" ? "" : cat;
        loadPosts(0);
      });
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
});
