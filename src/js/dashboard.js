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
  // Profile form — save feedback (static demo, no real API)
  // ---------------------------------------------------------------------------

  const profileForm = document.getElementById("dash-profile-form");

  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const submitBtn = profileForm.querySelector('[type="submit"]');
      const originalText = submitBtn.innerHTML;

      // Visual feedback
      submitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Збережено
      `;
      submitBtn.disabled = true;

      // Restore after 2.5s
      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }, 2500);
    });
  }
});
