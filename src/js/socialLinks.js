// =============================================================================
// socialLinks.js — Company social/contact links module
// Fetches GET /api/v1/contacts (public), caches in localStorage (5 min TTL),
// and renders icon anchors into every [data-social-slot] container on the page.
// Called on DOMContentLoaded for pages that have [data-social-slot] elements.
// =============================================================================

// -----------------------------------------------------------------------------
// SVG icon dictionary — keyed by lowercase platform name.
// Sourced from admin-social-settings-mock.html ICONS object.
// Each entry is a raw SVG string (20×20 viewBox, fill="currentColor").
// -----------------------------------------------------------------------------
const SOCIAL_ICONS = {
  // Telegram messenger icon
  telegram:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.835l-2.94-.916c-.638-.203-.65-.638.135-.943l11.49-4.43c.533-.194 1.001.13.949.675z"/></svg>',

  // GitHub icon
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>',

  // Instagram icon
  instagram:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>',

  // Facebook icon
  facebook:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',

  // LinkedIn icon
  linkedin:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',

  // Email/envelope icon
  email:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
};

// -----------------------------------------------------------------------------
// Platform display names — used as aria-label fallback
// -----------------------------------------------------------------------------
const PLATFORM_NAMES = {
  telegram: "Telegram",
  github: "GitHub",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  email: "Email",
};

// -----------------------------------------------------------------------------
// Cache constants — company links cached in localStorage for 5 minutes
// -----------------------------------------------------------------------------
const CACHE_KEY = "cl_site_links";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Base API URL for company contacts
const CONTACTS_API = "https://api.cote-lapyx.com/api/v1/contacts";

// -----------------------------------------------------------------------------
// escHtml — sanitize user-facing strings before injecting into innerHTML.
// CSP disallows inline handlers, so NO onerror/onclick attributes.
// -----------------------------------------------------------------------------
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// -----------------------------------------------------------------------------
// normalizeHref — builds the correct href for a contact entry.
// EMAIL type: normalize bare address to mailto: href.
// Others: use value as-is (backend returns full URL).
// -----------------------------------------------------------------------------
function normalizeHref(type, value) {
  // Lowercase type to normalize (wire sends UPPERCASE)
  const t = type.toLowerCase();
  if (t === "email") {
    // Already a mailto: href — return as-is; otherwise prefix
    return value.startsWith("mailto:") ? value : `mailto:${value}`;
  }
  return value;
}

// -----------------------------------------------------------------------------
// buildIconHtml — renders a single social icon anchor.
// Classes are determined by the slot's context (passed as cssClass param).
// Uses the project's existing BEM classes so SCSS rules still apply.
// External links get target="_blank" rel="noopener noreferrer".
// EMAIL links stay in the same tab (no target).
// -----------------------------------------------------------------------------
function buildIconHtml(contact, cssClass) {
  // Normalize type to lowercase for icon lookup
  const platform = contact.type.toLowerCase();
  const svgIcon = SOCIAL_ICONS[platform] || "";
  const href = normalizeHref(contact.type, contact.value);

  // Prefer contact label; fall back to platform display name
  const ariaLabel = escHtml(
    contact.label || PLATFORM_NAMES[platform] || platform,
  );

  // External links need rel + target; mailto stays in same tab
  const isExternal = !href.startsWith("mailto:");
  const externalAttrs = isExternal
    ? ' target="_blank" rel="noopener noreferrer"'
    : "";

  return `<a href="${escHtml(href)}" class="${escHtml(cssClass)}" aria-label="${ariaLabel}"${externalAttrs}>${svgIcon}</a>`;
}

// -----------------------------------------------------------------------------
// getCssClassForSlot — map slot name to the correct BEM class for the anchor.
// Each slot's HTML uses an existing CSS class that is already styled.
// -----------------------------------------------------------------------------
function getCssClassForSlot(slotName) {
  // Map slot names to their component's social-link BEM class
  const slotClassMap = {
    footer: "footer__social-link",
    "footer-contacts": "footer__contact-item",
    cta: "cta__social-link",
  };
  return slotClassMap[slotName] || "social-link";
}

// -----------------------------------------------------------------------------
// buildContactItemHtml — renders a full contact-item card (icon + label + value).
// Used by the contact page slot ("contact") which expects the rich card layout.
// Matches the .contact-item BEM structure in contact.scss.
// -----------------------------------------------------------------------------
function buildContactItemHtml(contact) {
  const platform = contact.type.toLowerCase();
  const svgIcon = SOCIAL_ICONS[platform] || "";
  const href = normalizeHref(contact.type, contact.value);

  // Colour modifier for icon circle — cyan for primary, magenta for secondary
  const iconColorMap = {
    email: "cyan",
    telegram: "cyan",
    github: "magenta",
    linkedin: "magenta",
    facebook: "green",
    instagram: "green",
  };
  const colorMod = iconColorMap[platform] || "cyan";

  // Display value: strip mailto: prefix for email display
  const displayValue =
    platform === "email"
      ? contact.value.replace(/^mailto:/, "")
      : contact.label || PLATFORM_NAMES[platform] || platform;

  // aria-label describes the action + destination
  const ariaLabel = escHtml(
    `${PLATFORM_NAMES[platform] || platform}: ${displayValue}`,
  );

  // External links get target + rel; email stays in same tab
  const isExternal = !href.startsWith("mailto:");
  const externalAttrs = isExternal
    ? ' target="_blank" rel="noopener noreferrer"'
    : "";

  // Build the rich card markup matching .contact-item BEM structure
  return `<a class="contact-item" href="${escHtml(href)}" aria-label="${ariaLabel}"${externalAttrs}>
    <span class="contact-item__icon contact-item__icon--${colorMod}" aria-hidden="true">
      ${svgIcon}
    </span>
    <span class="contact-item__body">
      <span class="contact-item__label">${escHtml(PLATFORM_NAMES[platform] || platform)}</span>
      <span class="contact-item__value">${escHtml(displayValue)}</span>
    </span>
  </a>`;
}

// -----------------------------------------------------------------------------
// buildFooterContactItemHtml — renders a footer__contact-item anchor.
// Used by the footer contacts column slot ("footer-contacts").
// Matches .footer__contact-item BEM structure with SVG icon + text label.
// -----------------------------------------------------------------------------
function buildFooterContactItemHtml(contact) {
  const platform = contact.type.toLowerCase();
  const svgIcon = SOCIAL_ICONS[platform] || "";
  const href = normalizeHref(contact.type, contact.value);

  // Display text: for email show the address; for others show label or platform name
  const displayText =
    platform === "email"
      ? contact.value.replace(/^mailto:/, "")
      : contact.label || PLATFORM_NAMES[platform] || platform;

  // External links get target + rel; email stays in same tab
  const isExternal = !href.startsWith("mailto:");
  const externalAttrs = isExternal
    ? ' target="_blank" rel="noopener noreferrer"'
    : "";

  return `<a href="${escHtml(href)}" class="footer__contact-item"${externalAttrs}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="footer__contact-icon" aria-hidden="true">
      ${svgIcon.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
    </svg>
    ${escHtml(displayText)}
  </a>`;
}

// -----------------------------------------------------------------------------
// loadContacts — fetch company contacts from API with localStorage cache.
// Cache key: cl_site_links, TTL: 5 min.
// Returns an array of contact objects (may be empty on network error).
// -----------------------------------------------------------------------------
async function loadContacts() {
  // Check localStorage cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      // Cache hit: return if not expired
      if (Date.now() - ts < CACHE_TTL) {
        return data;
      }
    }
  } catch {
    // Corrupted cache entry — ignore and re-fetch
    localStorage.removeItem(CACHE_KEY);
  }

  // Cache miss or expired — fetch from public API (no auth required)
  try {
    const res = await fetch(CONTACTS_API);
    if (!res.ok) return [];
    const data = await res.json();
    // Persist to localStorage with timestamp
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    return data;
  } catch {
    // Network error — return empty array; slots stay empty (no broken # links)
    return [];
  }
}

// -----------------------------------------------------------------------------
// renderCompanyLinks — fetch company contacts and inject icon anchors into
// every [data-social-slot] container found on the current page.
// Slot type determines the rendered markup:
//   "footer"          → footer__social-link icon anchors
//   "footer-contacts" → footer__contact-item anchors with SVG icon + text
//   "cta"             → cta__social-link icon anchors
//   "contact"         → contact-item rich cards (icon circle + label + value)
// Slots with no enabled links are left empty (no placeholder # anchors).
// -----------------------------------------------------------------------------
export async function renderCompanyLinks() {
  // Find all social slots on the page
  const slots = document.querySelectorAll("[data-social-slot]");
  if (!slots.length) return;

  // Load contacts from API or cache
  const contacts = await loadContacts();

  // Filter to contacts that have both a type and a value
  const validContacts = contacts.filter((c) => c.value && c.type);

  // Render each slot independently
  slots.forEach((slot) => {
    const slotName = slot.dataset.socialSlot;

    let html = "";

    if (slotName === "contact") {
      // Contact page slot — rich card format with icon circle + label + value
      html = validContacts.map(buildContactItemHtml).join("");
    } else if (slotName === "footer-contacts") {
      // Footer contacts column — text link format with icon + display name
      html = validContacts.map(buildFooterContactItemHtml).join("");
    } else {
      // All other slots (footer, cta) — compact icon-only anchors
      const cssClass = getCssClassForSlot(slotName);
      html = validContacts.map((c) => buildIconHtml(c, cssClass)).join("");
    }

    // Inject rendered links — empty string leaves slot empty (no broken # links)
    slot.innerHTML = html;
  });
}

// -----------------------------------------------------------------------------
// invalidateCompanyLinksCache — exported for admin save flow.
// Call this after a successful PATCH /admin/contacts to force re-fetch
// on the next renderCompanyLinks() call.
// -----------------------------------------------------------------------------
export function invalidateCompanyLinksCache() {
  // Remove the cached entry so next load hits the API
  localStorage.removeItem(CACHE_KEY);
}

// -----------------------------------------------------------------------------
// Auto-init — render company links on DOMContentLoaded if slots exist.
// Runs on every page; no-ops gracefully when [data-social-slot] is absent.
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Only run if there are any social slots on this page
  if (document.querySelector("[data-social-slot]")) {
    renderCompanyLinks();
  }
});
