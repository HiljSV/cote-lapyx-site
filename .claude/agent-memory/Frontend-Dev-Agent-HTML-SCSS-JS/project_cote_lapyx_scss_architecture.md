---
name: cote-lapyx SCSS component architecture
description: How SCSS is organized in cote-lapyx after component refactor — import paths, mixin availability, JS import pitfall
type: project
---

Component SCSS files live in `src/components/{layout,ui,pages}/`. They are imported exclusively via `src/styles/style.scss` — they must NOT be imported from JS files.

**Why:** `cyberpunk.scss` (defines `glass-card`, `neon-glow`, `neon-text`, `hex-bg` mixins) is loaded in `style.scss` before the component imports. If a component SCSS is loaded via JS `import './foo.scss'`, Vite compiles it as a root stylesheet with only `additionalData` (includes/index.scss) — no `cyberpunk.scss` — causing "Undefined mixin" errors.

**How to apply:** When adding new component SCSS, always:

1. Add the `@import` to `src/styles/style.scss`
2. Remove any `import './foo.scss'` from the corresponding `.js` file if present
3. The FLS-standard `header.js` and `footer.js` originally had `import './header.scss'` / `import './footer.scss'` — these were replaced with comments after the refactor
