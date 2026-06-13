# Task 047 — Accessibility Sprint: WCAG 2.1 AA fixes

## Project

Frontend: /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
Stack: HTML/SCSS/JS, Vite, FLS, BEM, mobile-first

## Goal

Fix all identified WCAG 2.1 AA gaps in one sprint. No new features — only a11y fixes.

## Context

Audit findings:

- $text-muted (#4a6080) contrast 3.0:1 — FAILS AA (needs ≥4.5:1 for normal text)
- No prefers-reduced-motion — hex canvas + cursor trail + CSS animations always run
- No skip link — keyboard users must tab through full header
- <main> missing on: about, contact, services, login, register pages
- .visually-hidden used in contact.html but NOT defined in global CSS
- Team photo alt="" in index.html — should have person name + role
- HTML template missing default lang attribute (before JS sets it)

## Files to read BEFORE any changes

- src/styles/settings.scss — color variables
- src/styles/cyberpunk.scss — global mixins and utilities
- src/js/app.js — canvas hex animation init
- src/components/layout/inner.html — HTML shell (where lang goes)
- src/components/layout/head.html — <head> block
- src/i18n/uk.json — i18n keys structure

---

## Fix 1 — $text-muted contrast

### File: src/styles/settings.scss

Change line with `$text-muted`:

BEFORE:

```scss
$text-muted: #4a6080;
```

AFTER:

```scss
$text-muted: #6b8aaa;
```

Ratio check: #6b8aaa on #0a0e1a = ~4.6:1 (passes AA).
Do NOT change $text-secondary (#7a9bb5) — already 6.6:1.

---

## Fix 2 — .visually-hidden global utility

### File: src/styles/cyberpunk.scss

Add this block near the top (after imports/variables, before mixins):

```scss
// Screen-reader-only utility — hides element visually but keeps it in the accessibility tree
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Fix 3 — prefers-reduced-motion CSS

### File: src/styles/cyberpunk.scss

Add this block at the very END of the file (after all existing rules):

```scss
// Disable animations for users who prefer reduced motion (vestibular disorders, epilepsy)
@media (prefers-reduced-motion: reduce) {
  // Kill all transitions and animations globally
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### File: src/js/app.js

Find the hex canvas animation init block. It starts with a comment like:
`// Hero hex-grid line animation (canvas overlay)`

Wrap the ENTIRE canvas animation logic (from `const canvas = document.createElement("canvas")` through the `animate()` call and `window.addEventListener("resize", ...)`) with a reduced-motion guard:

```js
// Respect prefers-reduced-motion — skip canvas animation for users who need it
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  // ... existing canvas animation code ...
}
```

Do NOT remove or restructure the animation code — just wrap it in the if block.

---

## Fix 4 — Skip link

### File: src/components/layout/header.html

Add a skip link as the FIRST child of <header> (before any existing content):

```html
<!-- Skip navigation link — allows keyboard users to bypass header -->
<a class="skip-link" href="#main-content" data-i18n="a11y.skip_link">
  Перейти до основного контенту
</a>
```

### File: src/components/layout/header.scss (or wherever header styles are)

Add skip link styles. The link is visually hidden until focused:

```scss
// Skip navigation link — visually hidden until keyboard focus
.skip-link {
  position: absolute;
  top: -100%;
  left: 1rem;
  z-index: 10000;
  padding: 0.5rem 1rem;
  background: $neon-cyan;
  color: $bg-dark;
  font-weight: 700;
  font-size: 14px;
  border-radius: 0 0 4px 4px;
  text-decoration: none;
  transition: top 0.2s ease;

  &:focus {
    top: 0;
    outline: 2px solid $bg-dark;
    outline-offset: 2px;
  }
}
```

### File: src/i18n/uk.json

Add AFTER the first key in the root object (before "nav" section or wherever is logical):

```json
"a11y": {
  "skip_link": "Перейти до основного контенту"
},
```

### Files: src/i18n/en.json, fr.json, de.json

Add the same key with translations:

- en.json: `"a11y": { "skip_link": "Skip to main content" }`
- fr.json: `"a11y": { "skip_link": "Aller au contenu principal" }`
- de.json: `"a11y": { "skip_link": "Zum Hauptinhalt springen" }`

---

## Fix 5 — Add <main> to 5 pages + id="main-content" everywhere

Every page's main content wrapper needs `id="main-content"` so the skip link target works.

### Pages that already have <main>: blog, dashboard, admin, member, post, project, projects, team, about, index

For these, just add `id="main-content"` to the existing `<main>` tag.

### Pages MISSING <main> — wrap content in <main>:

**src/components/pages/about/about.html**

- The page has no <main>. Wrap the existing top-level content in:
  `<main id="main-content" class="about-page">...</main>`
- Remove the outer wrapper class from whatever div is currently wrapping if it conflicts.

**src/components/pages/services/services.html**

- Same pattern: wrap in `<main id="main-content" class="services-page">...</main>`

**src/components/pages/contact/contact.html**

- Currently has `.page-hero` div + `<section class="section--dark contact-page">`.
- Wrap both in: `<main id="main-content">...</main>`

**src/components/pages/auth/login.html**

- Wrap main content in: `<main id="main-content" class="auth-main">...</main>`

**src/components/pages/auth/register.html**

- Same: `<main id="main-content" class="auth-main">...</main>`

IMPORTANT: Read each file before wrapping to understand current structure.
Do NOT break existing CSS class structure — just add <main> as outer wrapper.
If a page has `.wrapper` or `.container` as outermost — wrap THOSE in <main>, not inside.

---

## Fix 6 — Team member photo alt text

### File: src/components/pages/index/index.html

Find the 3 team member card images. They currently have `alt=""`.
Update each to include the person's name and role:

- Serhii's photo: `alt="Serhii Khilchenko — Fullstack developer"`
- Andrii's photo: `alt="Andrii — Backend developer"`
- Valeriia's photo: `alt="Valeriia — UI/UX designer"`

Search for the 3 img tags near the team section (look for `alt=""` near class="team-card\_\_img" or similar).

---

## Fix 7 — Default lang attribute in HTML template

### File: src/components/layout/inner.html

Find the `<html>` opening tag. Add `lang="uk"` as the default:

```html
<html lang="uk"></html>
```

(i18n.js will override this at runtime with the user's selected language.)

---

## Output expected

- All changes committed on branch: `feature/component-047-a11y-wcag`
- Commit message: `feat(a11y): WCAG 2.1 AA sprint — contrast, reduced-motion, skip link, semantic HTML`
- No regressions: existing layout/BEM must be preserved
- Build must pass: `npm run build` no errors

## IMPORTANT rules

- Use fetchWithAuth for any API calls (not relevant here — no API calls in this task)
- BEM methodology — do NOT add non-BEM utility classes except .visually-hidden and .skip-link (established pattern)
- Mobile-first — skip link and any new elements must work at 320px+
- Comments required in every new SCSS block and JS change
- Do NOT modify any JS files except app.js
- Do NOT touch backend code
