# cote-lapyx — Artifact Registry

Актуальний стан артефактів проєкту. Оновлювати після кожного sprint.

Last updated: 2026-05-19

## API Contract

- File: `docs/api-v1.yaml` (OpenAPI 3.1)
- Swagger UI: https://api.cote-lapyx.com/swagger-ui/index.html
- Agent for changes: `cote-api-contract`

## Active tasks (ai-tasks)

| Task                            | File                                            | Status      |
| ------------------------------- | ----------------------------------------------- | ----------- |
| i18n full coverage              | task-025-i18n-full-coverage.md                  | in progress |
| docs sync                       | task-029-docs-sync.md                           | pending     |
| locale in fetch                 | task-030-locale-in-fetch.md                     | pending     |
| docstring deepl cleanup         | task-032-docstring-deepl-cleanup.md             | done        |
| project translations            | task-033-project-translations.md                | pending     |
| locale-aware responses          | task-034-locale-aware-responses.md              | pending     |
| team member translations        | task-035-team-member-translations.md            | pending     |
| remove v1 translations          | task-036-remove-v1-translations.md              | pending     |
| backend email/contact notify    | task-037-backend-email-change-contact-notify.md | pending     |
| frontend like/width/gap/email   | task-038-frontend-like-width-gap-email.md       | pending     |
| backend sprint4 likes/comments  | task-039-backend-sprint4-likes-comments.md      | pending     |
| frontend sprint4 likes/comments | task-040-frontend-sprint4-likes-comments.md     | pending     |
| favorites panel                 | task-048-favorites-panel.md                     | pending     |
| backend perf                    | task-049-backend-perf.md                        | pending     |

## Implemented features

- JWT auth (login/register/refresh)
- Posts (CRUD, covers, i18n)
- Projects (CRUD, author link)
- Team members (avatars, lazy init)
- Comments (basic)
- Likes (basic)
- i18n: uk/en/fr/de via LibreTranslate (self-hosted)
- Geo-locale endpoint
- Contact form → email notification
- Accessibility sprint (a11y WCAG)

## Design mockups

- Figma: (add link when available)
- Style guide: `src/styles/cyberpunk.scss` + `src/styles/settings.scss`

## Known issues / unexpected findings

See `~/.ai-tasks/unexpected-findings.md`
