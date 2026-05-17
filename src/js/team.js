// =============================================================================
// team.js — Hydrate team member photos from API avatars
// Fetches /api/v1/team-members (public) and replaces static photo src
// with the user's avatar URL if one is set. Falls back to static image silently.
// =============================================================================

// Named so it can be re-called on cl:languagechange
async function hydrateTeamAvatars() {
  try {
    // Read current UI language so the backend returns translated member content
    const lang = localStorage.getItem("cl_lang") || "en";
    // GET /api/v1/team-members — public endpoint; locale passed for translations
    const res = await fetch(
      `https://api.cote-lapyx.com/api/v1/team-members?locale=${lang}`,
    );
    if (!res.ok) return;

    const members = await res.json();

    members.forEach((member) => {
      const avatarUrl = member.user && member.user.avatar;
      if (!avatarUrl) return; // no avatar set — keep static image

      // Build first-segment fallback: "serhii-khil" → "serhii"
      const firstSegment = member.slug ? member.slug.split("-")[0] : "";

      // Build a combined CSS selector covering exact slug + first-segment fallback.
      // This ensures ALL matching images on the page get updated — team section,
      // project cards, about page, member page, etc. — not just the first one.
      const selectors = [
        member.slug ? `img[data-member-slug="${member.slug}"]` : "",
        firstSegment && firstSegment !== member.slug
          ? `img[data-member-slug="${firstSegment}"]`
          : "",
      ]
        .filter(Boolean)
        .join(", ");

      // Nothing to query — skip this member
      if (!selectors) return;

      // Select ALL images that match any of the slug variants
      const imgEls = document.querySelectorAll(selectors);
      if (!imgEls.length) return;

      // Resolve display name: Latin displayName for non-UK locales, Cyrillic name otherwise
      const displayName =
        lang !== "uk" && member.user.displayName
          ? member.user.displayName
          : member.user.name || "";

      // Update every matching image: src and descriptive alt.
      // Also hydrate name, profession (role) and bio from API for team-card elements.
      imgEls.forEach((imgEl) => {
        imgEl.src = avatarUrl;
        // Keep alt descriptive (use resolved display name + profession from API if available)
        if (displayName && member.profession) {
          imgEl.alt = `${displayName} — ${member.profession}`;
        }

        // Hydrate .team-card__name, .team-card__role and .team-card__bio from API response.
        // Only applies when the img is inside a .team-card (team section, team page).
        // Project cards and member avatars elsewhere do NOT have these elements.
        const card = imgEl.closest(".team-card");
        if (!card) return;

        // Update visible name with locale-aware displayName
        if (displayName) {
          const nameEl = card.querySelector(".team-card__name");
          if (nameEl) {
            nameEl.textContent = displayName;
          }
        }

        // Update profession label if API returned one
        if (member.profession) {
          const roleEl = card.querySelector(".team-card__role");
          if (roleEl) {
            roleEl.textContent = member.profession;
          }
        }

        // Update short bio if API returned one
        if (member.shortDescription) {
          const bioEl = card.querySelector(".team-card__bio");
          if (bioEl) {
            bioEl.textContent = member.shortDescription;
          }
        }
      });
    });
  } catch (_) {
    // Network failure: static photos remain visible, no user-facing error
  }
}

// Initial hydration + re-hydrate on language switch
hydrateTeamAvatars();
document.addEventListener("cl:languagechange", hydrateTeamAvatars);
