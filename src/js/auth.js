// =============================================================================
// auth.js — Login & Register page logic
// =============================================================================

// Import translate() for runtime i18n lookups — replaces hardcoded Ukrainian strings
import { translate } from "@js/i18n.js";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Show an inline field error */
function showError(errorEl, message) {
  errorEl.textContent = message;
}

/** Clear an inline field error */
function clearError(errorEl) {
  errorEl.textContent = "";
}

/** Validate email with RFC-like regex */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Set button to loading state */
function setLoading(btn, label) {
  btn.classList.add("is-loading");
  btn.disabled = true;
  btn.dataset.originalText = btn.textContent;
  btn.textContent = label;
}

/** Restore button from loading state */
function clearLoading(btn) {
  btn.classList.remove("is-loading");
  btn.disabled = false;
  btn.textContent = btn.dataset.originalText ?? btn.textContent;
}

/** Show server error block */
function showServerError(el, message) {
  el.textContent = message;
  el.hidden = false;
}

/** Hide server error block */
function hideServerError(el) {
  el.hidden = true;
  el.textContent = "";
}

// -----------------------------------------------------------------------------
// Toggle password visibility
// -----------------------------------------------------------------------------

/**
 * Find all buttons with [data-toggle-password] and wire show/hide behavior.
 * data-toggle-password value = id of the target <input>
 */
function initPasswordToggles() {
  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-toggle-password");
      const input = document.getElementById(targetId);
      if (!input) return;

      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.setAttribute(
        "aria-label",
        isHidden
          ? translate("auth.toggle.hide")
          : translate("auth.toggle.show"),
      );
    });
  });
}

// -----------------------------------------------------------------------------
// Password strength meter
// -----------------------------------------------------------------------------

/**
 * Evaluate password strength.
 * @returns {'weak'|'medium'|'strong'|'very-strong'}
 */
function getPasswordStrength(value) {
  const len = value.length;
  const hasDigit = /\d/.test(value);
  const hasSpecial = /[^a-zA-Z0-9]/.test(value);

  if (len < 8) return "weak";
  if (len >= 12 && hasDigit && hasSpecial) return "very-strong";
  if (len >= 8 && (hasDigit || hasSpecial)) return "strong";
  return "medium";
}

// Strength label is resolved at call time via translate() (i18n), keyed by level.
// Explicit literal keys (not built dynamically) so the i18n checker can verify them.
function getStrengthLabel(level) {
  switch (level) {
    case "medium":
      return translate("auth.strength.medium");
    case "strong":
      return translate("auth.strength.strong");
    case "very-strong":
      return translate("auth.strength.very_strong");
    case "weak":
    default:
      return translate("auth.strength.weak");
  }
}

/**
 * Initialize strength meter for a password input.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} fillEl  — .auth-form__strength-fill
 * @param {HTMLElement} labelEl — .auth-form__strength-label
 */
function initStrengthMeter(input, fillEl, labelEl) {
  if (!input || !fillEl || !labelEl) return;

  input.addEventListener("input", () => {
    const val = input.value;

    if (!val) {
      // Reset
      fillEl.className = "auth-form__strength-fill";
      labelEl.className = "auth-form__strength-label";
      labelEl.textContent = "";
      return;
    }

    const level = getPasswordStrength(val);
    fillEl.className = `auth-form__strength-fill ${level}`;
    labelEl.className = `auth-form__strength-label ${level}`;
    labelEl.textContent = getStrengthLabel(level);
  });
}

// -----------------------------------------------------------------------------
// Login form
// -----------------------------------------------------------------------------

function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const emailError = document.getElementById("login-email-error");
  const passwordError = document.getElementById("login-password-error");
  const serverError = document.getElementById("login-server-error");
  const submitBtn = document.getElementById("login-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous errors
    clearError(emailError);
    clearError(passwordError);
    hideServerError(serverError);

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let valid = true;

    // Validate email
    if (!email) {
      showError(emailError, translate("auth.error.email_required"));
      valid = false;
    } else if (!isValidEmail(email)) {
      showError(emailError, translate("auth.error.email_invalid"));
      valid = false;
    }

    // Validate password
    if (!password) {
      showError(passwordError, translate("auth.error.password_required"));
      valid = false;
    }

    if (!valid) return;

    // Submit
    setLoading(submitBtn, translate("auth.loading"));

    try {
      const res = await fetch("https://api.cote-lapyx.com/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.accessToken) {
        // Store JWT tokens
        localStorage.setItem("cl_access", data.accessToken);
        localStorage.setItem("cl_refresh", data.refreshToken);
        window.location.href = "/dashboard.html";
      } else {
        showServerError(
          serverError,
          data.detail ?? data.message ?? translate("auth.error.login_failed"),
        );
      }
    } catch {
      showServerError(serverError, translate("auth.error.network"));
    } finally {
      clearLoading(submitBtn);
    }
  });
}

// -----------------------------------------------------------------------------
// Register form
// -----------------------------------------------------------------------------

function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const nameInput = document.getElementById("reg-name");
  const emailInput = document.getElementById("reg-email");
  const passwordInput = document.getElementById("reg-password");
  const confirmInput = document.getElementById("reg-confirm");
  const nameError = document.getElementById("reg-name-error");
  const emailError = document.getElementById("reg-email-error");
  const passwordError = document.getElementById("reg-password-error");
  const confirmError = document.getElementById("reg-confirm-error");
  const serverError = document.getElementById("reg-server-error");
  const submitBtn = document.getElementById("reg-submit");

  // Password strength meter
  initStrengthMeter(
    passwordInput,
    document.getElementById("reg-strength-fill"),
    document.getElementById("reg-strength-label"),
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous errors
    clearError(nameError);
    clearError(emailError);
    clearError(passwordError);
    clearError(confirmError);
    hideServerError(serverError);

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const role =
      form.querySelector('input[name="role"]:checked')?.value ?? "subscriber";

    let valid = true;

    // Validate name
    if (!name) {
      showError(nameError, translate("auth.error.name_required"));
      valid = false;
    } else if (name.length < 2) {
      showError(nameError, translate("auth.error.name_min"));
      valid = false;
    }

    // Validate email
    if (!email) {
      showError(emailError, translate("auth.error.email_required"));
      valid = false;
    } else if (!isValidEmail(email)) {
      showError(emailError, translate("auth.error.email_invalid"));
      valid = false;
    }

    // Validate password
    if (!password) {
      showError(passwordError, translate("auth.error.password_required"));
      valid = false;
    } else if (password.length < 8) {
      showError(passwordError, translate("auth.error.password_min"));
      valid = false;
    }

    // Validate confirm password
    if (!confirm) {
      showError(confirmError, translate("auth.error.confirm_required"));
      valid = false;
    } else if (password && confirm !== password) {
      showError(confirmError, translate("auth.error.password_mismatch"));
      valid = false;
    }

    if (!valid) return;

    // Submit
    setLoading(submitBtn, translate("auth.loading"));

    try {
      const res = await fetch(
        "https://api.cote-lapyx.com/api/v1/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        },
      );

      const data = await res.json();

      if (res.ok && data.accessToken) {
        localStorage.setItem("cl_access", data.accessToken);
        localStorage.setItem("cl_refresh", data.refreshToken);
        window.location.href = "/dashboard.html";
      } else {
        showServerError(
          serverError,
          data.detail ??
            data.message ??
            translate("auth.error.register_failed"),
        );
      }
    } catch {
      showServerError(serverError, translate("auth.error.network"));
    } finally {
      clearLoading(submitBtn);
    }
  });
}

// -----------------------------------------------------------------------------
// Init on DOM ready
// -----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggles();
  initLoginForm();
  initRegisterForm();

  // Show registration success banner when arriving from register page
  if (new URLSearchParams(window.location.search).get("registered") === "1") {
    const banner = document.getElementById("login-reg-success");
    if (banner) banner.removeAttribute("hidden");
  }
});
