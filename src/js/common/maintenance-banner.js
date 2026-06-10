// =============================================================================
// maintenance-banner.js
// Fetches GET /api/v1/site-settings/public (public endpoint, no auth).
// If maintenanceMode === true, inserts and reveals a persistent fixed banner
// below the header. When maintenanceUntil is set, appends a localized ETA.
// Fails silently on any network or parse error.
// =============================================================================

// Public settings API endpoint — no auth required
const PUBLIC_SETTINGS_URL =
  "https://api.cote-lapyx.com/api/v1/site-settings/public";

// i18n keys used by the banner (resolved at render time via translate())
const I18N_BANNER_TEXT = "maintenance.banner_text";
const I18N_UNTIL_PREFIX = "maintenance.until_prefix";

// LS key for current language — same key as in i18n.js (no coupling import needed)
const LS_LANG_KEY = "cl_lang";

// =============================================================================
// escHtml — minimal XSS-safe HTML escaping for dynamic strings
// =============================================================================
function escHtml(str) {
  // Escape the 5 HTML special characters: &, <, >, ", '
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// =============================================================================
// getTranslation — minimal sync translation resolver for the banner.
// The full i18n system (i18n.js) is asynchronous and may not be settled yet
// when the banner fetches. We read localStorage directly and do a direct
// import of the translation bundles to avoid a timing dependency.
// =============================================================================
import uk from "../../i18n/uk.json";
import en from "../../i18n/en.json";
import fr from "../../i18n/fr.json";
import de from "../../i18n/de.json";

// All loaded translation dictionaries keyed by ISO 639-1 language code
const TRANSLATIONS = { uk, en, fr, de };

/**
 * Resolve a translation key for the given (or detected) language.
 * Falls back to Ukrainian, then returns the raw key if not found.
 *
 * @param {string} key   - i18n key
 * @param {string} [lang] - language code; defaults to localStorage value
 * @returns {string}
 */
function t(key, lang) {
  // Detect language from localStorage (set by the full i18n switcher)
  const resolvedLang = lang || localStorage.getItem(LS_LANG_KEY) || "uk";
  const bundle = TRANSLATIONS[resolvedLang] || TRANSLATIONS["uk"];
  return bundle[key] !== undefined ? bundle[key] : key;
}

// =============================================================================
// formatEtaDate — locale-aware date-time formatting for maintenanceUntil
// =============================================================================
/**
 * Format an ISO 8601 date-time string to a human-readable, locale-aware string.
 * Uses the user's current language from localStorage.
 *
 * @param {string} isoString - ISO 8601 date-time from API
 * @returns {string}         - localized date+time string
 */
function formatEtaDate(isoString) {
  // Resolve locale from localStorage; map internal code to BCP-47 tag
  const langCode = localStorage.getItem(LS_LANG_KEY) || "uk";

  // Map language codes to BCP-47 locale tags for Intl.DateTimeFormat
  const LOCALE_MAP = {
    uk: "uk-UA",
    en: "en-GB",
    fr: "fr-FR",
    de: "de-DE",
  };
  const locale = LOCALE_MAP[langCode] || "uk-UA";

  try {
    const date = new Date(isoString);
    // Return localized date with hour:minute (no seconds)
    return date.toLocaleString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    // If parsing fails, return the raw string as-is (already sanitized below)
    return isoString;
  }
}

// =============================================================================
// injectBanner — create the banner DOM element and insert it after the header.
// Called only when maintenanceMode === true.
// =============================================================================
/**
 * Create and insert the maintenance banner element.
 *
 * @param {string|null} maintenanceUntil - ISO 8601 ETA or null
 * @returns {HTMLElement} - the inserted banner element
 */
function injectBanner(maintenanceUntil) {
  // Resolve banner text and optional ETA in user's language
  const bannerText = t(I18N_BANNER_TEXT);
  const untilPrefix = t(I18N_UNTIL_PREFIX);

  // Build optional ETA segment
  let etaHtml = "";
  if (maintenanceUntil) {
    // Format the date; escape the result to guard against unexpected characters
    const formattedDate = escHtml(formatEtaDate(maintenanceUntil));
    const prefixEscaped = escHtml(untilPrefix);
    etaHtml = `
      <!-- Maintenance banner: ETA segment -->
      <span class="maintenance-banner__eta" aria-live="polite">
        — ${prefixEscaped} ${formattedDate}
      </span>`;
  }

  // Create the banner element (not via innerHTML to avoid any risk)
  const banner = document.createElement("div");
  banner.id = "maintenance-banner";
  banner.className = "maintenance-banner";
  // role=status announces the banner to screen readers without interrupting
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.setAttribute("aria-atomic", "true");

  // Banner inner content (all dynamic strings escaped)
  banner.innerHTML = `
    <!-- Maintenance banner: inner container (max-width wrapper only) -->
    <div class="maintenance-banner__inner">
      <!-- Maintenance banner: flex row with icon + message + optional ETA -->
      <div class="maintenance-banner__body">
        <!-- Icon — aria-hidden, purely decorative -->
        <span class="maintenance-banner__icon" aria-hidden="true">🛠</span>
        <!-- Main message text -->
        <span class="maintenance-banner__text">${escHtml(bannerText)}</span>
        ${etaHtml}
      </div>
    </div>`;

  // Insert the banner as the first child of <body> so it sits above all content
  // but below position:fixed header (z-index handles the visual stacking)
  const header = document.getElementById("header");
  if (header && header.nextSibling) {
    // Insert immediately after the header element
    header.parentNode.insertBefore(banner, header.nextSibling);
  } else {
    // Fallback: prepend to body
    document.body.prepend(banner);
  }

  return banner;
}

// =============================================================================
// revealBanner — trigger the CSS animation after layout paint
// =============================================================================
/**
 * Trigger the slide-in animation on the banner.
 * Uses a double rAF to ensure the browser has painted display:block
 * before we add the transform transition class.
 *
 * @param {HTMLElement} banner
 */
function revealBanner(banner) {
  // First: set display:block via is-visible class
  banner.classList.add("is-visible");

  // Second: after one paint cycle, trigger the transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      banner.classList.add("is-animated");
    });
  });
}

// =============================================================================
// initMaintenanceBanner — main entry point
// Fetches public settings, shows banner when mode is active.
// All errors are caught and silently ignored (non-critical progressive feature).
// =============================================================================
export async function initMaintenanceBanner() {
  // Guard: skip on admin and dashboard pages — those are privileged pages
  // where admins work specifically during maintenance; banner is irrelevant there.
  if (
    window.location.pathname.includes("admin.html") ||
    window.location.pathname.includes("dashboard.html")
  ) {
    return;
  }

  try {
    // Fetch public settings — plain fetch, no auth (public endpoint)
    const res = await fetch(PUBLIC_SETTINGS_URL);

    // If the endpoint is down or returns an error, fail silently
    if (!res.ok) return;

    const data = await res.json();

    // Show banner only when maintenanceMode is explicitly true
    if (data.maintenanceMode !== true) return;

    // Inject and animate the banner with optional ETA
    const banner = injectBanner(data.maintenanceUntil || null);
    revealBanner(banner);

    // Push page content down so the fixed banner does not cover the top of the
    // page. `.page` already carries padding-top:70px to clear the sticky header;
    // add the banner's measured height on top of that. Re-measured on resize
    // because the banner wraps to multiple lines on narrow viewports.
    const page = document.querySelector(".page");
    if (page) {
      const applyBannerOffset = () => {
        page.style.paddingTop = `${70 + banner.offsetHeight}px`;
      };
      applyBannerOffset();
      window.addEventListener("resize", applyBannerOffset);
    }
  } catch (_) {
    // Silent fail — network error, CORS, JSON parse error — all ignored
    // The banner is a non-critical progressive enhancement
  }
}
