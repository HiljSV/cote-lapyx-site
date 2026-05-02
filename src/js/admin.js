// =============================================================================
// Admin Panel — Site administrator interface JS
// SPA-style section switching, mobile sidebar drawer, comment filter tabs
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------------------------
  // Element refs
  // ---------------------------------------------------------------------------

  const sidebar = document.getElementById("admin-sidebar");

  // Guard: exit early if not on the admin page
  if (!sidebar) return;

  // Token guard — redirect to login if not authenticated
  if (!localStorage.getItem("cl_access")) {
    window.location.replace("/login.html");
    return;
  }

  const overlay = document.getElementById("admin-overlay");
  const mobileToggle = document.getElementById("admin-mobile-toggle");
  const closeBtn = document.getElementById("admin-sidebar-close");
  const logoutBtn = document.getElementById("admin-logout");
  const navLinks = sidebar.querySelectorAll(".dash-sidebar__nav-link");
  const panels = document.querySelectorAll(".admin-section-panel");

  // ---------------------------------------------------------------------------
  // Sidebar open / close (mobile drawer)
  // ---------------------------------------------------------------------------

  /** Open the sidebar drawer and block scroll on overlay */
  function openSidebar() {
    sidebar.classList.add("is-open");
    overlay.classList.add("is-visible");
    overlay.removeAttribute("aria-hidden");
    mobileToggle?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden"; // prevent page scroll behind drawer
    document.addEventListener("keydown", handleEsc);
  }

  /** Close the sidebar drawer */
  function closeSidebar() {
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    mobileToggle?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = ""; // restore page scroll
    document.removeEventListener("keydown", handleEsc);
  }

  /** Close on Escape key */
  function handleEsc(e) {
    if (e.key === "Escape") {
      closeSidebar();
      mobileToggle?.focus();
    }
  }

  // Mobile toggle button
  mobileToggle?.addEventListener("click", () => {
    if (sidebar.classList.contains("is-open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // Click on backdrop overlay closes sidebar
  overlay?.addEventListener("click", closeSidebar);

  // X close button inside the sidebar
  closeBtn?.addEventListener("click", () => {
    closeSidebar();
    mobileToggle?.focus();
  });

  // ---------------------------------------------------------------------------
  // Section navigation (SPA-style panel switching)
  // ---------------------------------------------------------------------------

  /**
   * Show the requested panel and update nav link active states.
   * @param {string} sectionName - matches data-section and data-panel attributes
   */
  function activateSection(sectionName) {
    // Update nav link styles and aria-current
    navLinks.forEach((link) => {
      const isTarget = link.dataset.section === sectionName;
      link.classList.toggle("is-active", isTarget);
      link.setAttribute("aria-current", isTarget ? "page" : "false");
    });

    // Show target panel, hide all others
    panels.forEach((panel) => {
      if (panel.dataset.panel === sectionName) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    });
  }

  // Click handler for sidebar nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      if (!section) return;
      activateSection(section);
      // Close sidebar drawer on mobile after navigation
      if (window.innerWidth <= 991.98) {
        closeSidebar();
      }
    });
  });

  // "All users" shortcut link inside overview panel
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

  logoutBtn?.addEventListener("click", async () => {
    const refreshToken = localStorage.getItem("cl_refresh");
    if (refreshToken) {
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

  // ---------------------------------------------------------------------------
  // Comment filter tabs (Всі / Очікують / Спам)
  // Visual-only toggle — no real filtering in this static demo
  // ---------------------------------------------------------------------------

  const filterTabs = document.querySelectorAll(".admin-filter-tab");

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active from all tabs
      filterTabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      // Activate clicked tab
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
    });
  });

  // ---------------------------------------------------------------------------
  // Settings form — save feedback (static demo, no real API)
  // ---------------------------------------------------------------------------

  const settingsForm = document.getElementById("admin-settings-form");

  settingsForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const submitBtn = settingsForm.querySelector('[type="submit"]');
    const originalHTML = submitBtn.innerHTML;

    // Visual "saved" feedback
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
      Збережено
    `;
    submitBtn.disabled = true;

    // Restore button after 2.5 s
    setTimeout(() => {
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
    }, 2500);
  });
});
