import membersData from "../data/members.json";

const API = "https://api.cote-lapyx.com/api/v1";

// Social link icon map — brand names never translated
const SOCIAL_ICONS = {
  github: {
    label: "GitHub",
    btnClass: "btn--cyan",
    svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`,
  },
  linkedin: {
    label: "LinkedIn",
    btnClass: "btn--magenta",
    svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  },
  telegram: {
    label: "Telegram",
    btnClass: "btn--green",
    svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.835l-2.94-.916c-.638-.203-.65-.638.135-.943l11.49-4.43c.533-.194 1.001.13.949.675z"/></svg>`,
  },
  instagram: {
    label: "Instagram",
    btnClass: "btn--magenta",
    svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  },
  email: {
    label: "Email",
    btnClass: "btn--cyan",
    svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
  },
};

// Sanitize strings before injecting into innerHTML
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Format ISO date with locale-aware month/day names
function fmtDate(iso) {
  if (!iso) return "";
  const lang = localStorage.getItem("cl_lang") || "uk";
  return new Date(iso).toLocaleDateString(lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Return Latin displayName for non-UK locales, fall back to Cyrillic name
function resolveDisplayName(user) {
  if (!user) return "—";
  const lang = localStorage.getItem("cl_lang") || "uk";
  return lang !== "uk" && user.displayName
    ? user.displayName
    : user.name || "—";
}

// Build SVG initials placeholder when no photo is available
function buildInitialsPlaceholder(member) {
  const colorMap = { cyan: "#00e5ff", magenta: "#e040fb", green: "#39ff14" };
  const neon = colorMap[member.color] || "#00e5ff";
  return `<div class="member-hero__photo-placeholder" style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,rgba(0,229,255,0.15),rgba(57,255,20,0.15));display:flex;align-items:center;justify-content:center;font-size:clamp(32px,5vw,64px);font-weight:700;color:${neon};border:2px solid rgba(57,255,20,0.3)" aria-label="${escHtml(member.name)}">${escHtml(member.initial)}</div>`;
}

// Render photo from URL or fall back to initials placeholder
function renderPhoto(member, avatarUrl, displayName, role) {
  const wrap = document.getElementById("member-photo-wrap");
  if (!wrap) return;
  if (avatarUrl) {
    wrap.innerHTML = `<img class="member-hero__photo" src="${escHtml(avatarUrl)}" alt="${escHtml(displayName)} — ${escHtml(role)}" width="180" height="180" />`;
  } else {
    wrap.innerHTML = buildInitialsPlaceholder(member);
  }
}

// Render neon skill badges from local JSON (badges are not in API)
function renderBadges(member) {
  const el = document.getElementById("member-badges");
  if (!el) return;
  el.innerHTML = member.badges
    .map(
      (b) =>
        `<li><span class="neon-badge neon-badge--${escHtml(b.color)}">${escHtml(b.label)}</span></li>`,
    )
    .join("");
}

// Render social links from the API socialLinks object only.
// FEAT-SOCIAL (DEC-3): the API flat socialLinks is the single source of truth —
// a platform value is a URL when owner-enabled, or null when disabled/absent.
// No local-JSON fallback: that would resurrect links the owner toggled OFF.
// Supports all 5 personal platforms; email is rendered as a mailto: link.
function renderSocials(apiSocialLinks) {
  const el = document.getElementById("member-socials");
  if (!el) return;

  // Fixed platform order; values come straight from the API (null = hidden)
  const order = ["github", "linkedin", "telegram", "instagram", "email"];
  const links = order
    .map((key) => [key, apiSocialLinks?.[key] ?? null])
    .filter(([, url]) => url && url !== "#")
    .map(([key, url]) => {
      const icon = SOCIAL_ICONS[key];
      if (!icon) return "";

      let href = url;

      // Email → mailto: link (stays in same tab); bare address gets the scheme
      if (key === "email") {
        href = url.startsWith("mailto:") ? url : `mailto:${url}`;
        return `<a href="${escHtml(href)}" class="btn ${escHtml(icon.btnClass)}" aria-label="${escHtml(icon.label)}">${icon.svg} ${escHtml(icon.label)}</a>`;
      }

      // Normalize a bare telegram handle (@handle / handle) to a full t.me URL,
      // otherwise the browser treats it as a relative path.
      if (key === "telegram" && !/^https?:\/\//.test(href)) {
        href = "https://t.me/" + href.replace(/^@/, "");
      }

      return `<a href="${escHtml(href)}" class="btn ${escHtml(icon.btnClass)}" target="_blank" rel="noopener" aria-label="${escHtml(icon.label)}">${icon.svg} ${escHtml(icon.label)}</a>`;
    })
    .join("");
  el.innerHTML = links;
}

// Render skill bars from local JSON (skills are not exposed in API)
function renderSkills(member) {
  const el = document.getElementById("member-skills");
  if (!el) return;
  const colorMap = {
    cyan: "",
    magenta: "skill-bar__fill--magenta",
    green: "skill-bar__fill--green",
  };
  el.innerHTML = Object.entries(member.skills)
    .map(([groupName, bars]) => {
      const barsHtml = bars
        .map(
          (s) => `<div class="skill-bar">
            <div class="skill-bar__label"><span>${escHtml(s.label)}</span><span>${escHtml(String(s.pct))}%</span></div>
            <div class="skill-bar__track"><div class="skill-bar__fill ${colorMap[s.color] || ""}" style="width:${escHtml(String(s.pct))}%"></div></div>
          </div>`,
        )
        .join("");
      return `<div class="member-skills__group">
        <h3 class="member-skills__group-title">${escHtml(groupName)}</h3>
        <div class="member-skills__bars">${barsHtml}</div>
      </div>`;
    })
    .join("");
}

// Render project cards from API response (ProjectDTO list).
// Uses the same .project-card BEM structure as renderProjects().
// Maps API fields: shortDescription, projectUrl/githubUrl, technologies array.
// Falls back to local JSON data via renderProjects() if API call fails.
function renderProjectsFromApi(projects) {
  const el = document.getElementById("member-projects");
  if (!el) return;

  // Empty state — no API projects for this member
  if (!projects.length) {
    el.innerHTML = '<p class="member-projects__empty">Немає проектів.</p>';
    return;
  }

  el.innerHTML = projects
    .map((p) => {
      // Technologies from API are plain strings — render as cyan neon badges
      const tagsHtml = (p.technologies || [])
        .map(
          (t) =>
            `<li><span class="neon-badge neon-badge--cyan">${escHtml(t)}</span></li>`,
        )
        .join("");

      // GitHub link — optional
      const githubLink = p.githubUrl
        ? `<a href="${escHtml(p.githubUrl)}" class="btn btn--ghost btn--sm" target="_blank" rel="noopener">GitHub</a>`
        : "";

      // Demo link — prefer projectUrl, fall back to project detail page by slug
      const demoHref = p.projectUrl
        ? p.projectUrl
        : `project.html?slug=${encodeURIComponent(p.slug)}`;
      const demoLink = `<a href="${escHtml(demoHref)}" class="btn btn--cyan btn--sm" target="_blank" rel="noopener">Demo</a>`;

      // shortDescription from API (locale-aware, already translated by backend)
      const desc = p.shortDescription || "";

      return `<li>
        <article class="project-card project-card--cyan">
          <div class="project-card__cover-placeholder" aria-hidden="true">&lt;/&gt;</div>
          <div class="project-card__body">
            <h3 class="project-card__title">${escHtml(p.title)}</h3>
            <p class="project-card__description">${escHtml(desc)}</p>
            <ul class="project-card__tags" aria-label="Технології" role="list">${tagsHtml}</ul>
          </div>
          <div class="project-card__footer">
            <div class="project-card__links">${githubLink}${demoLink}</div>
          </div>
        </article>
      </li>`;
    })
    .join("");
}

// Render project cards from local JSON (projects not yet in member API)
function renderProjects(member) {
  const el = document.getElementById("member-projects");
  if (!el) return;
  const lang = localStorage.getItem("cl_lang") || "uk";
  el.innerHTML = member.projects
    .map((p) => {
      // Use English description for non-UK locales when available
      const desc =
        lang !== "uk" && p.descriptionEn ? p.descriptionEn : p.description;
      const tagsHtml = p.tags
        .map(
          (t) =>
            `<li><span class="neon-badge neon-badge--${escHtml(t.color)}">${escHtml(t.label)}</span></li>`,
        )
        .join("");
      const githubLink = p.links.github
        ? `<a href="${escHtml(p.links.github)}" class="btn btn--ghost btn--sm" target="_blank" rel="noopener">GitHub</a>`
        : "";
      const demoLink = p.links.demo
        ? `<a href="${escHtml(p.links.demo)}" class="btn btn--${escHtml(p.color)} btn--sm" target="_blank" rel="noopener">Demo</a>`
        : "";
      return `<li>
        <article class="project-card project-card--${escHtml(p.color)}">
          <div class="project-card__cover-placeholder" aria-hidden="true">&lt;/&gt;</div>
          <div class="project-card__body">
            <h3 class="project-card__title">${escHtml(p.title)}</h3>
            <p class="project-card__description">${escHtml(desc)}</p>
            <ul class="project-card__tags" aria-label="Технології" role="list">${tagsHtml}</ul>
          </div>
          <div class="project-card__footer">
            <div class="project-card__links">${githubLink}${demoLink}</div>
          </div>
        </article>
      </li>`;
    })
    .join("");
}

// Render posts list from API response (locale-aware titles and dates)
function renderPosts(posts) {
  const el = document.getElementById("member-posts");
  if (!el) return;
  if (!posts.length) {
    el.innerHTML = '<p class="member-posts__empty">Поки немає статей.</p>';
    return;
  }
  el.innerHTML = posts
    .map((p) => {
      const date = p.publishedAt || p.createdAt;
      const href = p.slug
        ? `post.html?slug=${encodeURIComponent(p.slug)}`
        : "#";
      return `<a href="${escHtml(href)}" class="member-posts__item">
        <time class="member-posts__date" datetime="${escHtml(date || "")}">${escHtml(fmtDate(date))}</time>
        <span class="member-posts__title">${escHtml(p.title || "")}</span>
        <span class="member-posts__arrow" aria-hidden="true">→</span>
      </a>`;
    })
    .join("");
}

// =============================================================================
// API hydration — fetches member + posts with locale; re-runs on lang change
// =============================================================================
async function hydrateFromApi(memberId, member) {
  const lang = localStorage.getItem("cl_lang") || "uk";

  try {
    // GET /api/v1/team-members/{slug} — public; locale for translated content
    const res = await fetch(
      `${API}/team-members/${encodeURIComponent(memberId)}?locale=${lang}`,
    );
    if (!res.ok) return;
    const data = await res.json();

    // Resolve locale-aware display name
    const displayName = resolveDisplayName(data.user);
    const profession = data.profession || member.role;
    // Use translated shortDescription for non-UK locales; fall back to Cyrillic bio
    const bio =
      lang !== "uk" && data.shortDescription
        ? data.shortDescription
        : data.user?.bio || member.bio;
    const avatarUrl = data.user?.avatar || null;

    // Update name, role (profession), bio DOM elements
    const nameEl = document.getElementById("member-name");
    const roleEl = document.getElementById("member-role");
    const bioEl = document.getElementById("member-bio");
    if (nameEl) nameEl.textContent = displayName;
    if (roleEl) roleEl.textContent = profession;
    if (bioEl) bioEl.textContent = bio;

    // Update photo with API avatar
    renderPhoto(member, avatarUrl, displayName, profession);

    // Render personal socials from the API only (enabled-only; source of truth)
    renderSocials(data.user?.socialLinks);

    // Update page title and OG tags with resolved name
    document.title = `${displayName} — cote-lapyx`;
    const ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle)
      ogTitle.setAttribute(
        "content",
        `${displayName} — ${profession} | COTE-LAPYX`,
      );
    const ogImg = document.querySelector("meta[property='og:image']");
    if (ogImg && avatarUrl) ogImg.setAttribute("content", avatarUrl);

    // Fix #2 — Load posts filtered by this member's userId.
    // TeamMemberDTO.userId is marked `required` in the API contract and is always
    // present. The fallback to data.user?.id guards against future API changes
    // or partial responses where the top-level field might be missing.
    const userId = data.userId || data.user?.id;
    if (userId) {
      await hydratePosts(userId, lang);
      // Fix #3 — Load projects from real API (replaces local JSON placeholder data)
      await hydrateProjects(userId, lang);
    }
  } catch (_) {
    // API unreachable — static data from local JSON remains visible
  }
}

// Fetch and render the member's blog posts with locale-aware titles
async function hydratePosts(userId, lang) {
  try {
    // GET /api/v1/posts filtered by authorId — locale ensures translated titles
    const res = await fetch(
      `${API}/posts?size=10&sort=publishedAt,desc&authorId=${userId}&locale=${lang}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    renderPosts(data.content || []);
  } catch (_) {
    // Silently fail — posts section stays empty rather than showing stale data
  }
}

// Fetch and render the member's portfolio projects from the real API.
// On success, overwrites the local JSON placeholder rendered by renderProjects().
// On failure, silently keeps the local JSON data visible (already rendered).
async function hydrateProjects(userId, lang) {
  try {
    // GET /api/v1/projects — public endpoint; authorId filters by member; locale for translated content
    const res = await fetch(
      `${API}/projects?size=10&sort=createdAt,desc&authorId=${userId}&locale=${lang}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    // Replace local JSON placeholder with real API data
    renderProjectsFromApi(data.content || []);
  } catch (_) {
    // Silently fail — local JSON placeholder rendered by renderProjects() stays visible
  }
}

// =============================================================================
// DOMContentLoaded — initial render from local JSON, then hydrate from API
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Guard: only run on member.html
  if (!document.getElementById("member-photo-wrap")) return;

  const params = new URLSearchParams(window.location.search);
  const memberId = params.get("id") || "valeriia";

  const member = membersData.find((m) => m.id === memberId);
  if (!member) {
    window.location.href = "team.html";
    return;
  }

  // Initial render from local JSON — visible immediately, then overwritten by API
  const nameEl = document.getElementById("member-name");
  const roleEl = document.getElementById("member-role");
  const bioEl = document.getElementById("member-bio");
  if (nameEl) nameEl.textContent = member.name;
  if (roleEl) roleEl.textContent = member.role;
  if (bioEl) bioEl.textContent = member.bio;

  renderPhoto(member, null, member.name, member.role);
  renderBadges(member);
  // Socials are API-only (FEAT-SOCIAL): render empty until the API responds with
  // the enabled-only set — never seed from local JSON (would bypass the toggle).
  renderSocials(null);
  renderSkills(member);
  renderProjects(member);

  // Inject SEO tags based on local data (overwritten by API when avatar resolves)
  const canonical = `https://cote-lapyx.com/member.html?id=${encodeURIComponent(memberId)}`;
  let canonEl = document.querySelector("link[rel='canonical']");
  if (!canonEl) {
    canonEl = document.createElement("link");
    canonEl.rel = "canonical";
    document.head.appendChild(canonEl);
  }
  canonEl.href = canonical;

  const descEl = document.querySelector("meta[name='description']");
  if (descEl)
    descEl.content =
      `${member.name} — ${member.role} в команді COTE-LAPYX. ${(member.bio || "").slice(0, 80)}`.slice(
        0,
        155,
      );

  // Hydrate from API (name, role, bio, avatar, posts) with current locale
  hydrateFromApi(memberId, member);

  // Re-hydrate on language switch — name, bio, posts titles, project descriptions update.
  // renderProjects(member) is intentionally omitted here: hydrateFromApi already calls
  // hydrateProjects() which overwrites the DOM with locale-translated API data.
  // Showing local JSON first and then immediately overwriting with API data would cause
  // a visible flash. hydrateFromApi handles the full re-render on language change.
  document.addEventListener("cl:languagechange", () => {
    hydrateFromApi(memberId, member);
  });
});
