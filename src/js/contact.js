// =============================================================================
// contact.js — Contact form submission handler
// Endpoint: POST https://api.cote-lapyx.com/api/v1/contact
// Public endpoint — no JWT authentication required, use plain fetch()
// =============================================================================

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

    // Disable submit button while the request is in flight
    submit.disabled = true;
    submit.textContent = "Надсилаємо...";
    hideBanners();

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.status === 201) {
        // Success — reset form, show success banner
        form.reset();
        successBanner.hidden = false;
        successBanner.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (res.status === 429) {
        // Rate limit — friendly message with cooldown info
        showError("Забагато запитів. Спробуйте через 15 хвилин.");
      } else if (res.status === 400) {
        // Validation error from the server — show API message if present
        const data = await res.json();
        showError(data.message || "Перевірте правильність заповнених полів.");
      } else {
        // Any other non-2xx response
        showError(
          "Щось пішло не так. Спробуйте ще раз або напишіть нам у Telegram.",
        );
      }
    } catch {
      // Network error / no connection
      showError(
        "Немає зʼєднання з сервером. Перевірте інтернет і спробуйте ще раз.",
      );
    } finally {
      // Always re-enable the button regardless of outcome
      submit.disabled = false;
      submit.textContent = "Надіслати";
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

    if (name.length < 2) {
      showFieldError("cf-name", "Ім'я повинно містити не менше 2 символів");
      valid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError("cf-email", "Введіть коректний email");
      valid = false;
    }

    if (message.length < 10) {
      showFieldError(
        "cf-message",
        "Повідомлення повинно містити не менше 10 символів",
      );
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
