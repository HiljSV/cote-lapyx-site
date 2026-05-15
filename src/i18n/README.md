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
btn.read_more      — shared CTA buttons
index.team.title   — page-specific section headings
```

## How translations are applied

`src/js/i18n.js` loads all 4 JSON files at bundle time (Vite resolves them statically).

- `data-i18n="key"` on an element → `el.textContent = translations[lang][key]`
- `data-i18n-aria="key"` on an element → `el.setAttribute("aria-label", translations[lang][key])`

Language detection priority (see `detectLanguage()` in `i18n.js`):

1. `localStorage.cl_lang` — previously saved user choice
2. `GET https://api.cote-lapyx.com/api/v1/locale` — server-side geo-IP
3. `navigator.language` — browser preference
4. `"en"` — default fallback

## Adding a new language

1. Create `src/i18n/{code}.json` with all keys from `uk.json`.
2. Add the code to `SUPPORTED` and `TRANSLATIONS` in `src/js/i18n.js`.
3. Add a `<button class="header__lang-btn" data-lang="{code}">` in `header.html`.
4. Extend `GEO_TO_LANG` in `i18n.js` if needed.

## Adding a new translation key

1. Add the key + Ukrainian value to `uk.json`.
2. Add translations to `en.json`, `fr.json`, `de.json`.
3. Add `data-i18n="{key}"` to the relevant HTML element.
