// =============================================================================
// i18n.js — language detection, translation application, switcher wiring
// Exports: detectLanguage(), applyTranslations(lang), initI18nSwitcher(lang)
// =============================================================================

// Import translation bundles (Vite resolves JSON imports statically)
import uk from "../i18n/uk.json";
import en from "../i18n/en.json";
import fr from "../i18n/fr.json";
import de from "../i18n/de.json";

// All loaded translation dictionaries keyed by ISO 639-1 language code
const TRANSLATIONS = { uk, en, fr, de };

// Supported language codes (ISO 639-1)
const SUPPORTED = ["uk", "en", "fr", "de"];

// Map of country codes (ISO 3166-1 alpha-2) to language codes
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

// Public geo-IP endpoint — no auth needed (plain fetch is correct here)
const GEO_ENDPOINT = "https://api.cote-lapyx.com/api/v1/locale";

// localStorage key for persisted language choice
const LS_KEY = "cl_lang";

// Module-level tracker — updated by applyTranslations(), read by translate()
// Default is "uk" (P2-4) — site primary language; detection (below) may override.
let _currentLang = "uk";

// =============================================================================
// detectLanguage — async, returns resolved language code
// Priority: 1) localStorage → 2) navigator.language → 3) geo-IP → 4) "uk"
// navigator comes before geo-IP because browser language reflects user preference
// better than physical location (e.g. a Ukrainian user in France expects UK/EN, not FR)
// =============================================================================
export async function detectLanguage() {
  // 1. Previously persisted user choice takes top priority
  const saved = localStorage.getItem(LS_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;

  // 2. Browser language preference — navigator.languages covers all user-set langs
  // navigator.languages returns ordered list; we take the first supported one
  const navLangs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const l of navLangs) {
    const code = l?.slice(0, 2).toLowerCase();
    if (code && SUPPORTED.includes(code)) return code;
  }

  // 3. Geo-IP detection — fallback when browser language is not in our supported list
  // (e.g. browser is set to Arabic, user is in Germany → detect DE via geo)
  try {
    const res = await fetch(GEO_ENDPOINT);
    if (res.ok) {
      const { countryCode } = await res.json();
      // Map country to language if we have a mapping for it
      if (countryCode && GEO_TO_LANG[countryCode]) {
        return GEO_TO_LANG[countryCode];
      }
    }
  } catch (_) {
    // Silent fallback — geo endpoint may be unavailable (network error, CORS, etc.)
  }

  // 4. Default fallback — site primary language is Ukrainian (P2-4)
  return "uk";
}

// =============================================================================
// applyTranslations — update all [data-i18n], [data-i18n-aria], [data-i18n-placeholder] elements
// Also sets document.documentElement.lang and persists choice to localStorage
// =============================================================================
export function applyTranslations(lang) {
  // Track active language so translate() can look up values at runtime
  _currentLang = lang;

  // Use requested language, fall back to Ukrainian (primary) if unknown
  const t = TRANSLATIONS[lang] || TRANSLATIONS["uk"];

  // Apply text content to all translatable elements
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) {
      el.textContent = t[key];
    }
  });

  // Apply aria-label to all elements with data-i18n-aria attribute
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.dataset.i18nAria;
    if (t[key] !== undefined) {
      el.setAttribute("aria-label", t[key]);
    }
  });

  // Apply placeholder text to all elements with data-i18n-placeholder attribute
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key] !== undefined) {
      el.setAttribute("placeholder", t[key]);
    }
  });

  // Set the lang attribute on <html> for screen readers and SEO
  document.documentElement.lang = lang;

  // Persist user choice to localStorage for future visits
  localStorage.setItem(LS_KEY, lang);

  // Notify page modules that need to re-render dynamic content with the new language
  document.dispatchEvent(
    new CustomEvent("cl:languagechange", { detail: { lang } }),
  );
}

// =============================================================================
// translate — look up a single key in the currently active language
// Safe to call any time after applyTranslations() has run at least once
// =============================================================================
export function translate(key) {
  const t = TRANSLATIONS[_currentLang] || TRANSLATIONS["uk"];
  return t[key] !== undefined ? t[key] : key;
}

// =============================================================================
// initI18nSwitcher — wire language switcher buttons after DOM is ready
// Sets active state on current language button and listens for click events
// =============================================================================
export function initI18nSwitcher(currentLang) {
  // All language switcher buttons in the header
  const btns = document.querySelectorAll(".header__lang-btn[data-lang]");

  // The mobile toggle label that shows the current language code
  const currentLabel = document.querySelector(".header__lang-current");

  // Set initial active state based on detected/saved language
  btns.forEach((btn) => {
    const isActive = btn.dataset.lang === currentLang;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  // Update mobile toggle label to match current language
  if (currentLabel) {
    currentLabel.textContent = currentLang.toUpperCase();
  }

  // Listen for language changes from switcher buttons
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;

      // Ignore clicks on unsupported language codes
      if (!SUPPORTED.includes(lang)) return;

      // Update active state on all buttons
      btns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");

      // Update mobile toggle label
      if (currentLabel) currentLabel.textContent = lang.toUpperCase();

      // Apply translations for the newly selected language
      applyTranslations(lang);
    });
  });
}
