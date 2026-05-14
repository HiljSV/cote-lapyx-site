// =============================================================================
// Project detail page — fetches a single project by slug from the API
// =============================================================================

const API = "https://api.cote-lapyx.com/api/v1";

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
  const contentSection = document.querySelector(".project-detail-section");
  const notFound = document.getElementById("project-not-found");
  const titleEl = document.getElementById("project-title");
  if (titleEl) titleEl.textContent = "Проект не знайдено";
  if (contentSection) contentSection.setAttribute("hidden", "");
  if (notFound) notFound.removeAttribute("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  // Guard: only run on project.html (bundle mode sends all JS to every page)
  if (!document.getElementById("project-content")) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) {
    window.location.href = "projects.html";
    return;
  }

  try {
    const res = await fetch(`${API}/projects/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      showNotFound();
      return;
    }
    const project = await res.json();

    document.title = `${project.title} — cote-lapyx`;

    // Title + short description
    const titleEl = document.getElementById("project-title");
    if (titleEl) titleEl.textContent = project.title;

    const descEl = document.getElementById("project-short-desc");
    if (descEl) descEl.textContent = project.shortDescription || "";

    // Date
    const dateEl = document.getElementById("project-date");
    const dateIso = project.createdAt;
    if (dateEl && dateIso) {
      dateEl.textContent = fmtDate(dateIso);
      dateEl.setAttribute("datetime", dateIso);
    }

    // Status badge
    const statusEl = document.getElementById("project-status-badge");
    if (statusEl && project.status) {
      const cls = STATUS_CLASS[project.status] || "draft";
      const label = STATUS_LABEL[project.status] || project.status;
      statusEl.className = `project-detail-hero__status dash-status dash-status--${cls}`;
      statusEl.textContent = label;
    }

    // Author
    const authorEl = document.getElementById("project-author-block");
    if (authorEl && project.author?.name) {
      const avatarInner = project.author.avatar
        ? `<img src="${escHtml(project.author.avatar)}" alt="" aria-hidden="true" />`
        : escHtml(authorInitials(project.author.name));
      authorEl.innerHTML = `
        <div class="post-hero__author-avatar" aria-hidden="true">${avatarInner}</div>
        <span class="post-hero__author-name">${escHtml(project.author.name)}</span>`;
    }

    // Links (GitHub / Demo)
    const linksEl = document.getElementById("project-links");
    if (linksEl) {
      const githubBtn = project.githubUrl
        ? `<a href="${escHtml(project.githubUrl)}" class="btn btn--ghost" target="_blank" rel="noopener">GitHub</a>`
        : "";
      const demoBtn = project.projectUrl
        ? `<a href="${escHtml(project.projectUrl)}" class="btn btn--cyan" target="_blank" rel="noopener">Demo</a>`
        : "";
      linksEl.innerHTML = githubBtn + demoBtn;
    }

    // Cover image
    if (project.coverImage) {
      const coverWrap = document.getElementById("project-cover-wrap");
      if (coverWrap) {
        coverWrap.innerHTML = `<img class="post-cover__img" src="${escHtml(project.coverImage)}" alt="${escHtml(project.title)}" />`;
        coverWrap.removeAttribute("hidden");
      }
    }

    // Content (description / full content)
    const contentEl = document.getElementById("project-content");
    if (contentEl) {
      if (project.content) {
        // Content is trusted HTML from our own backend
        contentEl.innerHTML = project.content;
      } else if (project.description) {
        contentEl.innerHTML = project.description;
      } else if (project.shortDescription) {
        contentEl.innerHTML = `<p>${escHtml(project.shortDescription)}</p>`;
      } else {
        contentEl.innerHTML =
          '<p class="post-article__loading">Опис відсутній.</p>';
      }
    }

    // Technologies sidebar
    const techEl = document.getElementById("project-tech");
    const TECH_COLORS = ["cyan", "magenta", "green"];
    if (techEl && project.technologies?.length > 0) {
      const tagsHtml = project.technologies
        .map(
          (t, i) =>
            `<span class="neon-badge neon-badge--${TECH_COLORS[i % 3]}">${escHtml(t)}</span>`,
        )
        .join("");
      const titleEl2 = techEl.querySelector(".project-detail__tech-title");
      techEl.innerHTML =
        (titleEl2?.outerHTML ||
          '<h2 class="project-detail__tech-title">Технології</h2>') + tagsHtml;
    }

    // Meta sidebar (date, author link)
    const metaEl = document.getElementById("project-meta-block");
    if (metaEl) {
      const rows = [];
      if (dateIso) rows.push(`<dt>Дата</dt><dd>${fmtDate(dateIso)}</dd>`);
      if (project.author?.name)
        rows.push(`<dt>Автор</dt><dd>${escHtml(project.author.name)}</dd>`);
      if (rows.length > 0) {
        metaEl.innerHTML = `<dl class="project-detail__meta-dl">${rows.join("")}</dl>`;
      }
    }
  } catch {
    showNotFound();
  }
});
