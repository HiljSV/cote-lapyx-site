// =============================================================================
// team.js — Hydrate team member data from API (avatar, name, role, bio, socials)
// Runs on every page that has img[data-member-slug] or [data-member-socials]:
//   team.html (.team-card), about.html (.about-member), index.html team section.
// Falls back gracefully when API is unreachable or member has no avatar.
// =============================================================================

// Module-level cache — maps locale string → members array.
// Prevents duplicate /team-members requests when hydrateTeamAvatars()
// is called multiple times for the same locale (П11 fix).
const _membersCache = {};

// -----------------------------------------------------------------------------
// SOCIAL_ICONS — SVG icon strings keyed by platform name (lowercase).
// Used to render personal social link icons inside team cards.
// Matches the icons used in member.js for visual consistency.
// -----------------------------------------------------------------------------
const PERSONAL_SOCIAL_ICONS = {
  // GitHub mark
  github: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`,
  // LinkedIn mark
  linkedin: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  // Telegram mark
  telegram: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.835l-2.94-.916c-.638-.203-.65-.638.135-.943l11.49-4.43c.533-.194 1.001.13.949.675z"/></svg>`,
  // Instagram mark
  instagram: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  // Email envelope
  email: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
};

// Platform display labels — used for aria-label text
const PERSONAL_PLATFORM_LABELS = {
  github: "GitHub",
  linkedin: "LinkedIn",
  telegram: "Telegram",
  instagram: "Instagram",
  email: "Email",
};

// -----------------------------------------------------------------------------
// escHtml — sanitize strings before injecting into innerHTML.
// Prevents XSS when rendering member names or URLs in DOM.
// -----------------------------------------------------------------------------
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// -----------------------------------------------------------------------------
// renderMemberSocials — populate a [data-member-socials] container with
// icon anchors from the public flat socialLinks shape:
//   { telegram: "url|null", instagram: "url|null", linkedin: "url|null",
//     github: "url|null", email: "url|null" }
// Only renders platforms where the value is non-null (owner-enabled).
// No URL → no icon; no placeholder # links.
// @param {Element} container — the [data-member-socials] DOM element
// @param {Object} socialLinks — flat socialLinks from member.user.socialLinks
// -----------------------------------------------------------------------------
function renderMemberSocials(container, socialLinks) {
  // Guard: container or links missing
  if (!container || !socialLinks) return;

  // Build icon anchors for all non-null platform values
  const html = Object.entries(socialLinks)
    .filter(([, url]) => url !== null && url !== undefined && url !== "")
    .map(([platform, url]) => {
      const icon = PERSONAL_SOCIAL_ICONS[platform];
      if (!icon) return ""; // unknown platform — skip

      // Normalize telegram handle to full URL if needed
      let href = url;
      if (platform === "telegram" && !/^https?:\/\//.test(href)) {
        href = "https://t.me/" + href.replace(/^@/, "");
      }

      // Normalize email to mailto: href
      if (platform === "email" && !href.startsWith("mailto:")) {
        href = "mailto:" + href;
      }

      const label = escHtml(PERSONAL_PLATFORM_LABELS[platform] || platform);
      const isExternal = !href.startsWith("mailto:");
      const externalAttrs = isExternal
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";

      return `<a href="${escHtml(href)}" class="team-card__social-link" aria-label="${label}"${externalAttrs}>${icon}</a>`;
    })
    .join("");

  // Set inner HTML — empty string leaves the container empty (no broken # links)
  container.innerHTML = html;
}

// Named so it can be re-called on cl:languagechange without page reload
async function hydrateTeamAvatars() {
  try {
    // Read current UI language so the backend returns translated member content
    const lang = localStorage.getItem("cl_lang") || "uk";

    let members;
    if (_membersCache[lang]) {
      // Cache hit — reuse previously fetched data, skip network request
      members = _membersCache[lang];
    } else {
      // Cache miss — GET /api/v1/team-members; locale passed for translations
      const res = await fetch(
        `https://api.cote-lapyx.com/api/v1/team-members?locale=${lang}`,
      );
      if (!res.ok) return;
      members = await res.json();
      // Store in module cache keyed by locale
      _membersCache[lang] = members;
    }

    members.forEach((member) => {
      // Resolve locale-aware display name — Latin for non-UK, Cyrillic for UK
      const displayName =
        lang !== "uk" && member.user?.displayName
          ? member.user.displayName
          : member.user?.name || "";

      const avatarUrl = member.user?.avatar || null;

      // Build CSS selector covering exact slug + first-segment fallback
      // e.g. "serhii-hilj" also matches img[data-member-slug="serhii"]
      const firstSegment = member.slug ? member.slug.split("-")[0] : "";
      const selectors = [
        member.slug ? `img[data-member-slug="${member.slug}"]` : "",
        firstSegment && firstSegment !== member.slug
          ? `img[data-member-slug="${firstSegment}"]`
          : "",
      ]
        .filter(Boolean)
        .join(", ");

      if (!selectors) return;

      // Find ALL images for this member across the current page
      const imgEls = document.querySelectorAll(selectors);
      if (!imgEls.length) return;

      imgEls.forEach((imgEl) => {
        // Update avatar src only if the API has a photo set
        if (avatarUrl) {
          imgEl.src = avatarUrl;
        }
        // Always update alt text with resolved display name
        if (displayName && member.profession) {
          imgEl.alt = `${displayName} — ${member.profession}`;
        }

        // Find the parent card — works on both .team-card (team.html) and
        // .about-member (about.html). Project cards and other img contexts are skipped.
        const card =
          imgEl.closest(".team-card") || imgEl.closest(".about-member");
        if (!card) return;

        const isTeamCard = card.classList.contains("team-card");

        // Name element: .team-card__name or .about-member__name
        const nameEl = card.querySelector(
          isTeamCard ? ".team-card__name" : ".about-member__name",
        );
        // Role/profession element: .team-card__role or .about-member__badge
        const roleEl = card.querySelector(
          isTeamCard ? ".team-card__role" : ".about-member__badge",
        );
        // Bio element: .team-card__bio or .about-member__bio p (first paragraph)
        const bioEl = isTeamCard
          ? card.querySelector(".team-card__bio")
          : card.querySelector(".about-member__bio p");

        // Apply resolved values — only overwrite when API returned a value
        if (displayName && nameEl) nameEl.textContent = displayName;
        if (member.profession && roleEl) roleEl.textContent = member.profession;
        if (member.shortDescription && bioEl)
          bioEl.textContent = member.shortDescription;

        // FEAT-SOCIAL: populate this card's personal social icons from the API
        // flat socialLinks (enabled-only). No container → skip; no links → empty.
        const socialsEl = card.querySelector("[data-member-socials]");
        if (socialsEl) renderMemberSocials(socialsEl, member.user?.socialLinks);
      });
    });
  } catch (_) {
    // Network failure: static photos and text remain visible, no user-facing error
  }
}

// Initial hydration on page load + re-hydrate on language switch
hydrateTeamAvatars();
document.addEventListener("cl:languagechange", hydrateTeamAvatars);
