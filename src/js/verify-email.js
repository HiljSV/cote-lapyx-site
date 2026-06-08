// =============================================================================
// verify-email.js — Email verification page logic
// Reads ?token= from the URL, POSTs to /auth/verify-email (public endpoint),
// then swaps the loading state for a success or error state.
// =============================================================================

import {
  detectLanguage,
  applyTranslations,
  initI18nSwitcher,
  translate,
} from "@js/i18n.js";

// Public API base URL (no auth required for these endpoints)
const API = "https://api.cote-lapyx.com/api/v1";

// -----------------------------------------------------------------------------
// escHtml — escape user-facing strings before injecting into innerHTML
// -----------------------------------------------------------------------------

/**
 * Escape special HTML characters to prevent XSS when injecting into innerHTML.
 * @param {unknown} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// -----------------------------------------------------------------------------
// State helpers — swap visible panel
// -----------------------------------------------------------------------------

/**
 * Hide the checking state and reveal the success state.
 */
function showSuccess() {
  // Hide the loading/checking panel
  const checking = document.getElementById("verify-checking");
  if (checking) checking.setAttribute("hidden", "");

  // Reveal the success panel
  const success = document.getElementById("verify-success");
  if (success) success.removeAttribute("hidden");
}

/**
 * Hide the checking state and reveal the error state with the given message.
 * @param {string} message - Error detail to display (already escaped or translated)
 */
function showError(message) {
  // Hide the loading/checking panel
  const checking = document.getElementById("verify-checking");
  if (checking) checking.setAttribute("hidden", "");

  // Populate the error message paragraph with escaped content
  const errorText = document.getElementById("verify-error-text");
  if (errorText) {
    // Use textContent (not innerHTML) — message is always a plain string
    errorText.textContent = message;
  }

  // Reveal the error panel
  const error = document.getElementById("verify-error");
  if (error) error.removeAttribute("hidden");
}

// -----------------------------------------------------------------------------
// verifyToken — main logic
// -----------------------------------------------------------------------------

/**
 * Read the ?token= query param, POST it to /auth/verify-email,
 * and display the appropriate success or error state.
 *
 * This is a public endpoint — plain fetch() is correct here (no auth header).
 */
async function verifyToken() {
  // Read token from the URL query string
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  // Guard: no token in URL — show an immediate error
  if (!token) {
    showError(translate("auth.verify_email.no_token"));
    return;
  }

  try {
    // POST to the public verify endpoint — no Bearer token, no credentials needed
    const res = await fetch(`${API}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (res.ok) {
      // Verification succeeded — show the success panel
      showSuccess();
    } else {
      // Server returned an error — parse detail if available
      const data = await res.json().catch(() => ({}));
      const message =
        data.detail ||
        data.message ||
        translate("auth.verify_email.error_text");
      // showError assigns via textContent, which already neutralizes HTML —
      // pass the raw message (no escHtml, otherwise entities would render literally)
      showError(message);
    }
  } catch {
    // Network failure — show a generic translated error
    showError(translate("auth.verify_email.error_text"));
  }
}

// -----------------------------------------------------------------------------
// Init on DOM ready
// -----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  // Apply i18n first so all data-i18n attributes are translated before
  // the state panels are shown (prevents flash of untranslated text)
  const lang = await detectLanguage();
  applyTranslations(lang);
  initI18nSwitcher(lang);

  // Start verification — replaces checking state with success or error
  verifyToken();
});
