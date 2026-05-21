# cote-lapyx — Decision Log

Чому прийняті ключові рішення. Оновлювати при архітектурних змінах.

## 2026-05-19 — docs/ai/ structure added

**Decision:** Add docs/ai/ to all active projects.
**Why:** Global CLAUDE.md was too coupled to cote-lapyx specifics. Project-level docs allow Claude to read project context on demand without polluting global rules.
**Impact:** Global CLAUDE.md now has generic pipeline; project pipeline details live here.

## 2026-05-19 — Agent rename: Frontend-Dev-Agent-HTML-SCSS-JS → frontend-html-scss-js

**Decision:** Rename agents to lowercase-kebab-case.
**Why:** Inconsistent naming caused confusion. `Frontenddevdgent-react-next-js` had a typo. Standardized to lowercase.
**Impact:** CLAUDE.md agent table updated. Old files deleted.

## 2026-05-19 — codex-safe wrapper created

**Decision:** Create `/usr/local/bin/codex-safe` wrapper for Codex CLI.
**Why:** Codex installed via NVM is invisible in non-interactive shells (hooks, automation, scripts).
**Impact:** Use `codex-safe exec ...` instead of `codex exec ...` in all ai-tasks and hooks.

## Stack decisions (earlier)

| Decision                     | Why                                                    |
| ---------------------------- | ------------------------------------------------------ |
| FLS/Vite as frontend bundler | Fast iteration, PostHTML components, SCSS, JS bundling |
| Spring Boot 3.3 backend      | Java team familiarity, production-ready auth/security  |
| JWT in localStorage          | Simple implementation; XSS risk mitigated by escHtml() |
| fetchWithAuth() wrapper      | Centralized token refresh logic, no raw Bearer headers |
| LibreTranslate for i18n      | Self-hosted, no API key/cost, runs on localhost:5000   |
| BEM methodology              | Predictable, avoids specificity wars in large SCSS     |
| Cyberpunk/neon design        | Brand identity for IT team site                        |
