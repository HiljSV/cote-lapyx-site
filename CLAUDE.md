# cote-lapyx.com — Main Website

## Stack

- HTML, SCSS, JavaScript (FLS template + Vite bundler)
- Spring Boot 3.3 backend at https://api.cote-lapyx.com
- Deploy: Apache on cote-lapyx.com (CI/CD via GitHub Actions → rsync)

## Structure

- `src/` — all sources (Vite root)
- `src/components/` — reusable components (pages, layout, ui)
- `src/styles/` — SCSS (cyberpunk.scss, settings.scss, style.scss)
- `src/js/` — JavaScript (auth.js, fetchWithAuth.js, dashboard.js, post.js, etc.)
- `src/assets/` — images, fonts, icons
- `src/data/` — JSON data files (members.json)
- `src/files/` — static files copied as-is to dist (sitemap.xml, robots.txt)
- `dist/` — build output (gitignored)
- `docs/` — API contract (api-v1.yaml)

## API

- Base URL: `https://api.cote-lapyx.com/api/v1`
- Auth: JWT access token (15 min) + refresh token (30 days)
- Tokens stored in localStorage: `cl_access`, `cl_refresh`
- All authenticated requests via `fetchWithAuth()` — never raw fetch with Bearer
- Swagger: https://api.cote-lapyx.com/swagger-ui/index.html

## Design System

- Style: Cyberpunk/neon
- Colors: Cyan #00e5ff, Magenta #e040fb, Green #39ff14, Background #0a0e1a
- Fonts: Geologica (headings) + Nunito (body)
- SCSS methodology: BEM, mobile-first
- Breakpoints: $pc=1200, $tablet=991.98, $mobile=767.98, $mobileSmall=479.98

## Pages

Public: index, team, projects, blog, post (dynamic), project (dynamic), member (dynamic)
Auth: login, register
Protected: dashboard (OWNER), admin (isAdmin)

## Agents

- `cote-lapyx-frontend-dev` — HTML/SCSS/JS, cote-lapyx specific rules
- `frontend-html-scss-js` — general HTML/SCSS/JS layout (FLS, generic tasks)
- `Senior-Frontend-Dev-Agent` — complex JS, architecture decisions (escalation)
- `cote-lapyx-backend-dev` — Spring Boot backend, cote-lapyx specific
- `cote-lapyx-qa-reviewer` — QA after each phase (Phase 1 component, Phase 2 integration)
- `cote-api-contract` — OpenAPI 3.1 contract (docs/api-v1.yaml)
- `devops-agent` — deploy, Apache config, CI/CD
- `security-agent` — before any auth/security changes go live

## Pipeline (cote-lapyx specific)

```
Phase 1 — Component branch  feature/component-NNN-section-name
  1. Claude writes ~/.ai-tasks/task-NNN-name.md
  2. git checkout -b feature/component-NNN-name
  3. codex-safe exec -C /project -s workspace-write < task-NNN.md
  4. cote-lapyx-qa-reviewer → QA APPROVED
  5. npm run build → exit 0

Phase 2 — Integration branch  integration/NNN-page-name
  6. git checkout -b integration/NNN-page-name
  7. merge --no-ff all feature/* branches
  8. cote-lapyx-qa-reviewer (full page, responsive 320/768/1280) → APPROVED

Phase 3 — Merge to main + deploy
  9. merge integration → main → push (GitHub Actions → rsync → Apache)
```

**QA checklist per phase:**

- Build exits 0
- Comments in every HTML section, SCSS block, JS function
- fetchWithAuth() for all authenticated API calls (no raw fetch)
- escHtml() for all innerHTML assignments
- No **container with flex/grid (layout on **inner/\_\_grid children only)
- Responsive: 320 / 768 / 1280 tested

## Rules

- SCSS → BEM methodology, mobile-first
- Always use `fetchWithAuth()` — never raw fetch with Authorization header
- Security review required before auth code changes go live
- Test vite dev locally before deploying
- Commit on every logical block of work
- Comments in HTML/SCSS/JS are required (user preference)

## Never Search

- SCSS/HTML syntax, BEM naming, Vite config
- Spring Boot basics, JPA/Hibernate, JWT concepts
- Git commands, npm scripts
