// =============================================================================
// Test fixtures — verbatim COPIES of pure helper functions that live inside
// blog.js / projects.js / dashboard.js. Because the production modules attach
// `DOMContentLoaded` listeners at import-time and do NOT export their helpers,
// we duplicate the logic here so unit tests stay isolated and side-effect free.
//
// IMPORTANT: When the production helpers change, update the copies below.
// (The audit task explicitly authorised this duplication approach.)
// =============================================================================

// ---------- from src/js/blog.js + src/js/projects.js -------------------------

// Escapes the 4 most dangerous HTML chars. NB: the production code does NOT
// escape `'` (single quote) — tests must match that behaviour, not "ideal" XSS
// hardening.
export function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// blog.js variant: returns "" for nullish / falsy iso. dashboard.js returns "—"
// for the same case — both are tested separately below.
export function fmtDateBlog(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// dashboard.js variant — returns em-dash for nullish input.
export function fmtDateDash(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function authorInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

// ---------- from src/js/blog.js (buildBlogCard) ------------------------------

export function buildBlogCard(post) {
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
          <time class="blog-card__date">${fmtDateBlog(date)}</time>
        </div>
      </div>
    </article>
  </li>`;
}

// ---------- from src/js/dashboard.js (postListRowHtml + projectListRowHtml) --

const STATUS_LABEL = {
  PUBLISHED: "Опубліковано",
  DRAFT: "Чернетка",
  ARCHIVED: "Архів",
};
const STATUS_CLASS = {
  PUBLISHED: "published",
  DRAFT: "draft",
  ARCHIVED: "archived",
};
const TYPE_BADGE = {
  GENERAL: ["cyan", "Загальне"],
  PERSONAL: ["magenta", "Особисте"],
};
const TECH_COLORS = ["cyan", "magenta", "green"];

export function postListRowHtml(post) {
  const [badgeColor, typeLabel] = TYPE_BADGE[post.type] || ["cyan", post.type];
  const sClass = STATUS_CLASS[post.status] || "draft";
  const sLabel = STATUS_LABEL[post.status] || post.status;
  return `<div class="dash-list__row" data-slug="${escHtml(post.slug)}">
      <div class="dash-list__title" data-label="Заголовок">${escHtml(post.title)}</div>
      <div data-label="Категорія"><span class="neon-badge neon-badge--${badgeColor}">${typeLabel}</span></div>
      <div class="dash-list__date" data-label="Дата">${fmtDateDash(post.createdAt)}</div>
      <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="Дії">
        <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-slug="${escHtml(post.slug)}">Редагувати</button>
        <button type="button" class="btn btn--magenta btn--sm" data-action="delete" data-slug="${escHtml(post.slug)}" data-title="${escHtml(post.title)}">Видалити</button>
      </div>
    </div>`;
}

export function projectListRowHtml(project) {
  const techs = (project.technologies || [])
    .slice(0, 3)
    .map(
      (t, i) =>
        `<span class="neon-badge neon-badge--${TECH_COLORS[i % 3]}">${escHtml(t)}</span>`,
    )
    .join("");
  const sClass = STATUS_CLASS[project.status] || "draft";
  const sLabel = STATUS_LABEL[project.status] || project.status;
  return `<div class="dash-list__row" data-slug="${escHtml(project.slug)}">
      <div class="dash-list__title" data-label="Назва">${escHtml(project.title)}</div>
      <div class="dash-list__tech" data-label="Технології">${techs || "—"}</div>
      <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="Дії">
        <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-slug="${escHtml(project.slug)}">Редагувати</button>
        <button type="button" class="btn btn--magenta btn--sm" data-action="delete" data-slug="${escHtml(project.slug)}" data-title="${escHtml(project.title)}">Видалити</button>
      </div>
    </div>`;
}
