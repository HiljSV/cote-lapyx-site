# cote-lapyx — Reusable Patterns

Патерни що можна переносити в нові проєкти.

## Auth pattern (JWT + fetchWithAuth)

```js
// Authenticated API call — always use this wrapper
const data = await fetchWithAuth("/api/v1/posts", { method: "GET" });

// Never:
fetch("/api/v1/posts", { headers: { Authorization: `Bearer ${token}` } });
```

Transfer to: any project with JWT auth.

## XSS protection pattern

```js
// Always escape before innerHTML
element.innerHTML = escHtml(userInput);

// Never:
element.innerHTML = userInput;
```

Transfer to: any project with dynamic HTML rendering.

## FLS component structure

```
src/components/sections/hero/
  hero.html   ← PostHTML include
  hero.scss   ← scoped styles
  hero.js     ← scoped logic (optional)
```

Include via: `<include src="@components/sections/hero/hero.html" />`

Transfer to: any FLS/Vite project using «Чертоги Фрілансера» v4 template.

## SCSS container pattern

```scss
// __container = max-width + centering ONLY
.section__container {
  max-width: $pc;
  margin: 0 auto;
  padding: 0 15px;
  // NEVER: flex, grid, display
}

// Layout always on children
.section__inner {
  display: flex;
  gap: 20px;
}
```

Transfer to: all HTML/SCSS projects.

## Responsive testing checklist

Always verify at:

- `320px` — mobileSmall
- `768px` — tablet
- `1280px` — desktop

Never report "done" after testing only one breakpoint.

## Codex task template

See `~/.ai-tasks/template.md` — use for all Codex delegations.
Always: `codex-safe exec -C /project -s workspace-write < task.md`

## Git commit pattern

```
feat(hero): add scroll animation
fix(header): mobile nav z-index
refactor: split sections into FLS components
chore: update dependencies
```

One commit per logical block. Never accumulate all changes.

## API pagination pattern (backend)

```java
// Always return PageResponse<T>, never plain List
PageResponse<PostDTO> response = postService.findAll(pageable, locale);
```

## i18n pattern (cote-lapyx)

- Source language: Ukrainian (uk)
- Targets: en, fr, de via LibreTranslate (self-hosted, localhost:5000)
- Trigger translation on entity create/update
- Store in separate translation tables (PostTranslation, ProjectTranslation, etc.)
