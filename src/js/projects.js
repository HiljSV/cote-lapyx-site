// =============================================================================
// Projects page — loads published projects from the API
// =============================================================================

import { translate } from "@js/i18n.js";

const API = "https://api.cote-lapyx.com/api/v1";
const PAGE_SIZE = 12;

let currentPage = 0;
let currentTech = "";
let currentSearch = "";
let totalPages = 1;
let searchTimer = null;

const CARD_COLORS = ["cyan", "magenta", "green"];
const TECH_COLORS = ["cyan", "magenta", "green"];

// userId → team member slug, populated by initMemberSlugs() before first render
const memberSlugMap = new Map();

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

// Return Latin displayName for non-UK locales, fall back to Cyrillic name
function authorDisplayName(author) {
  if (!author) return "—";
  const lang = localStorage.getItem("cl_lang") || "uk";
  return lang !== "uk" && author.displayName
    ? author.displayName
    : author.name || "—";
}

// Fetches /api/v1/team-members and builds a userId→slug lookup map.
// Must complete before buildProjectCard is called so author links resolve correctly.
async function initMemberSlugs() {
  try {
    const res = await fetch(`${API}/team-members`);
    if (!res.ok) return;
    const members = await res.json();
    // Populate map: userId → slug for member profile links
    members.forEach((m) => {
      if (m.userId && m.slug) memberSlugMap.set(m.userId, m.slug);
    });
  } catch (_) {
    // Silently fail — author blocks fall back to plain div without link
  }
}

function buildProjectCard(project, index) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const authorName = authorDisplayName(project.author);
  const initials = authorInitials(project.author?.name);
  const authorAvatarInner = project.author?.avatar
    ? `<img src="${escHtml(project.author.avatar)}" alt="" aria-hidden="true" />`
    : escHtml(initials);

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
        <ul class="project-card__tags" aria-label="${translate("projects.tech_label")}" role="list">
          ${tags}
        </ul>
      </div>
      <div class="project-card__footer">
        <div class="project-card__links">
          ${project.slug ? `<a href="project.html?slug=${encodeURIComponent(project.slug)}" class="btn btn--ghost btn--sm">${translate("btn.learn_more")}</a>` : ""}
          ${githubBtn}${demoBtn}
        </div>
        ${
          /* Author block: link to member profile if slug is known, plain div otherwise */
          (() => {
            const slug =
              project.author?.id != null
                ? memberSlugMap.get(project.author.id)
                : null;
            const inner = `<div class="project-card__author-avatar" aria-hidden="true">${authorAvatarInner}</div>${escHtml(authorName)}`;
            return slug
              ? `<a href="member.html?id=${encodeURIComponent(slug)}" class="project-card__author" aria-label="Профіль ${escHtml(authorName)}">${inner}</a>`
              : `<div class="project-card__author">${inner}</div>`;
          })()
        }
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

  // Read current UI language so the backend returns translated project content
  const lang = localStorage.getItem("cl_lang") || "uk";
  params.set("locale", lang);

  try {
    // GET /api/v1/projects — public endpoint, no auth needed; locale passed for translations
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
        `<li class="projects-page__empty">${translate("projects.empty")}</li>`;
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
      gridEl.innerHTML = `<li class="projects-page__empty">${translate("projects.error_load")}</li>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const gridEl = document.getElementById("projects-grid");
  if (!gridEl) return;

  // Pre-fetch member slugs before rendering so author links are ready on first load
  await initMemberSlugs();

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

  // Re-render cards when user switches language so btn labels and text update
  document.addEventListener("cl:languagechange", () => {
    currentPage = 0;
    loadProjects(0);
  });
});
