// =============================================================================
// Project detail page — fetches a single project by slug from the API
// =============================================================================

// Import translate() for runtime i18n lookups on dynamically rendered strings
import { translate } from "@js/i18n.js";

const API = "https://api.cote-lapyx.com/api/v1";

// Status CSS class map — keys match API enum values
const STATUS_CLASS = {
  PUBLISHED: "published",
  DRAFT: "draft",
  ARCHIVED: "archived",
};

// Return the translated label for a project status enum value
function getStatusLabel(status) {
  const map = {
    PUBLISHED: translate("project.status.published"),
    DRAFT: translate("project.status.draft"),
    ARCHIVED: translate("project.status.archived"),
  };
  return map[status] || status;
}

// Sanitize user-controlled strings before injecting into innerHTML
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Format ISO date string using the current UI language locale
function fmtDate(iso) {
  if (!iso) return "";
  // Read active language from localStorage — same pattern as blog.js
  const lang = localStorage.getItem("cl_lang") || "en";
  return new Date(iso).toLocaleDateString(lang, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Build author initials (first letter of first + last name, or first two chars)
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
  const lang = localStorage.getItem("cl_lang") || "en";
  return lang !== "uk" && author.displayName
    ? author.displayName
    : author.name || "—";
}

// Show the "project not found" state — hides content, reveals fallback block
function showNotFound() {
  const contentSection = document.querySelector(".project-detail-section");
  const notFound = document.getElementById("project-not-found");
  const titleEl = document.getElementById("project-title");
  // Use translated string instead of hardcoded Ukrainian
  if (titleEl) titleEl.textContent = translate("project.not_found");
  if (contentSection) contentSection.setAttribute("hidden", "");
  if (notFound) notFound.removeAttribute("hidden");
}

// =============================================================================
// Main project loader — runs on DOMContentLoaded, fetches project by slug
// =============================================================================
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
    // Read current UI language so the backend returns translated project content
    const lang = localStorage.getItem("cl_lang") || "en";
    // GET /api/v1/projects/{slug} — public endpoint, no auth needed; locale passed for translations
    const res = await fetch(
      `${API}/projects/${encodeURIComponent(slug)}?locale=${lang}`,
    );
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

    // Status badge — translated label + CSS modifier class
    const statusEl = document.getElementById("project-status-badge");
    if (statusEl && project.status) {
      const cls = STATUS_CLASS[project.status] || "draft";
      // Use function instead of static map so label updates with language
      const label = getStatusLabel(project.status);
      statusEl.className = `project-detail-hero__status dash-status dash-status--${cls}`;
      statusEl.textContent = label;
    }

    // Author block — avatar image or initials fallback
    const authorEl = document.getElementById("project-author-block");
    if (authorEl && project.author?.name) {
      const avatarInner = project.author.avatar
        ? `<img src="${escHtml(project.author.avatar)}" alt="" aria-hidden="true" />`
        : escHtml(authorInitials(project.author.name));
      authorEl.innerHTML = `
        <div class="post-hero__author-avatar" aria-hidden="true">${avatarInner}</div>
        <span class="post-hero__author-name">${escHtml(authorDisplayName(project.author))}</span>`;
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

    // Cover image — unhide wrapper when image is present
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
        contentEl.innerHTML = `<p class="post-article__loading">${translate("project.no_description")}</p>`;
      }
    }

    // Technologies sidebar — badge list with cycling neon colors
    const techEl = document.getElementById("project-tech");
    const TECH_COLORS = ["cyan", "magenta", "green"];
    if (techEl && project.technologies?.length > 0) {
      const tagsHtml = project.technologies
        .map(
          (t, i) =>
            `<span class="neon-badge neon-badge--${TECH_COLORS[i % 3]}">${escHtml(t)}</span>`,
        )
        .join("");
      // Preserve existing h2 title element if present, fall back to translated string
      const titleEl2 = techEl.querySelector(".project-detail__tech-title");
      techEl.innerHTML =
        (titleEl2?.outerHTML ||
          `<h2 class="project-detail__tech-title">${escHtml(translate("projects.tech_title"))}</h2>`) +
        tagsHtml;
    }

    // Meta sidebar (date, author link) — translated labels
    const metaEl = document.getElementById("project-meta-block");
    if (metaEl) {
      const rows = [];
      // Translated "Date" and "Author" labels instead of hardcoded Ukrainian
      if (dateIso)
        rows.push(
          `<dt>${escHtml(translate("project.meta.date"))}</dt><dd>${fmtDate(dateIso)}</dd>`,
        );
      if (project.author?.name)
        rows.push(
          `<dt>${escHtml(translate("project.meta.author"))}</dt><dd>${escHtml(authorDisplayName(project.author))}</dd>`,
        );
      if (rows.length > 0) {
        metaEl.innerHTML = `<dl class="project-detail__meta-dl">${rows.join("")}</dl>`;
      }
    }
  } catch {
    showNotFound();
  }

  // ── Language switch listener — re-renders translated project content on lang change ──
  document.addEventListener("cl:languagechange", async () => {
    // Only act when we are on the project page
    if (!document.getElementById("project-content")) return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) return;
    const lang = localStorage.getItem("cl_lang") || "en";
    try {
      // Fetch project again with new locale — public endpoint, no auth needed
      const res = await fetch(
        `${API}/projects/${encodeURIComponent(slug)}?locale=${lang}`,
      );
      if (!res.ok) return;
      const project = await res.json();

      // Update title
      const titleEl = document.getElementById("project-title");
      if (titleEl) titleEl.textContent = project.title;

      // Update short description subtitle
      const descEl = document.getElementById("project-short-desc");
      if (descEl) descEl.textContent = project.shortDescription || "";

      // Update status badge label with new language
      const statusEl = document.getElementById("project-status-badge");
      if (statusEl && project.status) {
        statusEl.textContent = getStatusLabel(project.status);
      }

      // Update author block — name uses locale-aware displayName
      const authorEl = document.getElementById("project-author-block");
      if (authorEl && project.author?.name) {
        const avatarInner = project.author.avatar
          ? `<img src="${escHtml(project.author.avatar)}" alt="" aria-hidden="true" />`
          : escHtml(authorInitials(project.author.name));
        authorEl.innerHTML = `
          <div class="post-hero__author-avatar" aria-hidden="true">${avatarInner}</div>
          <span class="post-hero__author-name">${escHtml(authorDisplayName(project.author))}</span>`;
      }

      // Update content area
      const contentEl = document.getElementById("project-content");
      if (contentEl) {
        if (project.content) contentEl.innerHTML = project.content;
        else if (project.description) contentEl.innerHTML = project.description;
        else if (project.shortDescription)
          contentEl.innerHTML = `<p>${escHtml(project.shortDescription)}</p>`;
      }

      // Update meta sidebar with translated labels and locale-aware author name
      const metaEl = document.getElementById("project-meta-block");
      if (metaEl) {
        const rows = [];
        if (project.createdAt)
          rows.push(
            `<dt>${escHtml(translate("project.meta.date"))}</dt><dd>${fmtDate(project.createdAt)}</dd>`,
          );
        if (project.author?.name)
          rows.push(
            `<dt>${escHtml(translate("project.meta.author"))}</dt><dd>${escHtml(authorDisplayName(project.author))}</dd>`,
          );
        if (rows.length > 0) {
          metaEl.innerHTML = `<dl class="project-detail__meta-dl">${rows.join("")}</dl>`;
        }
      }
    } catch {
      /* silent — best-effort language reload */
    }
  });
});
