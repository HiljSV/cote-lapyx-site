// =============================================================================
// Post detail page — fetches a single post by slug from the API
// =============================================================================

const API = "https://api.cote-lapyx.com/api/v1";

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

function showNotFound() {
  const main = document.getElementById("post-main");
  const article = document.querySelector(".post-article");
  const tagsSection = document.getElementById("post-tags-section");
  const notFound = document.getElementById("post-not-found");
  const titleEl = document.getElementById("post-title");
  if (titleEl) titleEl.textContent = "Статтю не знайдено";
  if (article) article.setAttribute("hidden", "");
  if (tagsSection) tagsSection.setAttribute("hidden", "");
  if (notFound) notFound.removeAttribute("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  // Guard: only run on post.html (bundle mode sends all JS to every page)
  if (!document.getElementById("post-main")) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) {
    window.location.href = "blog.html";
    return;
  }

  try {
    const res = await fetch(`${API}/posts/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      showNotFound();
      return;
    }
    const post = await res.json();

    document.title = `${post.title} — cote-lapyx`;

    // Title + meta
    const titleEl = document.getElementById("post-title");
    if (titleEl) titleEl.textContent = post.title;

    const dateEl = document.getElementById("post-date");
    const dateIso = post.publishedAt || post.createdAt;
    if (dateEl) {
      dateEl.textContent = fmtDate(dateIso);
      if (dateIso) dateEl.setAttribute("datetime", dateIso);
    }

    const catEl = document.getElementById("post-category");
    const catName =
      post.categories?.length > 0 ? post.categories[0].name : "Загальне";
    if (catEl) catEl.textContent = catName;

    // Author
    const authorEl = document.getElementById("post-author-block");
    if (authorEl && post.author?.name) {
      const initials = authorInitials(post.author.name);
      authorEl.innerHTML = `
        <div class="post-hero__author-avatar" aria-hidden="true">${escHtml(initials)}</div>
        <span class="post-hero__author-name">${escHtml(post.author.name)}</span>`;
    }

    // Cover image
    if (post.coverImage) {
      const coverWrap = document.getElementById("post-cover-wrap");
      if (coverWrap) {
        coverWrap.innerHTML = `<img class="post-cover__img" src="${escHtml(post.coverImage)}" alt="${escHtml(post.title)}" />`;
        coverWrap.removeAttribute("hidden");
      }
    }

    // Content — backend provides HTML in the `content` field
    const contentEl = document.getElementById("post-content");
    if (contentEl) {
      if (post.content) {
        // Content is trusted HTML from our own backend — safe to inject
        contentEl.innerHTML = post.content;
      } else if (post.excerpt) {
        contentEl.innerHTML = `<p>${escHtml(post.excerpt)}</p>`;
      } else {
        contentEl.innerHTML =
          '<p class="post-article__loading">Зміст відсутній.</p>';
      }
    }

    // Tags
    if (post.tags?.length > 0) {
      const tagsEl = document.getElementById("post-tags");
      const tagsSection = document.getElementById("post-tags-section");
      if (tagsEl) {
        tagsEl.innerHTML = post.tags
          .map(
            (t) =>
              `<li><span class="neon-badge neon-badge--cyan">${escHtml(t.name || t)}</span></li>`,
          )
          .join("");
      }
      if (tagsSection) tagsSection.removeAttribute("hidden");
    }
  } catch {
    showNotFound();
  }
});
