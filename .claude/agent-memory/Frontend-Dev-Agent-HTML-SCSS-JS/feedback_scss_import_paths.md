---
name: SCSS import paths from src/styles/style.scss
description: Correct relative path depth for @import of component SCSS from src/styles/style.scss
type: feedback
---

Use `../components/...` (one `../`), NOT `../../components/...` (two `../../`).

**Why:** `src/styles/style.scss` is one level below `src/`. One `../` goes up to `src/`, then `components/` resolves correctly to `src/components/`. Two `../../` would exit `src/` entirely and point to a non-existent `components/` at the project root.

**How to apply:** Every `@import` of a component SCSS in `style.scss` should use the pattern:

```scss
@import "../components/layout/header/header";
@import "../components/ui/buttons/buttons";
@import "../components/pages/blog/blog";
```
