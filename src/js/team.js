// =============================================================================
// team.js — Hydrate team member photos from API avatars
// Fetches /api/v1/team-members (public) and replaces static photo src
// with the user's avatar URL if one is set. Falls back to static image silently.
// =============================================================================

(async function hydrateTeamAvatars() {
  try {
    const res = await fetch("https://api.cote-lapyx.com/api/v1/team-members");
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

      // Update every matching image: src and descriptive alt
      imgEls.forEach((imgEl) => {
        imgEl.src = avatarUrl;
        // Keep alt descriptive (use name + profession from API if available)
        if (member.user.name && member.profession) {
          imgEl.alt = `${member.user.name} — ${member.profession}`;
        }
      });
    });
  } catch (_) {
    // Network failure: static photos remain visible, no user-facing error
  }
})();
