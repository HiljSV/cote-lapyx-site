# Fix-018: Hydrate ALL matching avatar images + add data-member-slug to project cards

## Context

Frontend project: /home/hilj/code/active/cote-lapyx_project/cote-lapyx
Branch to create: fix/018-team-hydrate-all-avatars

## Problem

`team.js` fetches `/api/v1/team-members` and updates avatar images via `data-member-slug`.
But TWO bugs prevent project card author avatars from updating:

### Bug 1 — team.js uses querySelector (only first match)

File: `src/js/team.js`

Current code:

```js
const imgEl =
  (member.slug &&
    document.querySelector(`img[data-member-slug="${member.slug}"]`)) ||
  (firstSegment &&
    document.querySelector(`img[data-member-slug="${firstSegment}"]`)) ||
  null;
if (!imgEl) return;
imgEl.src = avatarUrl;
```

This only updates the FIRST matching element. On index.html there are:

- Team section img [data-member-slug="serhii"] (large, ~120px)
- Project card img [no data-member-slug yet] (small, 26px)

Fix: use querySelectorAll and update ALL matching elements.

### Bug 2 — project card author avatars have no data-member-slug

File: `src/components/pages/index/index.html`

Lines ~578-583, ~616-621, ~659-664: the `<img class="project-card__author-avatar">` elements
have NO `data-member-slug` attribute — team.js cannot find them.

Cards:

- Card 1 (cote-lapyx.com): author Сергій → add data-member-slug="serhii"
- Card 2 (JARVIS AI): author Сергій → add data-member-slug="serhii"
- Card 3 (Brand Kit): author Андрій → add data-member-slug="andrii"

## Required changes

### 1. src/js/team.js — replace querySelector with querySelectorAll

Replace the current imgEl logic (the querySelector block + imgEl.src line) with:

```js
// Update ALL images with matching slug — covers team cards, project cards, etc.
const slugSelectors = [
  member.slug && `img[data-member-slug="${member.slug}"]`,
  firstSegment && `img[data-member-slug="${firstSegment}"]`,
]
  .filter(Boolean)
  .join(", ");
if (!slugSelectors) return;

const imgEls = document.querySelectorAll(slugSelectors);
if (!imgEls.length) return;

imgEls.forEach((imgEl) => {
  imgEl.src = avatarUrl;
  if (member.user.name && member.profession) {
    imgEl.alt = `${member.user.name} — ${member.profession}`;
  }
});
```

Remove the duplicate `if (member.user.name && member.profession)` block that was after the old `imgEl.src = avatarUrl` line.

### 2. src/components/pages/index/index.html — add data-member-slug to project card avatars

Card 1 (~line 578-582): add `data-member-slug="serhii"` to the author avatar img
Card 2 (~line 616-620): add `data-member-slug="serhii"` to the author avatar img
Card 3 (~line 659-663): add `data-member-slug="andrii"` to the author avatar img

## Constraints

- Only change src/js/team.js and src/components/pages/index/index.html
- Keep the same logic structure, just switch to querySelectorAll
- Comments required on changed blocks

## Git

- Branch: fix/018-team-hydrate-all-avatars
- Commit message: fix(team): update ALL data-member-slug images; add slug attrs to project card avatars
- Do NOT push
