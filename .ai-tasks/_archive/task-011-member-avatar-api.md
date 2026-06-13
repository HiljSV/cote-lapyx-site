# Task 011 — member.html: hydrate avatar from API

## Meta

- **Date:** 2026-05-14
- **Project:** cote-lapyx
- **Branch:** feature/task-011-member-avatar-api
- **Agent:** Senior-Frontend-Dev-Agent
- **Created by:** Claude Code

---

## Project Context

- **Path:** /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
- **Stack:** HTML/SCSS/JS (Vite bundler, ES modules)
- **Build command:** npm run build
- **Config files (DO NOT TOUCH):** vite.config.js, .env, src/styles/cyberpunk.scss, src/styles/settings.scss

---

## Goal

`member.html` must show the user's uploaded avatar (from API) instead of the static photo from `members.json`, while keeping static data as a fallback.

---

## Background

`src/js/member.js` currently loads all member data from two static JSON files:

- `src/data/members.json` — has `member.photo` (static path like `assets/img/serhii/prince.png`)
- `src/data/posts.json`

The page renders `renderPhoto(member)` which checks `member.photo`.

The backend has a **public** (no auth) endpoint:
`GET https://api.cote-lapyx.com/api/v1/team-members/{slug}`

Response includes `user.avatar` (nullable string URL) — this is the uploaded avatar.

Member ID ↔ API slug mapping (1:1, already match):

- `serhii` → `/team-members/serhii`
- `andrii` → `/team-members/andrii`
- `valeriia` → `/team-members/valeriia`

The `renderPhoto(member)` function (line 28–36):

```js
function renderPhoto(member) {
  const wrap = document.getElementById("member-photo-wrap");
  if (!wrap) return;
  if (member.photo) {
    wrap.innerHTML = `<img class="member-hero__photo" src="${member.photo}" alt="${member.name} — ${member.role}" width="180" height="180" />`;
  } else {
    wrap.innerHTML = buildInitialsPlaceholder(member);
  }
}
```

---

## Requirements

1. In `src/js/member.js`, after static data is loaded and rendered, add an **async** API call:
   ```
   fetch(`https://api.cote-lapyx.com/api/v1/team-members/${memberId}`)
   ```
2. If the response is ok AND `data.user?.avatar` is truthy — update `member-photo-wrap` with the API avatar image (same markup as `renderPhoto` uses for photo)
3. If API call fails or returns no avatar — do nothing, keep the already-rendered static photo
4. Also update `og:image` meta tag and JSON-LD `image` field if avatar is found
5. The static page render must NOT wait for the API (progressive enhancement: render static first, then update)
6. Use plain `fetch()` — this is a **public endpoint**, no auth needed
7. Do NOT remove or break the existing `renderPhoto(member)` function — it still runs first for the static photo
8. Always add comments in modified JS files
9. Run `npm run build` after changes and verify no errors

---

## Forbidden

- Do NOT modify: `src/data/members.json`, `vite.config.js`, any `*.scss` files, `src/js/fetchWithAuth.js`
- Do NOT add a loading spinner or skeleton — silent progressive update only
- Do NOT push to remote
- Do NOT modify `.env` or any migration SQL files
- Do NOT touch any other JS files

---

## Files to Modify

- `src/js/member.js` — add async API hydration after `renderCta(member)` call (line ~250)

---

## Acceptance Criteria

- [ ] Page renders immediately from static JSON (no delay)
- [ ] If user has an uploaded avatar in the API — it replaces the static photo after async fetch
- [ ] If API is unreachable or returns no avatar — static photo remains, no errors in console
- [ ] `og:image` is updated to the API avatar if available
- [ ] `npm run build` passes without errors
- [ ] Comments present in modified JS
- [ ] Git commit created on branch `feature/task-011-member-avatar-api`

---

## Expected Commit Message

```
feat(member): hydrate avatar from API with static photo fallback
```

---

## Notes from Claude

- The `DOMContentLoaded` handler already has `memberId` from URL params — use it directly for the API call
- Pattern to follow: `blog.js` lines 49–51 (avatar img vs initials pattern)
- The API endpoint is public — no JWT needed
- The async function should be added AFTER all synchronous renders are done (after line 250 `renderCta(member)`)
- Wrap everything in try/catch to avoid breaking the page if API is down
