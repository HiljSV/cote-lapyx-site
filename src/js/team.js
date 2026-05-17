// =============================================================================
// team.js — Hydrate team member data from API (avatar, name, role, bio)
// Runs on every page that has img[data-member-slug] elements:
//   team.html (.team-card), about.html (.about-member), project/post cards.
// Falls back gracefully when API is unreachable or member has no avatar.
// =============================================================================

// Named so it can be re-called on cl:languagechange without page reload
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
      });
    });
  } catch (_) {
    // Network failure: static photos and text remain visible, no user-facing error
  }
}

// Initial hydration on page load + re-hydrate on language switch
hydrateTeamAvatars();
document.addEventListener("cl:languagechange", hydrateTeamAvatars);
