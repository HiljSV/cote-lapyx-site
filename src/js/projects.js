// =============================================================================
// Projects page — loads published projects from the API
// =============================================================================

const API = "https://api.cote-lapyx.com/api/v1";
const PAGE_SIZE = 12;

let currentPage = 0;
let currentTech = "";
let currentSearch = "";
let totalPages = 1;
let searchTimer = null;

const CARD_COLORS = ["cyan", "magenta", "green"];
const TECH_COLORS = ["cyan", "magenta", "green"];

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function authorInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function buildProjectCard(project, index) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const authorName = project.author?.name || "—";
  const initials = authorInitials(project.author?.name);

  const tags = (project.technologies || [])
    .slice(0, 5)
    .map(
      (t, i) =>
        `<li><span class="neon-badge neon-badge--${TECH_COLORS[i % 3]}">${escHtml(t)}</span></li>`,
    )
    .join("");

  const githubBtn = project.githubUrl
    ? `<a href="${escHtml(project.githubUrl)}" class="btn btn--ghost btn--sm" target="_blank" rel="noopener">GitHub</a>`
    : "";
  const demoBtn = project.projectUrl
    ? `<a href="${escHtml(project.projectUrl)}" class="btn btn--${color} btn--sm" target="_blank" rel="noopener">Demo</a>`
    : "";

  const coverHtml = project.coverImage
    ? `<img class="project-card__cover" src="${escHtml(project.coverImage)}" alt="" aria-hidden="true" />`
    : `<div class="project-card__cover-placeholder" aria-hidden="true">&#9881;</div>`;

  return `<li>
    <article class="project-card project-card--${color}">
      ${coverHtml}
      <div class="project-card__body">
        <h2 class="project-card__title">${escHtml(project.title)}</h2>
        <p class="project-card__description">${escHtml(project.shortDescription || "")}</p>
        <ul class="project-card__tags" aria-label="Технології" role="list">
          ${tags}
        </ul>
      </div>
      <div class="project-card__footer">
        <div class="project-card__links">${githubBtn}${demoBtn}</div>
        <div class="project-card__author">
          <div class="project-card__author-avatar" aria-hidden="true">${initials}</div>
          ${escHtml(authorName)}
        </div>
      </div>
    </article>
  </li>`;
}

async function loadProjects(page, append = false) {
  const gridEl = document.getElementById("projects-grid");
  const loadingEl = document.getElementById("projects-loading");
  const moreWrap = document.getElementById("projects-more-wrap");
  if (!gridEl) return;

  if (loadingEl) loadingEl.removeAttribute("hidden");
  if (moreWrap) moreWrap.setAttribute("hidden", "");

  const params = new URLSearchParams({
    size: PAGE_SIZE,
    sort: "createdAt,desc",
    page,
  });
  if (currentTech) params.set("technology", currentTech);
  if (currentSearch) params.set("search", currentSearch);

  try {
    const res = await fetch(`${API}/projects?${params}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();

    const startIndex = append ? currentPage * PAGE_SIZE : 0;
    const cards = (data.content || [])
      .map((p, i) => buildProjectCard(p, startIndex + i))
      .join("");

    if (append) {
      const tmp = document.createElement("ul");
      tmp.innerHTML = cards;
      Array.from(tmp.children).forEach((li) => gridEl.appendChild(li));
    } else {
      if (loadingEl) loadingEl.setAttribute("hidden", "");
      gridEl.innerHTML =
        cards ||
        '<li class="projects-page__empty">Проектів ще немає. Зайдіть пізніше!</li>';
    }

    totalPages = data.page?.totalPages ?? 1;
    currentPage = page;

    if (loadingEl) loadingEl.setAttribute("hidden", "");
    if (moreWrap && currentPage + 1 < totalPages) {
      moreWrap.removeAttribute("hidden");
    }
  } catch (err) {
    console.error("Projects load error:", err);
    if (loadingEl) loadingEl.setAttribute("hidden", "");
    if (!append) {
      gridEl.innerHTML =
        '<li class="projects-page__empty">Не вдалося завантажити проекти.</li>';
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gridEl = document.getElementById("projects-grid");
  if (!gridEl) return;

  // Initial load
  loadProjects(0);

  // Tech filter buttons
  document.querySelectorAll("[data-filter-tech]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-filter-tech]")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentTech = btn.dataset.filterTech || "";
      loadProjects(0);
    });
  });

  // Search input (debounced 500ms)
  const searchInput = document.getElementById("projects-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentSearch = searchInput.value.trim();
        loadProjects(0);
      }, 500);
    });
  }

  // Load more button
  document
    .getElementById("projects-load-more")
    ?.addEventListener("click", () => {
      loadProjects(currentPage + 1, true);
    });
});
