// =============================================================================
// Admin Panel — Site administrator interface JS
// SPA-style section switching, mobile sidebar drawer, comment filter tabs
// =============================================================================

import { fetchWithAuth } from "@js/common/auth.js";
import { invalidateCompanyLinksCache } from "@js/socialLinks.js";

// i18n — runtime translation lookup for dynamically rendered strings
import {
  detectLanguage,
  applyTranslations,
  initI18nSwitcher,
  translate,
} from "@js/i18n.js";

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

  // Admin guard + sidebar hydration from /users/me
  fetchWithAuth("https://api.cote-lapyx.com/api/v1/users/me")
    .then((res) => (res.ok ? res.json() : null))
    .then((user) => {
      if (!user?.isAdmin) {
        window.location.replace("/dashboard.html");
        return;
      }

      // Hydrate sidebar name, role badge, and avatar
      const nameEl = document.getElementById("admin-sidebar-name");
      const badgeEl = document.getElementById("admin-sidebar-badge");
      const avatarEl = document.getElementById("admin-sidebar-avatar");

      // Show display name when set, otherwise fall back to Cyrillic name
      const displayName =
        user.displayName && user.displayName.trim()
          ? user.displayName
          : user.name || "—";
      if (nameEl) nameEl.textContent = displayName;
      if (badgeEl) badgeEl.textContent = (user.role || "admin").toLowerCase();

      // Avatar: photo via background-image or initials fallback
      if (avatarEl) {
        if (user.avatar) {
          avatarEl.style.cssText = `background-image:url(${user.avatar});background-size:cover;background-position:center;`;
          avatarEl.textContent = "";
        } else {
          // Build initials from Cyrillic name (two letters)
          const parts = (user.name || displayName).trim().split(/\s+/);
          avatarEl.textContent =
            parts.length >= 2
              ? (parts[0][0] + parts[1][0]).toUpperCase()
              : parts[0].slice(0, 2).toUpperCase();
        }
      }
    })
    .catch(() => {
      window.location.replace("/dashboard.html");
    });

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
      if (section === "analytics" && !analyticsLoaded) {
        analyticsLoaded = true;
        loadAnalytics(currentPeriod);
      } else if (section === "analytics") {
        loadAnalytics(currentPeriod);
      }
      if (section === "users") loadAdminUsers(0);
      if (section === "posts") loadAdminPosts(0);
      if (section === "projects") loadAdminProjects(0);
      if (section === "comments") loadAdminComments(0, adminCommentsFilter);
      if (section === "contacts") loadAdminContacts(0, adminContactsFilter);
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
    // SEC-1: cl_refresh is now an HttpOnly cookie; JS cannot read it.
    // credentials:'include' sends the cookie so the backend can invalidate it.
    // No body needed — the server reads the refresh token from the cookie.
    try {
      await fetch("https://api.cote-lapyx.com/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
        // No body: server reads cl_refresh from the HttpOnly cookie
      });
    } catch {
      /* best-effort — proceed to local cleanup regardless */
    }
    // Clear access token; cl_refresh is HttpOnly and cleared server-side only
    localStorage.removeItem("cl_access");
    // Manual logout — redirect to main site (not login page)
    window.location.replace("/");
  });

  // ---------------------------------------------------------------------------
  // Comment filter tabs (Всі / Очікують / Відхилені)
  // ---------------------------------------------------------------------------

  let adminCommentsFilter = "";
  let adminContactsFilter = "";
  let adminUsersPage = 0;
  let adminPostsPage = 0;
  let adminProjectsPage = 0;
  let adminCommentsPage = 0;
  let adminContactsPage = 0;

  const filterTabs = document.querySelectorAll(".admin-filter-tab");

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      adminCommentsFilter = tab.dataset.commentFilter ?? "";
      loadAdminComments(0, adminCommentsFilter);
    });
  });

  // ---------------------------------------------------------------------------
  // Analytics panel
  // ---------------------------------------------------------------------------

  let currentPeriod = "7d";
  let analyticsLoaded = false;

  /**
   * Render the pageviews bar chart with real data points.
   * Localizes the empty-state message via translate().
   * @param {Array<{date: string, pageviews: number}>} dataPoints
   */
  function renderChart(dataPoints) {
    const barsEl = document.getElementById("analytics-bars");
    const labelsEl = document.getElementById("analytics-labels");
    if (!barsEl || !labelsEl) return;

    // Empty state — localized
    if (!dataPoints || dataPoints.length === 0) {
      barsEl.innerHTML = `<div class="analytics-chart-loading">${translate("admin.state.no_data")}</div>`;
      labelsEl.innerHTML = "";
      return;
    }

    const max = Math.max(...dataPoints.map((d) => d.pageviews), 1);

    // Render bar for each data point — title attribute shows date + localized pageviews label
    barsEl.innerHTML = dataPoints
      .map((d) => {
        const pct = Math.round((d.pageviews / max) * 100);
        return `<div class="admin-activity-chart__bar" style="height:${pct || 2}%" title="${d.date}: ${d.pageviews} ${translate("admin.analytics.pageviews")}"></div>`;
      })
      .join("");

    // Render date labels below bars
    labelsEl.innerHTML = dataPoints
      .map((d) => {
        const dt = new Date(d.date);
        const label = `${dt.getDate()}.${String(dt.getMonth() + 1).padStart(2, "0")}`;
        return `<span class="admin-activity-chart__label">${label}</span>`;
      })
      .join("");
  }

  /**
   * Render a metrics list (top pages / referrers) with a horizontal bar per item.
   * Localizes the empty-state message via translate().
   * @param {string} containerId - element id to render into
   * @param {Array<{name: string, value: number}>} items
   */
  function renderMetrics(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;

    // Empty state — localized
    if (!items || items.length === 0) {
      el.innerHTML = `<div class="analytics-chart-loading">${translate("admin.state.no_data")}</div>`;
      return;
    }

    const max = items[0]?.value || 1;
    el.innerHTML = items
      .slice(0, 8)
      .map((item) => {
        const pct = Math.round((item.value / max) * 100);
        const name = item.name || "(direct)";
        return `<div class="analytics-metric-row">
        <span class="analytics-metric-row__name" title="${name}">${name}</span>
        <div class="analytics-metric-row__bar"><span style="width:${pct}%"></span></div>
        <span class="analytics-metric-row__value">${item.value}</span>
      </div>`;
      })
      .join("");
  }

  /**
   * Format seconds into a human-readable duration string (localized abbreviations).
   * @param {number} seconds
   * @returns {string}
   */
  function formatDuration(seconds) {
    if (!seconds) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    // Use neutral "m"/"s" abbreviations — acceptable across all 4 supported langs
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  /**
   * Load analytics data for the given period and populate the analytics panel.
   * @param {string} period - "7d" | "30d" | "90d"
   */
  async function loadAnalytics(period = "7d") {
    const base = "https://api.cote-lapyx.com/api/v1/analytics";

    // Set loading state with localized text
    document.querySelectorAll(".analytics-stat-value").forEach((el) => {
      el.textContent = "…";
    });
    document.getElementById("analytics-bars").innerHTML =
      `<div class="analytics-chart-loading">${translate("admin.state.loading")}</div>`;
    ["analytics-top-pages", "analytics-referrers"].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML = `<div class="analytics-chart-loading">${translate("admin.state.loading")}</div>`;
    });

    try {
      const [statsRes, pvRes, pagesRes, referrersRes] = await Promise.all([
        fetchWithAuth(`${base}/stats?period=${period}`),
        fetchWithAuth(`${base}/pageviews?period=${period}`),
        fetchWithAuth(`${base}/metrics?type=url&period=${period}&limit=8`),
        fetchWithAuth(`${base}/metrics?type=referrer&period=${period}&limit=8`),
      ]);

      // Populate stat cards from /analytics/stats response
      if (statsRes.ok) {
        const stats = await statsRes.json();
        const statMap = {
          visitors: stats.visitors?.toLocaleString("uk") ?? "—",
          pageviews: stats.pageviews?.toLocaleString("uk") ?? "—",
          bounceRate:
            stats.bounceRate != null ? `${Math.round(stats.bounceRate)}%` : "—",
          avgSession:
            stats.avgSessionDuration != null
              ? formatDuration(stats.avgSessionDuration)
              : "—",
        };
        document.querySelectorAll(".analytics-stat-value").forEach((el) => {
          const key = el.dataset.stat;
          if (key && statMap[key] !== undefined) el.textContent = statMap[key];
        });
      }

      // Render bar chart from /analytics/pageviews response
      if (pvRes.ok) {
        const pv = await pvRes.json();
        renderChart(pv.data || []);
      }

      // Render top pages metrics list
      if (pagesRes.ok) {
        renderMetrics("analytics-top-pages", await pagesRes.json());
      }

      // Render referrers metrics list
      if (referrersRes.ok) {
        renderMetrics("analytics-referrers", await referrersRes.json());
      }
    } catch (err) {
      console.error("Analytics load error:", err);
      document.getElementById("analytics-bars").innerHTML =
        `<div class="analytics-chart-loading">${translate("admin.state.error")}</div>`;
    }
  }

  document.querySelectorAll(".analytics-period-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".analytics-period-btn")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentPeriod = btn.dataset.period;
      loadAnalytics(currentPeriod);
    });
  });

  // ---------------------------------------------------------------------------
  // Settings panel — load + save via GET/PATCH /api/v1/admin/settings (DASH-1)
  // ---------------------------------------------------------------------------

  const settingsForm = document.getElementById("admin-settings-form");

  /**
   * Hydrate the settings form from GET /admin/settings.
   * Also sets the registration and maintenance toggle checked states (DASH-5).
   * Called when the settings panel is opened and on page load if settings is active.
   */
  async function loadAdminSettings() {
    try {
      // Authenticated GET — ROLE_OWNER required
      const res = await fetchWithAuth(`${ADMIN_API}/admin/settings`);
      if (!res.ok) {
        console.warn("Failed to load admin settings:", res.status);
        return;
      }
      const settings = await res.json();

      // Populate text fields with values from backend
      const siteName = document.getElementById("settings-site-name");
      const contactEmail = document.getElementById("settings-email");
      const description = document.getElementById("settings-description");

      if (siteName) siteName.value = settings.siteName ?? "";
      if (contactEmail) contactEmail.value = settings.contactEmail ?? "";
      if (description) description.value = settings.siteDescription ?? "";

      // Populate toggle checked state from backend booleans (DASH-5)
      const regToggle = document.getElementById("settings-toggle-registration");
      const maintToggle = document.getElementById(
        "settings-toggle-maintenance",
      );

      if (regToggle) {
        regToggle.checked = settings.registrationEnabled ?? true;
      }
      if (maintToggle) {
        maintToggle.checked = settings.maintenanceMode ?? false;
      }
    } catch (err) {
      console.error("Admin settings load error:", err);
    }
  }

  /**
   * Save general settings via PATCH /admin/settings.
   * Reads site_name, contact_email, description, registrationEnabled, maintenanceMode.
   * Shows toast on success/error.
   */
  settingsForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = settingsForm.querySelector('[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;

    // Read all field values from the form
    const siteName =
      document.getElementById("settings-site-name")?.value.trim() || undefined;
    const contactEmail =
      document.getElementById("settings-email")?.value.trim() || undefined;
    const siteDescription =
      document.getElementById("settings-description")?.value.trim() ||
      undefined;
    // Read boolean toggles — checked state reflects current user intent (DASH-5)
    const registrationEnabled =
      document.getElementById("settings-toggle-registration")?.checked ?? true;
    const maintenanceMode =
      document.getElementById("settings-toggle-maintenance")?.checked ?? false;

    // Build PATCH payload — only include defined fields
    const payload = {};
    if (siteName !== undefined) payload.siteName = siteName;
    if (contactEmail !== undefined) payload.contactEmail = contactEmail;
    if (siteDescription !== undefined)
      payload.siteDescription = siteDescription;
    payload.registrationEnabled = registrationEnabled;
    payload.maintenanceMode = maintenanceMode;

    try {
      // Authenticated PATCH — ROLE_OWNER required
      const res = await fetchWithAuth(`${ADMIN_API}/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Visual saved feedback — checkmark + localized "Saved" label
        submitBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          ${translate("admin.state.saved")}
        `;
        // Restore button label after 2.5 s
        setTimeout(() => {
          submitBtn.innerHTML = originalHTML;
          submitBtn.disabled = false;
        }, 2500);
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        // Show error alert — localized
        alert(translate("admin.state.save_error"));
      }
    } catch (err) {
      console.error("Admin settings save error:", err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
      alert(translate("error.network"));
    }
  });

  // ---------------------------------------------------------------------------
  // Admin — shared helpers
  // ---------------------------------------------------------------------------

  const ADMIN_API = "https://api.cote-lapyx.com/api/v1";

  // Status labels — lazily resolved via translate() so they update on language change
  // Keys: admin.status.published / draft / archived
  const STATUS_LABEL = () => ({
    PUBLISHED: translate("admin.status.published"),
    DRAFT: translate("admin.status.draft"),
    ARCHIVED: translate("admin.status.archived"),
  });
  const STATUS_CLASS = {
    PUBLISHED: "published",
    DRAFT: "draft",
    ARCHIVED: "archived",
  };
  const TECH_COLORS = ["cyan", "magenta", "green"];
  // Role → neon-badge colour mapping (OWNER and SUBSCRIBER only — MEMBER removed from system)
  const ROLE_BADGE = {
    OWNER: "magenta",
    SUBSCRIBER: "green",
  };

  function escHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /**
   * Return uppercase first letter of user name or email for avatar fallback.
   * @param {{ name?: string, email?: string }} u - user object
   * @returns {string} single uppercase character
   */
  function userInitial(u) {
    return (u.name || u.email || "?")[0].toUpperCase();
  }

  /**
   * Build the avatar HTML for a user row.
   * Shows <img> if u.avatar exists, otherwise renders the user initial.
   * @param {{ avatar?: string, name?: string, email?: string }} u - user object
   * @returns {string} HTML string for .dash-list__avatar element
   */
  function userAvatarHtml(u) {
    if (u.avatar) {
      // Render real avatar image — src and alt are escaped
      return `<span class="dash-list__avatar dash-list__avatar--img" aria-hidden="true"><img src="${escHtml(u.avatar)}" alt="" /></span>`;
    }
    // Fallback: display initial letter
    return `<span class="dash-list__avatar" aria-hidden="true">${escHtml(userInitial(u))}</span>`;
  }

  function renderPagination(containerId, number, totalPages, onPage) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (totalPages <= 1) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = Array.from({ length: totalPages }, (_, i) => {
      const active = i === number ? " is-active" : "";
      return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
    }).join("");
    el.addEventListener(
      "click",
      (e) => {
        const btn = e.target.closest("[data-page]");
        if (btn) onPage(Number(btn.dataset.page));
      },
      { once: true },
    );
  }

  // ---------------------------------------------------------------------------
  // Admin overview stats
  // ---------------------------------------------------------------------------

  async function loadAdminStats() {
    try {
      // Correct endpoint: /api/v1/admin/stats (not /dashboard/stats)
      const res = await fetchWithAuth(`${ADMIN_API}/admin/stats`);
      if (!res.ok) return;
      const stats = await res.json();
      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val ?? "0";
      };
      set("admin-stat-users", stats.usersTotal);
      set("admin-stat-posts", stats.postsTotal);
      set("admin-stat-comments", stats.commentsPending);
      set("admin-stat-projects", stats.projectsPublished);
      set("admin-stat-contacts", stats.messagesUnread);
      // Update nav badge for unread contacts
      const badge = document.getElementById("nav-contacts-badge");
      if (badge) {
        const count = Number(stats.messagesUnread ?? 0);
        if (count > 0) {
          badge.textContent = count;
          badge.hidden = false;
        } else {
          badge.hidden = true;
        }
      }
    } catch (err) {
      console.error("Admin stats error:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Admin — recent users (overview panel)
  // ---------------------------------------------------------------------------

  async function loadAdminRecentUsers() {
    const body = document.getElementById("admin-recent-users-body");
    if (!body) return;
    try {
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/users?size=5&sort=createdAt,desc`,
      );
      if (!res.ok) {
        body.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      const rows = (data.content || [])
        .map((u) => {
          const roleColor = ROLE_BADGE[u.role] || "green";
          // Name cell: avatar (image or initial) + display name side by side
          return `<div class="dash-list__row">
          <div class="dash-list__title" data-label="Ім'я">
            <span class="dash-list__user-cell">
              ${userAvatarHtml(u)}
              ${escHtml(u.name || u.email)}
            </span>
          </div>
          <div data-label="Email">${escHtml(u.email)}</div>
          <div data-label="Роль"><span class="neon-badge neon-badge--${roleColor}">${escHtml(u.role?.toLowerCase() || "—")}</span></div>
          <div class="dash-list__date" data-label="Дата">${fmtDate(u.createdAt)}</div>
        </div>`;
        })
        .join("");
      body.innerHTML =
        rows || '<div class="dash-list__empty">Користувачів ще немає</div>';
    } catch (err) {
      console.error("Admin recent users error:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Admin users panel
  // ---------------------------------------------------------------------------

  async function loadAdminUsers(page) {
    adminUsersPage = page;
    const body = document.getElementById("admin-users-body");
    if (!body) return;
    body.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';
    try {
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/users?size=20&sort=createdAt,desc&page=${page}`,
      );
      if (!res.ok) {
        body.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      const rows = (data.content || [])
        .map((u) => {
          const roleColor = ROLE_BADGE[u.role] || "green";
          // Name cell: avatar (image or initial) + display name side by side
          return `<div class="dash-list__row">
          <div class="dash-list__title" data-label="Ім'я">
            <span class="dash-list__user-cell">
              ${userAvatarHtml(u)}
              ${escHtml(u.name || u.email)}
            </span>
          </div>
          <div data-label="Email">${escHtml(u.email)}</div>
          <div data-label="Роль"><span class="neon-badge neon-badge--${roleColor}">${escHtml(u.role?.toLowerCase() || "—")}</span></div>
          <div class="dash-list__date" data-label="Зареєстрований">${fmtDate(u.createdAt)}</div>
          <div data-label="Дії">
            <button type="button" class="btn btn--ghost btn--sm"
              data-action="edit-user"
              data-id="${escHtml(String(u.id))}"
              data-name="${escHtml(u.name || "")}"
              data-role="${escHtml(u.role || "")}"
              data-status="${escHtml(u.status || "ACTIVE")}">
              Редагувати
            </button>
          </div>
        </div>`;
        })
        .join("");
      body.innerHTML =
        rows || '<div class="dash-list__empty">Користувачів ще немає</div>';
      if (data.page) {
        renderPagination(
          "admin-users-pagination",
          data.page.number,
          data.page.totalPages,
          (p) => loadAdminUsers(p),
        );
      }
    } catch (err) {
      console.error("Admin users error:", err);
      body.innerHTML =
        '<div class="dash-list__empty">Помилка завантаження</div>';
    }
  }

  // ---------------------------------------------------------------------------
  // Admin posts panel
  // ---------------------------------------------------------------------------

  async function loadAdminPosts(page) {
    adminPostsPage = page;
    const body = document.getElementById("admin-posts-body");
    if (!body) return;
    body.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';
    try {
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/posts?size=20&sort=createdAt,desc&page=${page}`,
      );
      if (!res.ok) {
        body.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      // Resolve status labels at render time so they reflect the current language
      const statusLabels = STATUS_LABEL();
      const rows = (data.content || [])
        .map((post) => {
          const sClass = STATUS_CLASS[post.status] || "draft";
          const sLabel = statusLabels[post.status] || post.status;
          return `<div class="dash-list__row">
          <div class="dash-list__title" data-label="Заголовок">${escHtml(post.title)}</div>
          <div data-label="Автор">${escHtml(post.author?.name || "—")}</div>
          <div class="dash-list__date" data-label="Дата">${fmtDate(post.createdAt)}</div>
          <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
        </div>`;
        })
        .join("");
      body.innerHTML =
        rows || '<div class="dash-list__empty">Публікацій ще немає</div>';
      if (data.page) {
        renderPagination(
          "admin-posts-pagination",
          data.page.number,
          data.page.totalPages,
          (p) => loadAdminPosts(p),
        );
      }
    } catch (err) {
      console.error("Admin posts error:", err);
      body.innerHTML =
        '<div class="dash-list__empty">Помилка завантаження</div>';
    }
  }

  // ---------------------------------------------------------------------------
  // Admin projects panel
  // ---------------------------------------------------------------------------

  async function loadAdminProjects(page) {
    adminProjectsPage = page;
    const body = document.getElementById("admin-projects-body");
    if (!body) return;
    body.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';
    try {
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/projects?size=20&sort=createdAt,desc&page=${page}`,
      );
      if (!res.ok) {
        body.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      // Resolve status labels at render time so they reflect the current language
      const projStatusLabels = STATUS_LABEL();
      const rows = (data.content || [])
        .map((project) => {
          const techs = (project.technologies || [])
            .slice(0, 3)
            .map(
              (t, i) =>
                `<span class="neon-badge neon-badge--${TECH_COLORS[i % 3]}">${escHtml(t)}</span>`,
            )
            .join("");
          const sClass = STATUS_CLASS[project.status] || "draft";
          const sLabel = projStatusLabels[project.status] || project.status;
          return `<div class="dash-list__row">
          <div class="dash-list__title" data-label="Назва">${escHtml(project.title)}</div>
          <div data-label="Автор">${escHtml(project.author?.name || "—")}</div>
          <div class="dash-list__tech" data-label="Технології">${techs || "—"}</div>
          <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
        </div>`;
        })
        .join("");
      body.innerHTML =
        rows || '<div class="dash-list__empty">Проектів ще немає</div>';
      if (data.page) {
        renderPagination(
          "admin-projects-pagination",
          data.page.number,
          data.page.totalPages,
          (p) => loadAdminProjects(p),
        );
      }
    } catch (err) {
      console.error("Admin projects error:", err);
      body.innerHTML =
        '<div class="dash-list__empty">Помилка завантаження</div>';
    }
  }

  // ---------------------------------------------------------------------------
  // Admin comments panel — shows all comments with status badges
  // New comments auto-approve after backend task-039;
  // Approve/Reject replaced by "Mark Seen" for APPROVED comments
  // ---------------------------------------------------------------------------

  // Comment status display labels — resolved via translate() at render time
  // Keys: admin.comment_status.pending / approved / seen / rejected / deleted
  const COMMENT_STATUS_LABEL = () => ({
    PENDING: translate("admin.comment_status.pending"),
    APPROVED: translate("admin.comment_status.approved"),
    SEEN: translate("admin.comment_status.seen"),
    REJECTED: translate("admin.comment_status.rejected"),
    DELETED: translate("admin.comment_status.deleted"),
  });

  // Comment status CSS modifier for dash-status badge
  const COMMENT_STATUS_CLASS = {
    PENDING: "draft",
    APPROVED: "published",
    SEEN: "archived",
    REJECTED: "archived",
    DELETED: "archived",
  };

  /**
   * Load admin comments with optional status filter.
   * Shows PENDING (needs bad-words review) + APPROVED (auto-approved, not seen yet).
   * @param {number} page - zero-based page number
   * @param {string} statusFilter - empty string = all, or PENDING/APPROVED/SEEN/REJECTED
   */
  async function loadAdminComments(page, statusFilter) {
    adminCommentsPage = page;
    const body = document.getElementById("admin-comments-body");
    if (!body) return;
    body.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';
    const statusParam = statusFilter ? `&status=${statusFilter}` : "";
    try {
      // GET /api/v1/admin/comments — returns all comments for admin review
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/comments?size=20&sort=createdAt,desc&page=${page}${statusParam}`,
      );
      if (!res.ok) {
        body.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      // Resolve comment status labels at render time (language-aware)
      const commentStatusLabels = COMMENT_STATUS_LABEL();
      const rows = (data.content || [])
        .map((c) => {
          const sClass = COMMENT_STATUS_CLASS[c.status] || "draft";
          const sLabel = commentStatusLabels[c.status] || c.status;

          // PENDING — show Approve + Reject (manual bad-words moderation)
          const canApprove = c.status === "PENDING" || c.status === "REJECTED";
          const canReject = c.status === "PENDING";
          // Action button labels — localized
          const approveBtn = canApprove
            ? `<button type="button" class="btn btn--cyan btn--sm" data-action="approve" data-id="${c.id}">${translate("admin.action.approve")}</button>`
            : "";
          const rejectBtn = canReject
            ? `<button type="button" class="btn btn--ghost btn--sm" data-action="reject" data-id="${c.id}">${translate("admin.action.reject")}</button>`
            : "";

          // APPROVED — show "Mark Seen" button (PATCH /comments/{id}/seen)
          const seenBtn =
            c.status === "APPROVED"
              ? `<button type="button" class="btn btn--ghost btn--sm" data-action="seen" data-id="${c.id}">${translate("admin.action.mark_seen")}</button>`
              : "";

          // Delete — available for all statuses
          const deleteBtn = `<button type="button" class="btn btn--magenta btn--sm" data-action="delete-comment" data-id="${c.id}">${translate("admin.action.delete")}</button>`;

          // Post link — show slug if available, fallback to postId
          const postRef = c.postSlug
            ? escHtml(c.postSlug)
            : `#${escHtml(String(c.postId || "—"))}`;

          return `<div class="dash-list__row">
            <div data-label="${translate("admin.col.author")}">${escHtml(c.author?.name || c.author?.email || "—")}</div>
            <div data-label="${translate("admin.col.comment")}">${escHtml((c.content || "").slice(0, 60))}${(c.content || "").length > 60 ? "…" : ""}</div>
            <div class="dash-list__title" data-label="${translate("admin.col.post")}">${postRef}</div>
            <div class="dash-list__date" data-label="${translate("admin.col.date")}">${fmtDate(c.createdAt)}</div>
            <div data-label="${translate("admin.col.status")}"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
            <div class="dash-list__actions" data-label="${translate("admin.col.actions")}">${approveBtn}${rejectBtn}${seenBtn}${deleteBtn}</div>
          </div>`;
        })
        .join("");
      body.innerHTML =
        rows ||
        `<div class="dash-list__empty">${translate("admin.empty.comments")}</div>`;
      if (data.page) {
        renderPagination(
          "admin-comments-pagination",
          data.page.number,
          data.page.totalPages,
          (p) => loadAdminComments(p, adminCommentsFilter),
        );
      }
    } catch (err) {
      console.error("Admin comments error:", err);
      body.innerHTML =
        '<div class="dash-list__empty">Помилка завантаження</div>';
    }
  }

  /**
   * Approve or reject a PENDING comment via admin endpoint.
   * @param {number} id - comment ID
   * @param {"approve"|"reject"} action
   */
  async function moderateComment(id, action) {
    try {
      const status = action === "approve" ? "APPROVED" : "REJECTED";
      // PATCH /api/v1/admin/comments/{id} — set moderation status
      const res = await fetchWithAuth(`${ADMIN_API}/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) loadAdminComments(adminCommentsPage, adminCommentsFilter);
      else alert("Помилка модерації. Спробуйте ще раз.");
    } catch {
      alert("Помилка зʼєднання.");
    }
  }

  /**
   * Mark an APPROVED comment as seen by admin (PATCH /comments/{id}/seen).
   * This replaces the old approve workflow for auto-approved comments.
   * @param {number} id - comment ID
   */
  async function markCommentSeen(id) {
    try {
      // PATCH /api/v1/comments/{id}/seen — OWNER-only endpoint
      const res = await fetchWithAuth(`${ADMIN_API}/comments/${id}/seen`, {
        method: "PATCH",
      });
      if (res.ok || res.status === 204) {
        loadAdminComments(adminCommentsPage, adminCommentsFilter);
      } else {
        // Graceful fallback if endpoint not yet implemented by backend
        console.warn("Mark seen endpoint not yet available (task-039)");
      }
    } catch {
      /* silent — graceful degradation */
    }
  }

  /**
   * Delete a comment after admin confirmation.
   * Uses CommentController endpoint (not AdminController).
   * @param {number} id - comment ID
   */
  async function deleteComment(id) {
    if (!confirm("Видалити коментар?")) return;
    try {
      // DELETE is in CommentController (/api/v1/comments/:id), not AdminController
      const res = await fetchWithAuth(`${ADMIN_API}/comments/${id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204)
        loadAdminComments(adminCommentsPage, adminCommentsFilter);
      else alert("Помилка видалення. Спробуйте ще раз.");
    } catch {
      alert("Помилка зʼєднання.");
    }
  }

  // Delegate click handler for all comment action buttons
  document
    .getElementById("admin-comments-body")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const { action, id } = btn.dataset;
      // Route to appropriate handler based on action type
      if (action === "approve" || action === "reject") {
        moderateComment(Number(id), action);
      } else if (action === "seen") {
        markCommentSeen(Number(id));
      } else if (action === "delete-comment") {
        deleteComment(Number(id));
      }
    });

  // ---------------------------------------------------------------------------
  // Contact messages filter tabs
  // ---------------------------------------------------------------------------

  const contactFilterTabs = document.querySelectorAll(".admin-contact-tab");

  contactFilterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      contactFilterTabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      adminContactsFilter = tab.dataset.contactFilter ?? "";
      loadAdminContacts(0, adminContactsFilter);
    });
  });

  // ---------------------------------------------------------------------------
  // Admin — contact messages panel
  // ---------------------------------------------------------------------------

  // Contact status labels — resolved via translate() at render time
  // Keys: admin.contact_status.new / read / replied
  const CONTACT_STATUS_LABEL = () => ({
    NEW: translate("admin.contact_status.new"),
    READ: translate("admin.contact_status.read"),
    REPLIED: translate("admin.contact_status.replied"),
  });
  const CONTACT_STATUS_COLOR = {
    NEW: "magenta",
    READ: "cyan",
    REPLIED: "green",
  };

  /**
   * Load admin contact messages with optional status filter.
   * @param {number} page - zero-based page number
   * @param {string} status - empty string = all, or NEW/READ/REPLIED
   */
  async function loadAdminContacts(page, status = "") {
    adminContactsPage = page;
    const body = document.getElementById("admin-contacts-body");
    if (!body) return;
    // Loading state — localized
    body.innerHTML = `<div class="dash-list__empty">${translate("admin.state.loading")}</div>`;

    const statusParam = status ? `&status=${status}` : "";
    try {
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/contact-messages?size=20&sort=createdAt,desc&page=${page}${statusParam}`,
      );
      if (!res.ok) {
        body.innerHTML = `<div class="dash-list__empty">${translate("admin.state.error")}</div>`;
        return;
      }
      const data = await res.json();
      // Resolve contact status labels at render time (language-aware)
      const contactStatusLabels = CONTACT_STATUS_LABEL();
      const rows = (data.content || [])
        .map((m) => {
          const statusColor = CONTACT_STATUS_COLOR[m.status] || "cyan";
          const statusLabel = contactStatusLabels[m.status] || m.status;
          // Truncate message to 80 chars for preview
          const preview =
            escHtml(m.message || "").slice(0, 80) +
            (m.message?.length > 80 ? "…" : "");
          return `<div class="dash-list__row">
            <div class="dash-list__title" data-label="${translate("admin.col.name")}">${escHtml(m.name)}</div>
            <div data-label="${translate("admin.col.email")}"><a href="mailto:${escHtml(m.email)}" class="dash-list__link">${escHtml(m.email)}</a></div>
            <div data-label="${translate("admin.col.message")}" class="dash-list__preview">${preview}</div>
            <div class="dash-list__date" data-label="${translate("admin.col.date")}">${fmtDate(m.createdAt)}</div>
            <div data-label="${translate("admin.col.status")}"><span class="neon-badge neon-badge--${statusColor}">${statusLabel}</span></div>
            <div class="dash-list__actions" data-label="${translate("admin.col.actions")}">
              ${m.status === "NEW" ? `<button type="button" class="btn btn--ghost btn--xs" data-contact-action="read" data-id="${m.id}" title="${translate("admin.action.mark_read")}">✓</button>` : ""}
              <button type="button" class="btn btn--ghost btn--xs" data-contact-action="reply" data-email="${escHtml(m.email)}" data-name="${escHtml(m.name)}" title="${translate("admin.action.reply")}">✉</button>
              <button type="button" class="btn btn--ghost btn--xs btn--danger" data-contact-action="delete" data-id="${m.id}" title="${translate("admin.action.delete")}">✕</button>
            </div>
          </div>`;
        })
        .join("");
      body.innerHTML =
        rows ||
        `<div class="dash-list__empty">${translate("admin.empty.contacts")}</div>`;
      renderPagination(
        "admin-contacts-pagination",
        data.number,
        data.totalPages,
        (p) => loadAdminContacts(p, adminContactsFilter),
      );
    } catch (err) {
      console.error("Admin contacts error:", err);
      body.innerHTML =
        '<div class="dash-list__empty">Помилка завантаження</div>';
    }
  }

  async function markContactRead(id) {
    try {
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/contact-messages/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "READ" }),
        },
      );
      if (res.ok) {
        // Refresh list and stats (unread count changes)
        loadAdminContacts(adminContactsPage, adminContactsFilter);
        loadAdminStats();
      }
    } catch {
      console.error("Failed to mark contact as read");
    }
  }

  /**
   * Soft-deletes a contact message via DELETE /admin/contact-messages/:id.
   * Prompts for confirmation before sending the request.
   * @param {number} id - contact message primary key
   */
  async function deleteContact(id) {
    if (!confirm("Видалити звернення?")) return;
    try {
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/contact-messages/${id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        // Refresh list — deleted message disappears from default view
        loadAdminContacts(adminContactsPage, adminContactsFilter);
        loadAdminStats();
      } else {
        alert("Помилка видалення. Спробуйте ще раз.");
      }
    } catch {
      console.error("Failed to delete contact message");
      alert("Помилка зʼєднання. Спробуйте ще раз.");
    }
  }

  // Delegate click on contacts body — read, reply, and delete actions
  document
    .getElementById("admin-contacts-body")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-contact-action]");
      if (!btn) return;
      const action = btn.dataset.contactAction;
      if (action === "read") markContactRead(Number(btn.dataset.id));
      else if (action === "delete") deleteContact(Number(btn.dataset.id));
      else if (action === "reply") {
        // Opens native mail client — no confirm dialog needed
        window.location.href = `mailto:${btn.dataset.email}?subject=Re: cote-lapyx contact`;
      }
    });

  // ---------------------------------------------------------------------------
  // Admin users — edit modal
  // ---------------------------------------------------------------------------

  /**
   * Open the user-edit modal and populate its fields.
   * @param {{ id: string, name: string, role: string, status: string }} user
   */
  function openUserEditModal({ id, name, role, status }) {
    // Populate hidden id and visible fields
    document.getElementById("admin-user-edit-id").value = id;
    document.getElementById("admin-user-edit-name").value = name;
    document.getElementById("admin-user-edit-role").value =
      role || "SUBSCRIBER";
    document.getElementById("admin-user-edit-status").value =
      status || "ACTIVE";
    // Show modal by removing hidden attribute
    document.getElementById("admin-user-modal").removeAttribute("hidden");
  }

  /** Close the user-edit modal and reset the form. */
  function closeUserEditModal() {
    document.getElementById("admin-user-modal").setAttribute("hidden", "");
    document.getElementById("admin-user-form").reset();
  }

  // Close button inside modal header
  document
    .getElementById("admin-user-modal-close")
    ?.addEventListener("click", closeUserEditModal);

  // Cancel button in modal actions row
  document
    .getElementById("admin-user-modal-cancel")
    ?.addEventListener("click", closeUserEditModal);

  // Click on backdrop also closes modal
  document
    .getElementById("admin-user-modal-backdrop")
    ?.addEventListener("click", closeUserEditModal);

  // Delegate edit-user button clicks on the full users table body
  document
    .getElementById("admin-users-body")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="edit-user"]');
      if (!btn) return;
      // Extract all fields from the button's data-* attributes
      const { id, name, role, status } = btn.dataset;
      openUserEditModal({ id, name, role, status });
    });

  // Submit handler — PATCH /admin/users/:id with changed fields
  document
    .getElementById("admin-user-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Read form values
      const id = document.getElementById("admin-user-edit-id").value;
      const body = {
        name:
          document.getElementById("admin-user-edit-name").value.trim() ||
          undefined,
        role:
          document.getElementById("admin-user-edit-role").value || undefined,
        status:
          document.getElementById("admin-user-edit-status").value || undefined,
      };

      // Strip keys whose value is undefined before serialising
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

      const submitBtn = e.target.querySelector('[type="submit"]');
      submitBtn.disabled = true;

      try {
        // Authenticated PATCH — fetchWithAuth handles token refresh
        const res = await fetchWithAuth(`${ADMIN_API}/admin/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("API error");

        // Close modal and reload table to reflect changes
        closeUserEditModal();
        loadAdminUsers(adminUsersPage);
      } catch (err) {
        console.error("User update error:", err);
        alert("Помилка збереження");
      } finally {
        // Always re-enable button
        submitBtn.disabled = false;
      }
    });

  // ---------------------------------------------------------------------------
  // Settings panel — load general settings + social contacts when switching to settings
  // ---------------------------------------------------------------------------

  // Wire the settings nav link: load both general settings and social contacts
  navLinks.forEach((link) => {
    if (link.dataset.section === "settings") {
      link.addEventListener("click", () => {
        // Hydrate form fields from backend on every open (ensures fresh state)
        loadAdminSettings();
        // Load social contacts (existing behaviour — preserved)
        loadAdminSocialContacts();
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Admin contacts (social links) — GET / POST / PATCH / DELETE /admin/contacts
  // ---------------------------------------------------------------------------

  // Fixed 6 platform types matching the API enum; order determines display
  const SOCIAL_PLATFORMS = [
    "TELEGRAM",
    "GITHUB",
    "INSTAGRAM",
    "FACEBOOK",
    "LINKEDIN",
    "EMAIL",
  ];

  // URL validation patterns — allowed protocol prefixes per platform
  // EMAIL allows bare address (no scheme required); others need https?/tg:/t.me
  const SOCIAL_URL_PATTERNS = {
    TELEGRAM: /^(https?:\/\/|tg:\/\/|t\.me\/)/i,
    GITHUB: /^https?:\/\//i,
    INSTAGRAM: /^https?:\/\//i,
    FACEBOOK: /^https?:\/\//i,
    LINKEDIN: /^https?:\/\//i,
    // Email: bare address OR mailto: scheme
    EMAIL: /^(mailto:|[^@\s]+@[^@\s]+\.[^@\s]+$)/i,
  };

  // In-memory map of existing contacts from the API: { PLATFORM: { id, value, enabled, label, displayOrder } }
  // Populated by loadAdminSocialContacts(); used by saveAdminSocialContacts() to decide POST vs PATCH vs DELETE
  let adminContactsState = {};

  /**
   * Validate the URL/address value for a given platform.
   * Returns null on success, or an error message string on failure.
   * Empty value is always valid (means "no link" — will DELETE if id exists).
   * @param {string} platform - uppercase enum (TELEGRAM, GITHUB, etc.)
   * @param {string} value - raw input value
   * @returns {string|null} error message or null
   */
  function validateSocialUrl(platform, value) {
    // Empty value is valid — treated as "clear/delete"
    if (!value.trim()) return null;
    const pattern = SOCIAL_URL_PATTERNS[platform];
    if (!pattern) return null;
    if (!pattern.test(value.trim())) {
      // Friendly error per platform type
      if (platform === "EMAIL") {
        return "Введіть email-адресу або mailto: посилання";
      }
      return "Введіть коректне URL (https://, tg:// або t.me/ для Telegram)";
    }
    return null;
  }

  /**
   * Show or hide the inline validation error for a platform row.
   * @param {string} platform - uppercase platform enum
   * @param {string|null} message - error text or null to clear
   */
  function setSocialRowError(platform, message) {
    const errorEl = document.getElementById(`social-error-${platform}`);
    if (!errorEl) return;
    if (message) {
      // Use textContent (not innerHTML) — escapes user-facing error strings
      errorEl.textContent = message;
      errorEl.removeAttribute("hidden");
    } else {
      errorEl.textContent = "";
      errorEl.setAttribute("hidden", "");
    }
  }

  /**
   * Show the save feedback message below the social contacts block.
   * Auto-hides after 3 seconds on success.
   * @param {string} message - text to show
   * @param {"success"|"error"} type - determines colour class
   */
  function showSocialFeedback(message, type) {
    const el = document.getElementById("admin-social-feedback");
    if (!el) return;
    // Use textContent — escapes any HTML in the message
    el.textContent = message;
    el.className = `admin-social-feedback admin-social-feedback--${type}`;
    el.removeAttribute("hidden");
    // Auto-dismiss success message after 3 s
    if (type === "success") {
      setTimeout(() => {
        el.setAttribute("hidden", "");
        el.textContent = "";
        el.className = "admin-social-feedback";
      }, 3000);
    }
  }

  /**
   * Load existing company contacts from GET /admin/contacts and populate rows.
   * Stores result in adminContactsState for later diff in saveAdminSocialContacts().
   */
  async function loadAdminSocialContacts() {
    // Guard: block only exists in the settings panel
    const rowsEl = document.getElementById("admin-social-rows");
    if (!rowsEl) return;

    try {
      // Authenticated GET — returns ALL contacts including disabled ones
      const res = await fetchWithAuth(`${ADMIN_API}/admin/contacts`);
      if (!res.ok) {
        console.warn("Failed to load admin contacts:", res.status);
        return;
      }
      const contacts = await res.json();

      // Build state map: type (uppercase) → contact object
      adminContactsState = {};
      contacts.forEach((c) => {
        if (c.type) {
          adminContactsState[c.type.toUpperCase()] = {
            id: c.id,
            value: c.value ?? "",
            label: c.label ?? "",
            enabled: c.enabled ?? false,
            displayOrder: c.displayOrder ?? 0,
          };
        }
      });

      // Populate each platform row from loaded state
      SOCIAL_PLATFORMS.forEach((platform) => {
        const state = adminContactsState[platform];
        const inputEl = document.getElementById(`social-input-${platform}`);
        const toggleEl = document.getElementById(`social-toggle-${platform}`);

        if (inputEl) {
          // Populate input with existing value; empty if not set
          inputEl.value = state ? state.value : "";
        }
        if (toggleEl) {
          // Check toggle if contact exists and is enabled
          toggleEl.checked = state ? state.enabled : false;
        }
      });
    } catch (err) {
      console.error("Admin social contacts load error:", err);
    }
  }

  /**
   * Save all social contact rows: POST new, PATCH changed, DELETE emptied.
   * Strategy:
   *   - Empty URL + no existing id → skip (nothing to do)
   *   - Non-empty URL + no existing id → POST (create new contact)
   *   - Non-empty URL + existing id + changed → PATCH (update)
   *   - Empty URL + existing id → DELETE (remove the contact entirely)
   *   - Only toggle changed (URL unchanged) + existing id → PATCH enabled only
   * After all writes succeed → invalidate public cache so frontend re-fetches.
   */
  async function saveAdminSocialContacts() {
    const saveBtn = document.getElementById("admin-social-save");
    if (saveBtn) {
      saveBtn.disabled = true;
    }

    // Clear all prior row errors
    SOCIAL_PLATFORMS.forEach((p) => setSocialRowError(p, null));

    // Validate all rows first — collect errors before any API call
    let hasErrors = false;
    const rowData = SOCIAL_PLATFORMS.map((platform) => {
      const inputEl = document.getElementById(`social-input-${platform}`);
      const toggleEl = document.getElementById(`social-toggle-${platform}`);
      const value = inputEl ? inputEl.value.trim() : "";
      const enabled = toggleEl ? toggleEl.checked : false;

      // Validate URL if non-empty
      const validationError = validateSocialUrl(platform, value);
      if (validationError) {
        setSocialRowError(platform, validationError);
        hasErrors = true;
      }

      return { platform, value, enabled };
    });

    if (hasErrors) {
      // Re-enable button and show error feedback
      if (saveBtn) saveBtn.disabled = false;
      showSocialFeedback("Виправте помилки у полях", "error");
      return;
    }

    // Build an array of API write operations to execute
    const writes = [];

    rowData.forEach(({ platform, value, enabled }) => {
      const existing = adminContactsState[platform];

      if (!value) {
        // Empty URL — delete if an existing record was found
        if (existing?.id) {
          writes.push(
            fetchWithAuth(`${ADMIN_API}/admin/contacts/${existing.id}`, {
              method: "DELETE",
            }),
          );
        }
        // No existing record + empty URL → nothing to do
      } else if (!existing?.id) {
        // New contact — POST to create
        writes.push(
          fetchWithAuth(`${ADMIN_API}/admin/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: platform,
              value,
              label: "",
              enabled,
              displayOrder: SOCIAL_PLATFORMS.indexOf(platform),
            }),
          }),
        );
      } else {
        // Existing contact — PATCH only if value or enabled changed
        const valueChanged = value !== existing.value;
        const enabledChanged = enabled !== existing.enabled;
        if (valueChanged || enabledChanged) {
          // Build partial body — only include changed fields
          const patchBody = {};
          if (valueChanged) patchBody.value = value;
          if (enabledChanged) patchBody.enabled = enabled;
          writes.push(
            fetchWithAuth(`${ADMIN_API}/admin/contacts/${existing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patchBody),
            }),
          );
        }
      }
    });

    if (!writes.length) {
      // No changes detected — show a neutral message
      if (saveBtn) saveBtn.disabled = false;
      showSocialFeedback("Змін не виявлено", "success");
      return;
    }

    try {
      // Execute all writes in parallel — faster and atomic enough for this use case
      const results = await Promise.all(writes);

      // Check for any failed responses
      const failed = results.filter((r) => !r.ok && r.status !== 204);

      if (failed.length) {
        showSocialFeedback(
          `Помилка збереження (${failed.length} запити невдалі)`,
          "error",
        );
      } else {
        // All writes succeeded — reload state and invalidate public cache
        await loadAdminSocialContacts();
        // Bust the 5-min localStorage cache so footer/contact render new data
        invalidateCompanyLinksCache();
        showSocialFeedback("Збережено — сайт оновлено", "success");
      }
    } catch (err) {
      console.error("Admin social contacts save error:", err);
      showSocialFeedback("Помилка з'єднання. Спробуйте ще раз.", "error");
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  // Wire Save button for social contacts block
  document
    .getElementById("admin-social-save")
    ?.addEventListener("click", saveAdminSocialContacts);

  // Load social contacts immediately if the settings panel is already active on page load
  // (e.g. navigated via URL hash or direct link — not just on click)
  if (document.querySelector('[data-panel="settings"]:not([hidden])')) {
    loadAdminSocialContacts();
  }

  // Load overview data on init
  loadAdminStats();
  loadAdminRecentUsers();
});
