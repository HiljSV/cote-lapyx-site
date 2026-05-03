// =============================================================================
// Dashboard — Owner cabinet JS
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------------------------
  // Element refs
  // ---------------------------------------------------------------------------

  const sidebar = document.getElementById("dash-sidebar");
  const overlay = document.getElementById("dash-overlay");
  const mobileToggle = document.getElementById("dash-mobile-toggle");
  const closeBtn = document.getElementById("dash-sidebar-close");
  const logoutBtn = document.getElementById("dash-logout");
  const navLinks = document.querySelectorAll(".dash-sidebar__nav-link");
  const panels = document.querySelectorAll(".dash-section-panel");

  if (!sidebar) return; // not on dashboard page

  // Token guard — runs only on dashboard page (after sidebar check)
  if (!localStorage.getItem("cl_access")) {
    window.location.replace("/login.html");
    return;
  }

  // Load user data: reveal admin link + populate profile form + update sidebar
  (async () => {
    try {
      const res = await fetch("https://api.cote-lapyx.com/api/v1/users/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("cl_access")}`,
        },
      });
      if (!res.ok) return;
      const user = await res.json();

      // Reveal admin link for admin users
      if (user.isAdmin) {
        document.getElementById("dash-admin-link")?.removeAttribute("hidden");
      }

      // Populate profile form with real data
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
      };
      setVal("profile-name", user.name);
      setVal("profile-email", user.email);
      setVal("profile-role", user.role);
      setVal("profile-bio", user.bio);

      // Update sidebar user info block
      const nameEl = document.querySelector(".dash-sidebar__name");
      const initEl = document.querySelector(".dash-sidebar__avatar");
      if (nameEl && user.name) nameEl.textContent = user.name;
      if (initEl && user.name) {
        const parts = user.name.trim().split(" ");
        const initials =
          parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
        initEl.textContent = initials.toUpperCase();
      }
    } catch (_) {}
  })();

  // ---------------------------------------------------------------------------
  // Sidebar open / close (mobile)
  // ---------------------------------------------------------------------------

  function openSidebar() {
    sidebar.classList.add("is-open");
    overlay.classList.add("is-visible");
    overlay.removeAttribute("aria-hidden");
    mobileToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden"; // prevent page scroll behind drawer
    document.addEventListener("keydown", handleEsc);
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    mobileToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = ""; // restore page scroll
    document.removeEventListener("keydown", handleEsc);
  }

  function handleEsc(e) {
    if (e.key === "Escape") {
      closeSidebar();
      mobileToggle.focus();
    }
  }

  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = sidebar.classList.contains("is-open");
      if (isOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  // Click on overlay closes sidebar
  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  // X close button inside the sidebar
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeSidebar();
      mobileToggle?.focus();
    });
  }

  // ---------------------------------------------------------------------------
  // Section navigation (SPA-style panel switching)
  // ---------------------------------------------------------------------------

  /**
   * Activate a named section panel and update nav link states.
   * @param {string} sectionName - value of data-section / data-panel attribute
   */
  function activateSection(sectionName) {
    // Update nav links
    navLinks.forEach((link) => {
      const isTarget = link.dataset.section === sectionName;
      link.classList.toggle("is-active", isTarget);
      link.setAttribute("aria-current", isTarget ? "page" : "false");
    });

    // Show/hide panels
    panels.forEach((panel) => {
      const isTarget = panel.dataset.panel === sectionName;
      if (isTarget) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    });
  }

  // Nav link click handler
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      if (!section) return;
      activateSection(section);
      // Close sidebar on mobile after navigation
      if (window.innerWidth <= 991.98) {
        closeSidebar();
      }
    });
  });

  // "All posts / All projects" shortcut links inside overview panel
  document.querySelectorAll("[data-section-link]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const section = el.dataset.sectionLink;
      if (section) activateSection(section);
    });
  });

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const refreshToken = localStorage.getItem("cl_refresh");
      if (refreshToken) {
        // Best-effort logout call — don't block redirect on failure
        fetch("https://api.cote-lapyx.com/api/v1/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
      localStorage.removeItem("cl_access");
      localStorage.removeItem("cl_refresh");
      window.location.replace("/login.html");
    });
  }

  // ---------------------------------------------------------------------------
  // Password visibility toggles
  // ---------------------------------------------------------------------------

  document.querySelectorAll(".pwd-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      btn.querySelector(".pwd-toggle__eye").style.display = isVisible
        ? ""
        : "none";
      btn.querySelector(".pwd-toggle__eye-off").style.display = isVisible
        ? "none"
        : "";
      btn.setAttribute(
        "aria-label",
        isVisible ? "Показати пароль" : "Сховати пароль",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Profile form — PATCH /api/v1/users/me
  // ---------------------------------------------------------------------------

  const profileForm = document.getElementById("dash-profile-form");

  profileForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = profileForm.querySelector('[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = "Збереження...";

    const body = {
      name: document.getElementById("profile-name")?.value?.trim() || undefined,
      bio: document.getElementById("profile-bio")?.value?.trim() || undefined,
    };

    // Strip keys with undefined values before sending
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

    try {
      const res = await fetch("https://api.cote-lapyx.com/api/v1/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("cl_access")}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        submitBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Збережено`;
        setTimeout(() => {
          submitBtn.innerHTML = originalHTML;
          submitBtn.disabled = false;
        }, 2500);
      } else {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
        alert("Помилка збереження. Спробуйте ще раз.");
      }
    } catch {
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
      alert("Помилка з'єднання.");
    }
  });

  // ---------------------------------------------------------------------------
  // Password change form
  // ---------------------------------------------------------------------------

  const passwordForm = document.getElementById("dash-password-form");
  const pwdFeedback = document.getElementById("pwd-feedback");
  const pwdSubmitBtn = document.getElementById("pwd-submit-btn");

  /**
   * Display an inline feedback message inside the password form.
   * @param {string} message - Text to display
   * @param {"success"|"error"} type - Modifier suffix for BEM class
   */
  function showPwdFeedback(message, type) {
    pwdFeedback.innerHTML = `<p class="dash-profile-form__feedback dash-profile-form__feedback--${type}">${message}</p>`;
    pwdFeedback.removeAttribute("hidden");
  }

  passwordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPwd = document.getElementById("pwd-current").value;
    const newPwd = document.getElementById("pwd-new").value;
    const confirmPwd = document.getElementById("pwd-confirm").value;

    // Hide any previous feedback before re-validation
    pwdFeedback.setAttribute("hidden", "");

    if (newPwd.length < 8) {
      showPwdFeedback("Новий пароль має бути не менше 8 символів.", "error");
      return;
    }

    if (newPwd !== confirmPwd) {
      showPwdFeedback("Паролі не збігаються.", "error");
      return;
    }

    const originalHTML = pwdSubmitBtn.innerHTML;
    pwdSubmitBtn.disabled = true;
    pwdSubmitBtn.textContent = "Збереження...";

    try {
      const res = await fetch(
        "https://api.cote-lapyx.com/api/v1/users/me/password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("cl_access")}`,
          },
          body: JSON.stringify({
            currentPassword: currentPwd,
            newPassword: newPwd,
          }),
        },
      );

      if (res.status === 204) {
        showPwdFeedback(
          "Пароль успішно змінено. На вашу пошту надіслано сповіщення.",
          "success",
        );
        passwordForm.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          data.message || "Помилка зміни пароля. Перевірте поточний пароль.";
        showPwdFeedback(msg, "error");
      }
    } catch {
      showPwdFeedback("Помилка з'єднання. Спробуйте ще раз.", "error");
    } finally {
      pwdSubmitBtn.disabled = false;
      pwdSubmitBtn.innerHTML = originalHTML;
    }
  });
});
