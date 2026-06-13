# Task 052 — member.html: Telegram link fix, Articles filter, Projects from API

## Branch

`fix/052-member-telegram-articles-projects` (already created from main)

## Project

`/home/hilj/code/active/cote-lapyx_project/cote-lapyx/`
FLS v4 template, Vite, vanilla JS, BEM/SCSS, no frameworks.

## Context

Three bugs on `member.html?id=andrii` (and other members) reported by Andrii:

1. Telegram link goes to site page instead of Telegram
2. Articles show ALL posts (not filtered by member)
3. Personal Projects show hardcoded placeholder data from local JSON, not real API data

Key file: `src/js/member.js`
Data file: `src/data/members.json`
API base: `https://api.cote-lapyx.com/api/v1`

---

## Fix #1 — Telegram link normalization

**Problem:** Users may store telegram as `@handle`, `handle`, or `t.me/handle` in their dashboard.
When `renderSocials` uses the raw value as `href`, the browser treats it as a relative URL → navigates to site page instead of Telegram.

**File:** `src/js/member.js`, function `renderSocials` (line ~83)

**Fix:** Add URL normalization in `renderSocials` before building the `<a>` tag.
For key `telegram`: if URL doesn't start with `http://` or `https://`, prepend `https://t.me/` and strip leading `@`.

```js
// Normalize telegram handle → full URL
if (key === "telegram" && url && !/^https?:\/\//.test(url)) {
  url = "https://t.me/" + url.replace(/^@/, "");
}
```

Apply this normalization inside the `.map(([key, url]) => { ... })` block, before building the anchor.

---

## Fix #2 — Articles filter by member

**Problem:** Posts section may show all posts or nothing, depending on whether `data.userId` is returned.

**Current code** (`hydrateFromApi` function, line ~240):

```js
if (data.userId) {
  await hydratePosts(data.userId, lang);
}
```

**Investigate:**

1. `console.log` or verify: does `GET /api/v1/team-members/{slug}` actually return `userId` in the response? Check the API contract — `TeamMemberDTO` has `userId: integer`.
2. If `data.userId` is null/undefined for some members → `hydratePosts` is never called → posts section stays empty.
3. If `data.userId` is set but still showing ALL posts → backend bug (out of scope; flag to Claude).

**Fix (frontend):**

- If the issue is that `data.userId` may be absent: add fallback — try `data.user?.id` as well:
  ```js
  const userId = data.userId || data.user?.id;
  if (userId) {
    await hydratePosts(userId, lang);
  }
  ```
- Also: ensure `hydratePosts` URL correctly uses `authorId` param (already present at line 256):
  `${API}/posts?size=10&sort=publishedAt,desc&authorId=${userId}&locale=${lang}`

---

## Fix #3 — Personal Projects from real API

**Problem:** `renderProjects(member)` reads from local `members.json` (hardcoded placeholder data).
The comment in code says: "projects not yet in member API" — that was true before, now projects API exists.

**Real API endpoint:** `GET /api/v1/projects?authorId={userId}&locale={lang}`
Response shape: `{ content: [...], totalElements, ... }` (PageResponse)
Each project has: `slug`, `title`, `description`, `status`, `type`, `technologies[]`, `coverImage`, `githubUrl`, `demoUrl`, `createdAt`

**Fix:**

1. Add new async function `hydrateProjects(userId, lang)` similar to `hydratePosts`:
   - Fetch `${API}/projects?size=10&sort=createdAt,desc&authorId=${userId}&locale=${lang}`
   - On success → call a new `renderProjectsFromApi(projects)` function
   - On failure → silently keep local JSON data visible (already rendered by initial `renderProjects`)

2. `renderProjectsFromApi(projects)` renders project cards. Use same `.project-card` BEM structure as current `renderProjects`, but map from API fields:
   - `p.title` → card title
   - `p.description` (locale-aware, from API) → card description
   - `p.technologies` (array of strings) → tags (use `cyan` color for all tech tags)
   - `p.githubUrl` → GitHub link (if present)
   - `p.demoUrl` or `https://cote-lapyx.com/project.html?slug=${p.slug}` → Demo link
   - Use `cyan` as default card color (no color info in API)
   - Empty state: if `projects.length === 0`, show `<p class="member-projects__empty">Немає проектів.</p>`

3. Call `hydrateProjects(userId, lang)` in `hydrateFromApi` alongside `hydratePosts`:

   ```js
   const userId = data.userId || data.user?.id;
   if (userId) {
     await hydratePosts(userId, lang);
     await hydrateProjects(userId, lang);
   }
   ```

4. Also call `hydrateProjects` in the `cl:languagechange` listener (already has `renderProjects(member)` there — keep that as fallback but also call `hydrateProjects` if userId is known).

---

## Code quality requirements (global rules)

- Comments before every function and every major logic block
- No new dependencies — vanilla JS only
- Use existing `escHtml()` for all user-controlled strings injected into innerHTML
- Use existing `fetchWithAuth` if endpoint requires auth — but `/projects` and `/team-members` are public, use plain `fetch`
- Follow BEM naming already in the file

## Output

Commit on `fix/052-member-telegram-articles-projects` with message:
`fix(member): normalize telegram URL, filter posts by authorId, load projects from API`

Then report back with:

- What was changed (file + line ranges)
- Whether #4 is a frontend issue (missing userId) or backend issue (filter not working)
- Any OUT OF SCOPE findings
