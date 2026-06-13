# Task-019: Make projects.js author block clickable

## Context

Frontend project: /home/hilj/code/active/cote-lapyx_project/cote-lapyx
Branch to create: feature/task-019-projects-author-link

## Problem

In `src/js/projects.js`, `buildProjectCard()` renders the author block as:

```html
<div class="project-card__author">
  <div class="project-card__author-avatar" aria-hidden="true">
    ${authorAvatarInner}
  </div>
  ${authorName}
</div>
```

No link to the author's member profile. Inconsistent with static cards on index.html (fixed in task-017).

## Root cause

`project.author` from the API only has `id` (user ID) and `name` — no `slug`.
To link to `member.html?id={slug}`, we need to look up the team member slug by user ID.

## Solution

Pre-fetch `/api/v1/team-members` in projects.js to build a `userId → slug` map.
Use that map in `buildProjectCard` to wrap the author in `<a>` when a slug is known.

## Required changes — only `src/js/projects.js`

### 1. Add module-level slug map

```js
// userId → team member slug map, populated by initMemberSlugs()
const memberSlugMap = new Map();
```

### 2. Add initMemberSlugs() function

```js
async function initMemberSlugs() {
  try {
    const res = await fetch(`${API}/team-members`);
    if (!res.ok) return;
    const members = await res.json();
    // Build map: userId → slug for author link resolution
    members.forEach((m) => {
      if (m.userId && m.slug) memberSlugMap.set(m.userId, m.slug);
    });
  } catch (_) {
    // Silently fail — author blocks render without link
  }
}
```

### 3. Update buildProjectCard() — change author block from div to a/div conditional

Replace current author block (lines 75-78):

```js
<div class="project-card__author">
  <div class="project-card__author-avatar" aria-hidden="true">
    ${authorAvatarInner}
  </div>
  ${escHtml(authorName)}
</div>
```

With:

```js
// Author: link to member profile if slug is known, plain div otherwise
${(function() {
  const slug = project.author?.id ? memberSlugMap.get(project.author.id) : null;
  const inner = `<div class="project-card__author-avatar" aria-hidden="true">${authorAvatarInner}</div>${escHtml(authorName)}`;
  return slug
    ? `<a href="member.html?id=${encodeURIComponent(slug)}" class="project-card__author" aria-label="Профіль ${escHtml(authorName)}">${inner}</a>`
    : `<div class="project-card__author">${inner}</div>`;
})()}
```

### 4. Call initMemberSlugs() in DOMContentLoaded, before loadProjects(0)

```js
document.addEventListener("DOMContentLoaded", async () => {
  const gridEl = document.getElementById("projects-grid");
  if (!gridEl) return;

  // Pre-fetch member slugs so author links resolve before cards render
  await initMemberSlugs();

  // Initial load
  loadProjects(0);
  // ... rest of listeners unchanged
});
```

NOTE: `await initMemberSlugs()` is intentional — ensures slugs are ready before first render.
The response is tiny (3 members) so the added latency is negligible.
DOMContentLoaded callback must become `async`.

## Constraints

- Only change `src/js/projects.js` — no HTML, no SCSS, no backend
- `escHtml()` and `encodeURIComponent()` on all user-supplied strings
- Block-level comments on every new function and changed block
- `npm run build` must pass

## Git

- Branch: feature/task-019-projects-author-link
- Commit: feat(projects): make author block clickable via userId→slug map from team-members API
- Do NOT push
