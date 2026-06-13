# Task 029 — Sync API documentation with implementation

## Branch
`feature/component-029-docs-sync`
Checkout from: main
Frontend repo: /home/hilj/code/active/cote-lapyx_project/cote-lapyx

## Goal
Update three documentation files to match the actual implementation.

---

## Fix 1 — docs/api-v1.yaml

File: `docs/api-v1.yaml`

**Problem:** `servers[0].url` is `https://cote-lapyx.com/api/v1` but the real backend runs at `https://api.cote-lapyx.com/api/v1`.

**Fix:** Change the production server URL:
```yaml
servers:
  - url: https://api.cote-lapyx.com/api/v1
    description: Production
```

**Also add** the `/locale` endpoint that exists in backend (LocaleController) but is missing from the spec:

```yaml
/locale:
  get:
    summary: Detect language from request geo-IP
    description: Returns ISO 3166-1 alpha-2 country code inferred from client IP. Used by frontend for language auto-detection.
    tags: [Locale]
    responses:
      '200':
        description: Country code detected
        content:
          application/json:
            schema:
              type: object
              properties:
                countryCode:
                  type: string
                  example: UA
```

---

## Fix 2 — CHECKLIST.md

File: `CHECKLIST.md` (in the root of the cote-lapyx frontend repo)

If the file exists, find and update these items:
- Mark as done (change `[ ]` to `[x]`):
  - i18n / мультиязичність статичного UI (JSON + data-i18n + language switcher)
  - about.html, services.html, contact.html
  - sitemap.xml, robots.txt
  - Контактна форма → API (already wired to POST /api/v1/contact)

- Add a note that `src/php` directory has been removed.

If CHECKLIST.md does not exist, skip this fix.

---

## Rules
- Read each file before editing
- Only change what is described above — do not refactor or reorganize
- Comments required on every changed block
- Run `npm run i18n:check` at the end to confirm no regressions
- Commit all changes on the feature branch

## Commit message
```
docs: sync api-v1.yaml base URL + add /locale endpoint, update CHECKLIST
```
