// =============================================================================
// Admin Panel — Site administrator interface JS
// SPA-style section switching, mobile sidebar drawer, comment filter tabs
// =============================================================================

import { fetchWithAuth } from "@js/common/auth.js";

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
    const refreshToken = localStorage.getItem("cl_refresh");
    if (refreshToken) {
      // Await logout call so the token is invalidated server-side before redirect
      try {
        await fetch("https://api.cote-lapyx.com/api/v1/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        /* best-effort — proceed to local cleanup regardless */
      }
    }
    localStorage.removeItem("cl_access");
    localStorage.removeItem("cl_refresh");
    window.location.replace("/login.html");
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

  function renderChart(dataPoints) {
    const barsEl = document.getElementById("analytics-bars");
    const labelsEl = document.getElementById("analytics-labels");
    if (!barsEl || !labelsEl) return;

    if (!dataPoints || dataPoints.length === 0) {
      barsEl.innerHTML =
        '<div class="analytics-chart-loading">Немає даних</div>';
      labelsEl.innerHTML = "";
      return;
    }

    const max = Math.max(...dataPoints.map((d) => d.pageviews), 1);

    barsEl.innerHTML = dataPoints
      .map((d) => {
        const pct = Math.round((d.pageviews / max) * 100);
        return `<div class="admin-activity-chart__bar" style="height:${pct || 2}%" title="${d.date}: ${d.pageviews} переглядів"></div>`;
      })
      .join("");

    labelsEl.innerHTML = dataPoints
      .map((d) => {
        const dt = new Date(d.date);
        const label = `${dt.getDate()}.${String(dt.getMonth() + 1).padStart(2, "0")}`;
        return `<span class="admin-activity-chart__label">${label}</span>`;
      })
      .join("");
  }

  function renderMetrics(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!items || items.length === 0) {
      el.innerHTML = '<div class="analytics-chart-loading">Немає даних</div>';
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

  function formatDuration(seconds) {
    if (!seconds) return "0с";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}м ${s}с` : `${s}с`;
  }

  async function loadAnalytics(period = "7d") {
    const base = "https://api.cote-lapyx.com/api/v1/analytics";

    // Set loading state
    document.querySelectorAll(".analytics-stat-value").forEach((el) => {
      el.textContent = "…";
    });
    document.getElementById("analytics-bars").innerHTML =
      '<div class="analytics-chart-loading">Завантаження...</div>';
    ["analytics-top-pages", "analytics-referrers"].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML =
          '<div class="analytics-chart-loading">Завантаження...</div>';
    });

    try {
      const [statsRes, pvRes, pagesRes, referrersRes] = await Promise.all([
        fetchWithAuth(`${base}/stats?period=${period}`),
        fetchWithAuth(`${base}/pageviews?period=${period}`),
        fetchWithAuth(`${base}/metrics?type=url&period=${period}&limit=8`),
        fetchWithAuth(`${base}/metrics?type=referrer&period=${period}&limit=8`),
      ]);

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

      if (pvRes.ok) {
        const pv = await pvRes.json();
        renderChart(pv.data || []);
      }

      if (pagesRes.ok) {
        renderMetrics("analytics-top-pages", await pagesRes.json());
      }

      if (referrersRes.ok) {
        renderMetrics("analytics-referrers", await referrersRes.json());
      }
    } catch (err) {
      console.error("Analytics load error:", err);
      document.getElementById("analytics-bars").innerHTML =
        '<div class="analytics-chart-loading">Помилка завантаження</div>';
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

  // ---------------------------------------------------------------------------
  // Admin — shared helpers
  // ---------------------------------------------------------------------------

  const ADMIN_API = "https://api.cote-lapyx.com/api/v1";

  const STATUS_LABEL = {
    PUBLISHED: "Опубліковано",
    DRAFT: "Чернетка",
    ARCHIVED: "Архів",
  };
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
      const rows = (data.content || [])
        .map((post) => {
          const sClass = STATUS_CLASS[post.status] || "draft";
          const sLabel = STATUS_LABEL[post.status] || post.status;
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
          const sLabel = STATUS_LABEL[project.status] || project.status;
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

  // Comment status display labels (Ukrainian)
  const COMMENT_STATUS_LABEL = {
    PENDING: "Очікує",
    APPROVED: "Схвалено",
    SEEN: "Переглянуто",
    REJECTED: "Відхилено",
    DELETED: "Видалено",
  };

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
      const rows = (data.content || [])
        .map((c) => {
          const sClass = COMMENT_STATUS_CLASS[c.status] || "draft";
          const sLabel = COMMENT_STATUS_LABEL[c.status] || c.status;

          // PENDING — show Approve + Reject (manual bad-words moderation)
          const canApprove = c.status === "PENDING" || c.status === "REJECTED";
          const canReject = c.status === "PENDING";
          const approveBtn = canApprove
            ? `<button type="button" class="btn btn--cyan btn--sm" data-action="approve" data-id="${c.id}">Схвалити</button>`
            : "";
          const rejectBtn = canReject
            ? `<button type="button" class="btn btn--ghost btn--sm" data-action="reject" data-id="${c.id}">Відхилити</button>`
            : "";

          // APPROVED — show "Mark Seen" button (PATCH /comments/{id}/seen)
          const seenBtn =
            c.status === "APPROVED"
              ? `<button type="button" class="btn btn--ghost btn--sm" data-action="seen" data-id="${c.id}">Переглянуто</button>`
              : "";

          // Delete — available for all statuses
          const deleteBtn = `<button type="button" class="btn btn--magenta btn--sm" data-action="delete-comment" data-id="${c.id}">Видалити</button>`;

          // Post link — show slug if available, fallback to postId
          const postRef = c.postSlug
            ? escHtml(c.postSlug)
            : `#${escHtml(String(c.postId || "—"))}`;

          return `<div class="dash-list__row">
            <div data-label="Автор">${escHtml(c.author?.name || c.author?.email || "—")}</div>
            <div data-label="Коментар">${escHtml((c.content || "").slice(0, 60))}${(c.content || "").length > 60 ? "…" : ""}</div>
            <div class="dash-list__title" data-label="Пост">${postRef}</div>
            <div class="dash-list__date" data-label="Дата">${fmtDate(c.createdAt)}</div>
            <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
            <div class="dash-list__actions" data-label="Дії">${approveBtn}${rejectBtn}${seenBtn}${deleteBtn}</div>
          </div>`;
        })
        .join("");
      body.innerHTML =
        rows || '<div class="dash-list__empty">Коментарів ще немає</div>';
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

  const CONTACT_STATUS_LABEL = {
    NEW: "Нове",
    READ: "Прочитано",
    REPLIED: "Відповіли",
  };
  const CONTACT_STATUS_COLOR = {
    NEW: "magenta",
    READ: "cyan",
    REPLIED: "green",
  };

  async function loadAdminContacts(page, status = "") {
    adminContactsPage = page;
    const body = document.getElementById("admin-contacts-body");
    if (!body) return;
    body.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';

    const statusParam = status ? `&status=${status}` : "";
    try {
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/contact-messages?size=20&sort=createdAt,desc&page=${page}${statusParam}`,
      );
      if (!res.ok) {
        body.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      const rows = (data.content || [])
        .map((m) => {
          const statusColor = CONTACT_STATUS_COLOR[m.status] || "cyan";
          const statusLabel = CONTACT_STATUS_LABEL[m.status] || m.status;
          // Truncate message to 80 chars for preview
          const preview =
            escHtml(m.message || "").slice(0, 80) +
            (m.message?.length > 80 ? "…" : "");
          return `<div class="dash-list__row">
            <div class="dash-list__title" data-label="Ім'я">${escHtml(m.name)}</div>
            <div data-label="Email"><a href="mailto:${escHtml(m.email)}" class="dash-list__link">${escHtml(m.email)}</a></div>
            <div data-label="Повідомлення" class="dash-list__preview">${preview}</div>
            <div class="dash-list__date" data-label="Дата">${fmtDate(m.createdAt)}</div>
            <div data-label="Статус"><span class="neon-badge neon-badge--${statusColor}">${statusLabel}</span></div>
            <div class="dash-list__actions" data-label="Дії">
              ${m.status === "NEW" ? `<button type="button" class="btn btn--ghost btn--xs" data-contact-action="read" data-id="${m.id}" title="Позначити прочитаним">✓</button>` : ""}
              <button type="button" class="btn btn--ghost btn--xs" data-contact-action="reply" data-email="${escHtml(m.email)}" data-name="${escHtml(m.name)}" title="Відповісти">✉</button>
              <button type="button" class="btn btn--ghost btn--xs btn--danger" data-contact-action="delete" data-id="${m.id}" title="Видалити">✕</button>
            </div>
          </div>`;
        })
        .join("");
      body.innerHTML =
        rows || '<div class="dash-list__empty">Звернень немає</div>';
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

  async function deleteContact(id) {
    try {
      const res = await fetchWithAuth(
        `${ADMIN_API}/admin/contact-messages/${id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        // Refresh list — deleted message disappears from default view
        loadAdminContacts(adminContactsPage, adminContactsFilter);
        loadAdminStats();
      }
    } catch {
      console.error("Failed to delete contact message");
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

  // Load overview data on init
  loadAdminStats();
  loadAdminRecentUsers();
});
