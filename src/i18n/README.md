# i18n — UI Translation Files

Static JSON translation dictionaries for the cote-lapyx frontend.

## Supported languages

| Code | Language  | File      |
| ---- | --------- | --------- |
| `uk` | Ukrainian | `uk.json` |
| `en` | English   | `en.json` |
| `fr` | French    | `fr.json` |
| `de` | German    | `de.json` |

## Key format

Keys use dot-notation grouped by UI area:

```
nav.home           — navigation links
header.login       — header buttons and controls
footer.tagline     — footer text blocks
index.team.title   — page-specific section headings
```

## How translations are applied

`src/js/i18n.js` loads all 4 JSON files at bundle time (Vite resolves them statically).

Three HTML attributes are supported:

- `data-i18n="key"` → `el.textContent = t[key]`
- `data-i18n-aria="key"` → `el.setAttribute("aria-label", t[key])`
- `data-i18n-placeholder="key"` → `el.setAttribute("placeholder", t[key])`

For keys needed in JS at runtime (not via HTML attribute), use the exported `translate(key)` function from `i18n.js`.

Language detection priority (see `detectLanguage()` in `i18n.js`):

1. `localStorage.cl_lang` — previously saved user choice
2. `navigator.languages[]` — full ordered browser language list (first supported wins)
3. `GET https://api.cote-lapyx.com/api/v1/locale` — geo-IP fallback for unsupported browser langs
4. `"en"` — default fallback

## Validation

Run before every commit to catch broken references and key mismatches:

```bash
npm run i18n:check
```

Checks performed by `scripts/i18n-check.mjs`:

- All 4 JSON files have identical key sets (no missing / extra keys)
- No empty, null, or undefined values
- Every `data-i18n*` attribute in HTML resolves to an existing key
- Every `translate("key")` call in JS resolves to an existing key
- No orphan keys (defined in JSON but never referenced)

## Adding a new language

1. Create `src/i18n/{code}.json` with all keys from `uk.json`.
2. Add the code to `SUPPORTED` and `TRANSLATIONS` in `src/js/i18n.js`.
3. Add a `<button class="header__lang-btn" data-lang="{code}">` in `header.html`.
4. Extend `GEO_TO_LANG` in `i18n.js` if needed.

## Adding a new translation key

1. Add the key + Ukrainian value to `uk.json`.
2. Add translations to `en.json`, `fr.json`, `de.json`.
3. Add `data-i18n="{key}"` to the relevant HTML element.
