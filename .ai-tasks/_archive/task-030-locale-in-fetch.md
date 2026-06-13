# Task 030 — Pass ?locale= in public API fetch calls

## Branch
`feature/component-030-locale-fetch`
Checkout from: main
Frontend repo: /home/hilj/code/active/cote-lapyx_project/cote-lapyx

## Goal
All public API fetch calls that load content (posts, projects, team members) must pass
the current UI language so the backend can return the correct translated version.

## How locale is stored
- Current language: `localStorage.getItem("cl_lang")` — values: "uk", "en", "fr", "de"
- Fallback: "en" if not set

## What to add

In each JS file listed below, find all `fetchWithAuth` / `fetch` calls that hit
public content endpoints, and append `?locale=${lang}` to the URL.

Read `src/js/i18n.js` first — it exports `translate()` but NOT a `currentLang()` getter.
The lang must be read from `localStorage.getItem("cl_lang") || "en"`.

### Files to update

**`src/js/blog.js`**
- `GET /api/v1/posts` (list) → add `?locale=...` (alongside existing `?page=`, `?categorySlug=` etc)
- `GET /api/v1/posts/{slug}` (single) → add `?locale=...`

**`src/js/projects.js`**
- `GET /api/v1/projects` (list) → add `?locale=...`

**`src/js/post.js`**
- `GET /api/v1/posts/{slug}` → add `?locale=...`

**`src/js/project.js`**
- `GET /api/v1/projects/{slug}` → add `?locale=...`

**`src/js/member.js`**
- `GET /api/v1/team-members/{slug}` → add `?locale=...`

**`src/js/team.js`**
- `GET /api/v1/team-members` → add `?locale=...`

## Implementation pattern

```js
// Read current language from localStorage (same key used by i18n.js)
const lang = localStorage.getItem("cl_lang") || "en";
// Append to existing URL params — use URLSearchParams if params already exist
const url = `/api/v1/posts?locale=${lang}&page=${page}`;
```

If the endpoint already has query params, append `&locale=${lang}`.
If it has no params yet, append `?locale=${lang}`.

Use `const lang = localStorage.getItem("cl_lang") || "en";` — add this line
at the top of each function that makes the request.

## Rules
- Read each file before editing
- Only add the locale param — do not refactor logic or rename variables
- Comments required above every changed fetch call
- Run `npm run i18n:check` at end (should still pass — no JSON changes)
- Run `npm run build` at end (should exit 0)
- Commit all changes on the branch

## Commit message
```
feat(i18n): pass ?locale= in all public content API fetch calls (task-030)
```
