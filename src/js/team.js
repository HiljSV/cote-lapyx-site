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

      // Find photo by data-member-slug matching the API slug
      const imgEl = document.querySelector(
        `img[data-member-slug="${member.slug}"]`,
      );
      if (!imgEl) return;

      imgEl.src = avatarUrl;
      // Keep alt descriptive (use name + profession from API if available)
      if (member.user.name && member.profession) {
        imgEl.alt = `${member.user.name} — ${member.profession}`;
      }
    });
  } catch (_) {
    // Network failure: static photos remain visible, no user-facing error
  }
})();
