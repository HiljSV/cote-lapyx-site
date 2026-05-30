// =============================================================================
// contact.js — Contact form submission handler
// Endpoint: POST https://api.cote-lapyx.com/api/v1/contact
// Public endpoint — no JWT authentication required, use plain fetch()
// =============================================================================

// Import translate() for runtime i18n lookups — replaces all hardcoded Ukrainian strings
import { translate } from "@js/i18n.js";

const API = "https://api.cote-lapyx.com/api/v1/contact";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const submit = document.getElementById("cf-submit");
  const successBanner = document.getElementById("cf-success");
  const errorBanner = document.getElementById("cf-error");
  const errorText = document.getElementById("cf-error-text");

  // Clear field error as soon as the user starts typing
  form
    .querySelectorAll(".contact-form__input, .contact-form__textarea")
    .forEach((el) => {
      el.addEventListener("input", () => clearFieldError(el));
    });

  // ---- Submit handler ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Client-side validation before hitting the network
    if (!validateForm(form)) return;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    // Honeypot field — sent as-is; backend silently discards submission if non-blank
    const website = form.website?.value ?? "";

    // Disable submit button while the request is in flight
    submit.disabled = true;
    // Use i18n key — was hardcoded "Надсилаємо..."
    submit.textContent = translate("contact.sending");
    hideBanners();

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });

      if (res.status === 201) {
        // Success — reset form, show success banner
        form.reset();
        successBanner.hidden = false;
        successBanner.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (res.status === 429) {
        // Rate limit — translated message with cooldown info
        showError(translate("contact.error.rate_limit"));
      } else if (res.status === 400) {
        // Validation error from the server — show API message if present, fall back to i18n
        const data = await res.json();
        showError(data.message || translate("contact.error.invalid_fields"));
      } else {
        // Any other non-2xx response — translated generic error
        showError(translate("contact.error.generic"));
      }
    } catch {
      // Network error / no connection — translated error
      showError(translate("contact.error.network"));
    } finally {
      // Always re-enable the button and restore translated label
      submit.disabled = false;
      submit.textContent = translate("contact.submit");
    }
  });

  // ---- Validation ----

  /**
   * Validates all three fields.
   * Returns true if all fields are valid, false otherwise.
   * @param {HTMLFormElement} form
   * @returns {boolean}
   */
  function validateForm(form) {
    let valid = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    // Validate name — minimum 2 chars, translated error message
    if (name.length < 2) {
      showFieldError("cf-name", translate("contact.validate.name_min"));
      valid = false;
    }

    // Validate email — basic RFC format check, translated error message
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError("cf-email", translate("contact.validate.email_invalid"));
      valid = false;
    }

    // Validate message — minimum 10 chars, translated error message
    if (message.length < 10) {
      showFieldError("cf-message", translate("contact.validate.message_min"));
      valid = false;
    }

    return valid;
  }

  // ---- Helpers ----

  /**
   * Shows an inline error under a specific field.
   * Adds --error modifier to the input/textarea.
   * @param {string} fieldId  — id of the input/textarea
   * @param {string} msg      — error message text
   */
  function showFieldError(fieldId, msg) {
    const errEl = document.getElementById(`${fieldId}-error`);
    const inputEl = document.getElementById(fieldId);

    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }

    if (inputEl) {
      inputEl.classList.add("contact-form__input--error");
    }
  }

  /**
   * Clears the inline error for a given input/textarea element.
   * Removes the --error modifier class.
   * @param {HTMLInputElement|HTMLTextAreaElement} el
   */
  function clearFieldError(el) {
    const errEl = document.getElementById(`${el.id}-error`);

    if (errEl) {
      errEl.textContent = "";
      errEl.hidden = true;
    }

    el.classList.remove("contact-form__input--error");
  }

  /**
   * Shows the global error banner with a custom message.
   * Scrolls it into view.
   * @param {string} msg
   */
  function showError(msg) {
    errorText.textContent = msg;
    errorBanner.hidden = false;
    errorBanner.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /** Hides both the success and error banners. */
  function hideBanners() {
    successBanner.hidden = true;
    errorBanner.hidden = true;
  }
});
