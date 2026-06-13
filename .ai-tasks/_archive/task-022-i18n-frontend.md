# Task 022 — Frontend i18n: JSON translations + detectLanguage() + data-i18n wiring

## Meta

- **Date:** 2026-05-15
- **Project:** cote-lapyx (frontend)
- **Branch:** feature/component-022-i18n-frontend
- **Agent:** cote-lapyx-frontend-dev
- **Created by:** Claude Code

---

## Project Context

- **Path:** /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
- **Stack:** HTML/SCSS/JS (FLS, Vite)
- **Root:** `src/`
- **Build command:** npm run build
- **Aliases:** `@js` → `src/js/`, `@components` → `src/components/`
- **Config files (DO NOT TOUCH):** vite.config.js, template.config.js, package.json, any SCSS files

---

## Goal

Wire the existing language switcher to real translations: detect user language on first visit (geo-IP or browser), apply UI translations from JSON files, persist the choice in localStorage.

---

## Background

- Language switcher UI already exists in `header.html` with buttons `data-lang="ua|en|fr|de"`.
- `app.js` has `initLangSwitcher()` — currently UI-only (no actual translation applied).
- The app.js already reads `localStorage.getItem("cl_lang")` — NOT set yet.
- Geo-endpoint `/api/v1/locale` is live at `https://api.cote-lapyx.com/api/v1/locale` → `{countryCode:"UA"}`.
- Language codes used everywhere must be lowercase: `uk`, `en`, `fr`, `de` (NOT `ua`).
- **Bug to fix:** `data-lang="ua"` in header.html must be changed to `data-lang="uk"`.
- **Translations scope:** header + footer (shared components) + key index.html buttons/titles.
  Page content (blog posts, project descriptions) is handled by backend task-023.

---

## Requirements

### 1. Create JSON translation files

Create 4 files in `src/i18n/`:

**`src/i18n/uk.json`** (Ukrainian — source language):

```json
{
  "nav.home": "Головна",
  "nav.about": "Про нас",
  "nav.team": "Команда",
  "nav.services": "Послуги",
  "nav.projects": "Проекти",
  "nav.blog": "Блог",
  "nav.contact": "Контакт",

  "header.login": "Увійти",
  "header.dashboard": "Кабінет",
  "header.open_menu": "Відкрити меню",
  "header.close_menu": "Закрити меню",
  "header.theme_toggle": "Перемкнути тему",

  "footer.tagline": "IT-студія повного циклу — frontend, backend, дизайн. Перетворюємо ідеї на продукти.",
  "footer.nav_title": "Навігація",
  "footer.contacts_title": "Контакти",
  "footer.copyright": "© 2019–2026 cote-lapyx. Всі права захищені.",
  "footer.powered": "Powered by",

  "btn.view_profile": "Переглянути профіль",
  "btn.our_services": "Наші послуги",
  "btn.projects": "Проекти",
  "btn.connect": "Зв'язатись",
  "btn.all_projects": "Всі проекти",
  "btn.read_more": "Читати далі",

  "index.about.title": "Про нас",
  "index.team.title": "Команда",
  "index.team.subtitle": "Три спеціалісти — один результат",
  "index.services.title": "Послуги",
  "index.services.subtitle": "Що ми вміємо і пропонуємо",
  "index.projects.title": "Вибрані проекти",
  "index.projects.subtitle": "Частина того, що ми побудували",
  "index.blog.title": "Спільний блог"
}
```

**`src/i18n/en.json`** (English):

```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "nav.team": "Team",
  "nav.services": "Services",
  "nav.projects": "Projects",
  "nav.blog": "Blog",
  "nav.contact": "Contact",

  "header.login": "Login",
  "header.dashboard": "Dashboard",
  "header.open_menu": "Open menu",
  "header.close_menu": "Close menu",
  "header.theme_toggle": "Toggle theme",

  "footer.tagline": "Full-cycle IT studio — frontend, backend, design. We turn ideas into products.",
  "footer.nav_title": "Navigation",
  "footer.contacts_title": "Contacts",
  "footer.copyright": "© 2019–2026 cote-lapyx. All rights reserved.",
  "footer.powered": "Powered by",

  "btn.view_profile": "View profile",
  "btn.our_services": "Our Services",
  "btn.projects": "Projects",
  "btn.connect": "Contact us",
  "btn.all_projects": "All projects",
  "btn.read_more": "Read more",

  "index.about.title": "About us",
  "index.team.title": "Team",
  "index.team.subtitle": "Three specialists — one result",
  "index.services.title": "Services",
  "index.services.subtitle": "What we do and offer",
  "index.projects.title": "Selected projects",
  "index.projects.subtitle": "Part of what we have built",
  "index.blog.title": "Team blog"
}
```

**`src/i18n/fr.json`** (French):

```json
{
  "nav.home": "Accueil",
  "nav.about": "À propos",
  "nav.team": "Équipe",
  "nav.services": "Services",
  "nav.projects": "Projets",
  "nav.blog": "Blog",
  "nav.contact": "Contact",

  "header.login": "Connexion",
  "header.dashboard": "Tableau de bord",
  "header.open_menu": "Ouvrir le menu",
  "header.close_menu": "Fermer le menu",
  "header.theme_toggle": "Changer le thème",

  "footer.tagline": "Studio IT full-cycle — frontend, backend, design. Nous transformons les idées en produits.",
  "footer.nav_title": "Navigation",
  "footer.contacts_title": "Contacts",
  "footer.copyright": "© 2019–2026 cote-lapyx. Tous droits réservés.",
  "footer.powered": "Propulsé par",

  "btn.view_profile": "Voir le profil",
  "btn.our_services": "Nos services",
  "btn.projects": "Projets",
  "btn.connect": "Nous contacter",
  "btn.all_projects": "Tous les projets",
  "btn.read_more": "Lire la suite",

  "index.about.title": "À propos",
  "index.team.title": "Équipe",
  "index.team.subtitle": "Trois spécialistes — un résultat",
  "index.services.title": "Services",
  "index.services.subtitle": "Ce que nous faisons et proposons",
  "index.projects.title": "Projets sélectionnés",
  "index.projects.subtitle": "Une partie de ce que nous avons construit",
  "index.blog.title": "Blog de l'équipe"
}
```

**`src/i18n/de.json`** (German):

```json
{
  "nav.home": "Startseite",
  "nav.about": "Über uns",
  "nav.team": "Team",
  "nav.services": "Dienstleistungen",
  "nav.projects": "Projekte",
  "nav.blog": "Blog",
  "nav.contact": "Kontakt",

  "header.login": "Anmelden",
  "header.dashboard": "Dashboard",
  "header.open_menu": "Menü öffnen",
  "header.close_menu": "Menü schließen",
  "header.theme_toggle": "Design wechseln",

  "footer.tagline": "Full-Cycle IT-Studio — Frontend, Backend, Design. Wir machen aus Ideen Produkte.",
  "footer.nav_title": "Navigation",
  "footer.contacts_title": "Kontakte",
  "footer.copyright": "© 2019–2026 cote-lapyx. Alle Rechte vorbehalten.",
  "footer.powered": "Powered by",

  "btn.view_profile": "Profil ansehen",
  "btn.our_services": "Unsere Dienste",
  "btn.projects": "Projekte",
  "btn.connect": "Kontaktieren",
  "btn.all_projects": "Alle Projekte",
  "btn.read_more": "Weiterlesen",

  "index.about.title": "Über uns",
  "index.team.title": "Team",
  "index.team.subtitle": "Drei Spezialisten — ein Ergebnis",
  "index.services.title": "Dienstleistungen",
  "index.services.subtitle": "Was wir können und anbieten",
  "index.projects.title": "Ausgewählte Projekte",
  "index.projects.subtitle": "Ein Teil von dem, was wir gebaut haben",
  "index.blog.title": "Team-Blog"
}
```

---

### 2. Create `src/js/i18n.js`

```js
// i18n module: language detection, translation application, switcher wiring
import uk from "../i18n/uk.json";
import en from "../i18n/en.json";
import fr from "../i18n/fr.json";
import de from "../i18n/de.json";

const TRANSLATIONS = { uk, en, fr, de };
const SUPPORTED = ["uk", "en", "fr", "de"];
const GEO_TO_LANG = {
  UA: "uk",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  CA: "fr",
  DE: "de",
  AT: "de",
  CH: "de",
};
const GEO_ENDPOINT = "https://api.cote-lapyx.com/api/v1/locale";
const LS_KEY = "cl_lang";

// Detect language: 1) localStorage 2) geo-IP 3) navigator.language 4) "en"
export async function detectLanguage() {
  const saved = localStorage.getItem(LS_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;

  try {
    const res = await fetch(GEO_ENDPOINT);
    if (res.ok) {
      const { countryCode } = await res.json();
      if (countryCode && GEO_TO_LANG[countryCode]) {
        return GEO_TO_LANG[countryCode];
      }
    }
  } catch (_) {
    /* silent fallback */
  }

  const nav = navigator.language?.slice(0, 2).toLowerCase();
  return SUPPORTED.includes(nav) ? nav : "en";
}

// Apply translations to all [data-i18n] elements in the DOM
export function applyTranslations(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS["en"];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) {
      el.textContent = t[key];
    }
  });

  // Update aria-label on elements with data-i18n-aria
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    if (t[key] !== undefined) {
      el.setAttribute("aria-label", t[key]);
    }
  });

  // Set lang attribute on <html>
  document.documentElement.lang = lang === "uk" ? "uk" : lang;

  localStorage.setItem(LS_KEY, lang);
}

// Wire language switcher buttons (call after DOM ready)
export function initI18nSwitcher(currentLang) {
  const btns = document.querySelectorAll(".header__lang-btn[data-lang]");
  const currentLabel = document.querySelector(".header__lang-current");

  // Set active state on current language button
  btns.forEach((btn) => {
    const isActive = btn.dataset.lang === currentLang;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  if (currentLabel) {
    currentLabel.textContent = currentLang.toUpperCase();
  }

  // Listen for language changes
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      if (!SUPPORTED.includes(lang)) return;

      btns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");

      if (currentLabel) currentLabel.textContent = lang.toUpperCase();

      applyTranslations(lang);
    });
  });
}
```

---

### 3. Modify `src/js/app.js`

Add at the TOP of the file (before other code, after existing imports):

```js
import {
  detectLanguage,
  applyTranslations,
  initI18nSwitcher,
} from "@js/i18n.js";
```

Replace the existing `initLangSwitcher` IIFE (the one marked "UI only — no actual i18n in prototype") with:

```js
// =============================================================================
// i18n — language detection + translation + switcher
// =============================================================================
(async function initI18n() {
  const lang = await detectLanguage();
  applyTranslations(lang);
  initI18nSwitcher(lang);
})();
```

**Remove** the old `initLangSwitcher` IIFE entirely (it handled only UI state — the new `initI18nSwitcher` from i18n.js replaces it).

---

### 4. Modify `src/components/layout/header/header.html`

- Fix bug: `data-lang="ua"` → `data-lang="uk"` (ISO 639-1 code for Ukrainian)
- Add `data-i18n` attributes to all nav links and buttons:

```html
<!-- Nav links — add data-i18n to text content -->
<a href="/" class="header__nav-link" data-nav-link
  ><span data-i18n="nav.home">Головна</span></a
>
<a href="about.html" class="header__nav-link" data-nav-link
  ><span data-i18n="nav.about">Про нас</span></a
>
<a href="team.html" class="header__nav-link" data-nav-link
  ><span data-i18n="nav.team">Команда</span></a
>
<a href="services.html" class="header__nav-link" data-nav-link
  ><span data-i18n="nav.services">Послуги</span></a
>
<a href="projects.html" class="header__nav-link" data-nav-link
  ><span data-i18n="nav.projects">Проекти</span></a
>
<a href="blog.html" class="header__nav-link" data-nav-link
  ><span data-i18n="nav.blog">Блог</span></a
>
<a href="contact.html" class="header__nav-link" data-nav-link
  ><span data-i18n="nav.contact">Контакт</span></a
>

<!-- Login/Dashboard buttons -->
<a href="login.html" ... id="header-login-btn"
  ><span data-i18n="header.login">Увійти</span></a
>
<a href="dashboard.html" ... id="header-user-btn" hidden
  ><span data-i18n="header.dashboard">Кабінет</span></a
>

<!-- Burger button: add data-i18n-aria for aria-label -->
<button
  ...
  id="burger-btn"
  data-i18n-aria="header.open_menu"
  aria-label="Відкрити меню"
></button>
```

Note: wrap text in `<span data-i18n="key">` so the surrounding element structure is preserved.

---

### 5. Modify `src/components/layout/footer/footer.html`

Add `data-i18n` to:

- `footer__tagline` text → `data-i18n="footer.tagline"`
- `footer__nav-title` "Навігація" → `data-i18n="footer.nav_title"`
- `footer__nav-title` "Контакти" → `data-i18n="footer.contacts_title"`
- `footer__copyright` content → `data-i18n="footer.copyright"`
- footer nav links (same as header: nav.home, nav.about, etc.)

```html
<p class="footer__tagline" data-i18n="footer.tagline">
  IT-студія повного циклу...
</p>
<p class="footer__nav-title" data-i18n="footer.nav_title">Навігація</p>
<p class="footer__nav-title" data-i18n="footer.contacts_title">Контакти</p>
<p class="footer__copyright">
  &copy;
  <span data-i18n="footer.copyright"
    >© 2019–2026 cote-lapyx. Всі права захищені.</span
  >
</p>
```

Note: The `&copy;` is HTML entity — put `data-i18n` on a `<span>` inside for the text, OR include the © in the JSON value and apply to the `<p>` directly (preferred — simpler).

---

### 6. Modify `src/components/pages/index/index.html`

Add `data-i18n` to key text nodes:

- Hero CTA buttons: `data-i18n="btn.our_services"`, `data-i18n="btn.projects"`, `data-i18n="btn.connect"`
- Section titles: `data-i18n="index.about.title"`, `data-i18n="index.team.title"` etc.
- Section subtitles: `data-i18n="index.team.subtitle"` etc.
- "Переглянути профіль" buttons: `data-i18n="btn.view_profile"` (3 instances)
- "Всі проекти" button: `data-i18n="btn.all_projects"`

Use `<span data-i18n="key">` wrapper when needed to preserve surrounding elements.

---

## Forbidden

- Do NOT touch vite.config.js, template.config.js, package.json
- Do NOT modify SCSS files
- Do NOT touch blog.html, team.html, projects.html, contact.html, login.html etc. (scope: header + footer + index only)
- Do NOT add any npm packages
- Do NOT push to remote

---

## Files to Create

- `src/i18n/uk.json`
- `src/i18n/en.json`
- `src/i18n/fr.json`
- `src/i18n/de.json`
- `src/js/i18n.js`

## Files to Modify

- `src/js/app.js` — import i18n.js, replace initLangSwitcher with initI18n
- `src/components/layout/header/header.html` — data-i18n, fix data-lang="ua"→"uk"
- `src/components/layout/footer/footer.html` — data-i18n on text nodes
- `src/components/pages/index/index.html` — data-i18n on buttons and section titles

---

## Acceptance Criteria

- [ ] 4 JSON files created in src/i18n/
- [ ] `i18n.js` exports `detectLanguage`, `applyTranslations`, `initI18nSwitcher`
- [ ] `app.js` calls detectLanguage() on load and applies translations
- [ ] `data-lang="ua"` fixed to `data-lang="uk"` in header
- [ ] Nav links in header/footer have data-i18n spans
- [ ] Index page key buttons and section titles have data-i18n
- [ ] `npm run build` passes without errors
- [ ] Comments present in i18n.js (every function block)
- [ ] Git commit on branch feature/component-022-i18n-frontend

---

## Expected Commit Message

```
feat(i18n): add frontend translations (uk/en/fr/de) + detectLanguage + data-i18n wiring

- 4 JSON translation files (uk, en, fr, de) with 30+ keys each
- i18n.js: detectLanguage (geo-IP → navigator → fallback), applyTranslations, initI18nSwitcher
- header.html: data-i18n on all nav links, fix data-lang=ua→uk
- footer.html: data-i18n on tagline, nav titles, copyright
- index.html: data-i18n on hero CTAs, section titles/subtitles, team cards
- app.js: replace UI-only initLangSwitcher with real i18n init
```
