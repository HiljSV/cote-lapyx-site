// =============================================================================
// Dashboard — Owner cabinet JS
// =============================================================================

import { fetchWithAuth } from "@js/common/auth.js";

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

  // Shared state — set once /users/me resolves
  let myUserId = null;
  let postsPage = 0;
  let postsStatusFilter = "";
  let projectsPage = 0;
  let projectsStatusFilter = "";
  let subscribersPage = 0;
  let commentsPage = 0;
  let commentsStatusFilter = "";
  let subscribersStatusFilter = "";
  let allSubscribersData = [];

  // Load user data: reveal admin link + populate profile form + update sidebar
  (async () => {
    try {
      const res = await fetchWithAuth(
        "https://api.cote-lapyx.com/api/v1/users/me",
      );
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
        const parts = user.name.trim().split(/\s+/);
        const initials =
          parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
        initEl.textContent = initials.toUpperCase();
      }

      myUserId = user.id;

      // Load overview stats + recent content for OWNER users
      if (user.role === "OWNER") {
        loadOverviewStats(user.id);
      }

      // Load data for whichever panel the user may have navigated to
      // before this /users/me fetch resolved (race condition guard)
      if (document.querySelector('[data-panel="posts"]:not([hidden])')) {
        loadPosts(0, postsStatusFilter);
      }
      if (document.querySelector('[data-panel="projects"]:not([hidden])')) {
        loadProjects(0, projectsStatusFilter);
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
      if (section === "posts" && myUserId) {
        loadPosts(0, postsStatusFilter);
      }
      if (section === "projects" && myUserId) {
        loadProjects(0, projectsStatusFilter);
      }
      if (section === "subscribers") {
        loadSubscribers(0, subscribersStatusFilter);
      }
      if (section === "comments") {
        loadComments(0, commentsStatusFilter);
      }
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
  // Overview stats & recent content (OWNER only)
  // ---------------------------------------------------------------------------

  const API = "https://api.cote-lapyx.com/api/v1";

  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

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

  const COMMENT_STATUS_LABEL = {
    PENDING: "Очікує",
    APPROVED: "Схвалено",
    REJECTED: "Відхилено",
    DELETED: "Видалено",
  };
  const COMMENT_STATUS_CLASS = {
    PENDING: "draft",
    APPROVED: "published",
    REJECTED: "archived",
    DELETED: "archived",
  };

  const TYPE_BADGE = {
    GENERAL: ["cyan", "Загальне"],
    PERSONAL: ["magenta", "Особисте"],
  };

  const TECH_COLORS = ["cyan", "magenta", "green"];

  function postRowHtml(post) {
    const [badgeColor, typeLabel] = TYPE_BADGE[post.type] || [
      "cyan",
      post.type,
    ];
    const sClass = STATUS_CLASS[post.status] || "draft";
    const sLabel = STATUS_LABEL[post.status] || post.status;
    return `<div class="dash-list__row">
      <div class="dash-list__title" data-label="Заголовок">${escHtml(post.title)}</div>
      <div data-label="Категорія"><span class="neon-badge neon-badge--${badgeColor}">${typeLabel}</span></div>
      <div class="dash-list__date" data-label="Дата">${fmtDate(post.createdAt)}</div>
      <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="Дії">
        <button type="button" class="btn btn--ghost btn--sm">Редагувати</button>
        <button type="button" class="btn btn--magenta btn--sm">Видалити</button>
      </div>
    </div>`;
  }

  function projectRowHtml(project) {
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
      <div class="dash-list__tech" data-label="Технології">${techs || "—"}</div>
      <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="Дії">
        <button type="button" class="btn btn--ghost btn--sm">Редагувати</button>
        <button type="button" class="btn btn--magenta btn--sm">Видалити</button>
      </div>
    </div>`;
  }

  function escHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadOverviewStats(authorId) {
    try {
      const [statsRes, postsRes, projectsRes] = await Promise.all([
        fetchWithAuth(`${API}/dashboard/stats`),
        fetchWithAuth(
          `${API}/admin/posts?authorId=${authorId}&size=5&sort=createdAt,desc`,
        ),
        fetchWithAuth(
          `${API}/admin/projects?authorId=${authorId}&size=3&sort=createdAt,desc`,
        ),
      ]);

      // Stat cards
      if (statsRes.ok) {
        const stats = await statsRes.json();
        const set = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val ?? "0";
        };
        set("stat-posts", stats.postsTotal);
        set("stat-projects", stats.projectsTotal);
        set("stat-comments", stats.commentsTotal);
        set("stat-subscribers", stats.subscribersTotal);
      }

      // Recent posts
      const postsBody = document.getElementById("overview-posts-body");
      if (postsBody) {
        if (postsRes.ok) {
          const data = await postsRes.json();
          const rows = (data.content || []).map(postRowHtml).join("");
          postsBody.innerHTML =
            rows || '<div class="dash-list__empty">Публікацій ще немає</div>';
        } else {
          postsBody.innerHTML =
            '<div class="dash-list__empty">Помилка завантаження</div>';
        }
      }

      // Recent projects
      const projectsBody = document.getElementById("overview-projects-body");
      if (projectsBody) {
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          const rows = (data.content || []).map(projectRowHtml).join("");
          projectsBody.innerHTML =
            rows || '<div class="dash-list__empty">Проектів ще немає</div>';
        } else {
          projectsBody.innerHTML =
            '<div class="dash-list__empty">Помилка завантаження</div>';
        }
      }
    } catch (err) {
      console.error("Overview load error:", err);
      document
        .querySelectorAll("#overview-posts-body, #overview-projects-body")
        .forEach((el) => {
          el.innerHTML =
            '<div class="dash-list__empty">Помилка завантаження</div>';
        });
    }
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
      const res = await fetchWithAuth(
        "https://api.cote-lapyx.com/api/v1/users/me",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

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
      const res = await fetchWithAuth(
        "https://api.cote-lapyx.com/api/v1/users/me/password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

  // ---------------------------------------------------------------------------
  // Posts CRUD — full list panel
  // ---------------------------------------------------------------------------

  function postListRowHtml(post) {
    const [badgeColor, typeLabel] = TYPE_BADGE[post.type] || [
      "cyan",
      post.type,
    ];
    const sClass = STATUS_CLASS[post.status] || "draft";
    const sLabel = STATUS_LABEL[post.status] || post.status;
    return `<div class="dash-list__row" data-slug="${escHtml(post.slug)}">
      <div class="dash-list__title" data-label="Заголовок">${escHtml(post.title)}</div>
      <div data-label="Категорія"><span class="neon-badge neon-badge--${badgeColor}">${typeLabel}</span></div>
      <div class="dash-list__date" data-label="Дата">${fmtDate(post.createdAt)}</div>
      <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="Дії">
        <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-slug="${escHtml(post.slug)}">Редагувати</button>
        <button type="button" class="btn btn--magenta btn--sm" data-action="delete" data-slug="${escHtml(post.slug)}" data-title="${escHtml(post.title)}">Видалити</button>
      </div>
    </div>`;
  }

  async function loadPosts(page, status) {
    postsPage = page;
    postsStatusFilter = status;
    const listBody = document.getElementById("posts-list-body");
    const pagination = document.getElementById("posts-pagination");
    if (!listBody) return;

    listBody.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';
    if (pagination) pagination.innerHTML = "";

    const statusParam = status ? `&status=${status}` : "";
    try {
      const res = await fetchWithAuth(
        `${API}/admin/posts?authorId=${myUserId}&size=20&sort=createdAt,desc&page=${page}${statusParam}`,
      );
      if (!res.ok) {
        listBody.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      const rows = (data.content || []).map(postListRowHtml).join("");
      listBody.innerHTML =
        rows || '<div class="dash-list__empty">Публікацій ще немає</div>';

      // Render pagination buttons when there's more than one page
      if (pagination && data.page && data.page.totalPages > 1) {
        const { number, totalPages } = data.page;
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
          const active = i === number ? " is-active" : "";
          return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
        }).join("");
      }
    } catch (err) {
      console.error("Posts load error:", err);
      listBody.innerHTML =
        '<div class="dash-list__empty">Помилка завантаження</div>';
    }
  }

  // Modal helpers
  const postModal = document.getElementById("post-modal");

  function openPostModal(slug) {
    const form = document.getElementById("post-form");
    const titleEl = document.getElementById("post-modal-title");
    const feedback = document.getElementById("post-form-feedback");
    form?.reset();
    if (feedback) {
      feedback.textContent = "";
      feedback.setAttribute("hidden", "");
    }
    document.getElementById("post-edit-slug").value = slug || "";
    if (titleEl)
      titleEl.textContent = slug ? "Редагування публікації" : "Нова публікація";
    postModal?.removeAttribute("hidden");
    document.body.style.overflow = "hidden";

    if (slug) {
      fetchWithAuth(`${API}/posts/${slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((post) => {
          if (!post) return;
          const setField = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val ?? "";
          };
          setField("post-title", post.title);
          setField("post-type", post.type);
          setField("post-excerpt", post.excerpt);
          setField("post-content", post.content);
          setField("post-cover", post.coverImage);
          setField("post-status", post.status);
          if (post.coverImage) {
            showCoverPreview("post-cover-preview", post.coverImage);
          } else {
            const preview = document.getElementById("post-cover-preview");
            if (preview) preview.setAttribute("hidden", "");
          }
        })
        .catch(() => {});
    }
  }

  function closePostModal() {
    postModal?.setAttribute("hidden", "");
    document.body.style.overflow = "";
    const preview = document.getElementById("post-cover-preview");
    if (preview) preview.setAttribute("hidden", "");
  }

  async function handlePostSubmit(e) {
    e.preventDefault();
    const slug = document.getElementById("post-edit-slug").value;
    const feedback = document.getElementById("post-form-feedback");
    const submitBtn = document.getElementById("post-form-submit");

    // Client-side validation
    const title = document.getElementById("post-title").value.trim();
    const content = document.getElementById("post-content").value.trim();
    const titleErr = document.getElementById("post-title-error");
    const contentErr = document.getElementById("post-content-error");
    let valid = true;

    if (titleErr) titleErr.textContent = "";
    if (contentErr) contentErr.textContent = "";
    if (!title) {
      if (titleErr) titleErr.textContent = "Заголовок обовʼязковий";
      valid = false;
    }
    if (!content) {
      if (contentErr) contentErr.textContent = "Зміст обовʼязковий";
      valid = false;
    }
    if (!valid) return;

    const payload = {
      title,
      type: document.getElementById("post-type").value,
      excerpt: document.getElementById("post-excerpt").value.trim() || null,
      content,
      coverImage: document.getElementById("post-cover").value.trim() || null,
      status: document.getElementById("post-status").value,
    };

    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = "Збереження...";
    if (feedback) {
      feedback.textContent = "";
      feedback.setAttribute("hidden", "");
    }

    try {
      const res = await fetchWithAuth(
        slug ? `${API}/posts/${slug}` : `${API}/posts`,
        {
          method: slug ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok || res.status === 201) {
        closePostModal();
        loadPosts(postsPage, postsStatusFilter);
        if (myUserId) loadOverviewStats(myUserId);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.message || "Помилка збереження. Спробуйте ще раз.";
        if (feedback) {
          feedback.textContent = msg;
          feedback.className =
            "dash-modal__feedback dash-modal__feedback--error";
          feedback.removeAttribute("hidden");
        }
      }
    } catch {
      if (feedback) {
        feedback.textContent = "Помилка зʼєднання.";
        feedback.className = "dash-modal__feedback dash-modal__feedback--error";
        feedback.removeAttribute("hidden");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  async function deletePost(slug, title) {
    if (!confirm(`Видалити публікацію "${title}"?`)) return;
    try {
      const res = await fetchWithAuth(`${API}/admin/posts/${slug}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        loadPosts(postsPage, postsStatusFilter);
        if (myUserId) loadOverviewStats(myUserId);
      } else {
        alert("Помилка видалення. Спробуйте ще раз.");
      }
    } catch {
      alert("Помилка зʼєднання.");
    }
  }

  // Event wiring — posts panel
  document
    .getElementById("post-create-btn")
    ?.addEventListener("click", () => openPostModal(null));
  document
    .getElementById("post-modal-close")
    ?.addEventListener("click", closePostModal);
  document
    .getElementById("post-modal-cancel")
    ?.addEventListener("click", closePostModal);
  document
    .getElementById("post-modal-backdrop")
    ?.addEventListener("click", closePostModal);

  document
    .getElementById("post-filter-status")
    ?.addEventListener("change", (e) => {
      loadPosts(0, e.target.value);
    });

  document.getElementById("posts-list-body")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, slug, title } = btn.dataset;
    if (action === "edit") openPostModal(slug);
    else if (action === "delete") deletePost(slug, title);
  });

  document
    .getElementById("posts-pagination")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      loadPosts(Number(btn.dataset.page), postsStatusFilter);
    });

  document
    .getElementById("post-form")
    ?.addEventListener("submit", handlePostSubmit);

  // ---------------------------------------------------------------------------
  // Projects CRUD — full list panel
  // ---------------------------------------------------------------------------

  function projectListRowHtml(project) {
    const techs = (project.technologies || [])
      .slice(0, 3)
      .map(
        (t, i) =>
          `<span class="neon-badge neon-badge--${TECH_COLORS[i % 3]}">${escHtml(t)}</span>`,
      )
      .join("");
    const sClass = STATUS_CLASS[project.status] || "draft";
    const sLabel = STATUS_LABEL[project.status] || project.status;
    return `<div class="dash-list__row" data-slug="${escHtml(project.slug)}">
      <div class="dash-list__title" data-label="Назва">${escHtml(project.title)}</div>
      <div class="dash-list__tech" data-label="Технології">${techs || "—"}</div>
      <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="Дії">
        <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-slug="${escHtml(project.slug)}">Редагувати</button>
        <button type="button" class="btn btn--magenta btn--sm" data-action="delete" data-slug="${escHtml(project.slug)}" data-title="${escHtml(project.title)}">Видалити</button>
      </div>
    </div>`;
  }

  async function loadProjects(page, status) {
    projectsPage = page;
    projectsStatusFilter = status;
    const listBody = document.getElementById("projects-list-body");
    const pagination = document.getElementById("projects-pagination");
    if (!listBody) return;

    listBody.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';
    if (pagination) pagination.innerHTML = "";

    const statusParam = status ? `&status=${status}` : "";
    try {
      const res = await fetchWithAuth(
        `${API}/admin/projects?authorId=${myUserId}&size=20&sort=createdAt,desc&page=${page}${statusParam}`,
      );
      if (!res.ok) {
        listBody.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      const rows = (data.content || []).map(projectListRowHtml).join("");
      listBody.innerHTML =
        rows || '<div class="dash-list__empty">Проектів ще немає</div>';

      if (pagination && data.page && data.page.totalPages > 1) {
        const { number, totalPages } = data.page;
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
          const active = i === number ? " is-active" : "";
          return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
        }).join("");
      }
    } catch (err) {
      console.error("Projects load error:", err);
      listBody.innerHTML =
        '<div class="dash-list__empty">Помилка завантаження</div>';
    }
  }

  const projectModal = document.getElementById("project-modal");

  function openProjectModal(slug) {
    const form = document.getElementById("project-form");
    const titleEl = document.getElementById("project-modal-title");
    const feedback = document.getElementById("project-form-feedback");
    form?.reset();
    if (feedback) {
      feedback.textContent = "";
      feedback.setAttribute("hidden", "");
    }
    document.getElementById("project-edit-slug").value = slug || "";
    if (titleEl)
      titleEl.textContent = slug ? "Редагування проекту" : "Новий проект";
    projectModal?.removeAttribute("hidden");
    document.body.style.overflow = "hidden";

    if (slug) {
      fetchWithAuth(`${API}/projects/${slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((project) => {
          if (!project) return;
          const setField = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val ?? "";
          };
          setField("project-title", project.title);
          setField("project-short-desc", project.shortDescription);
          setField("project-full-desc", project.fullDescription);
          setField(
            "project-technologies",
            (project.technologies || []).join(", "),
          );
          setField("project-cover", project.coverImage);
          setField("project-url", project.projectUrl);
          setField("project-github", project.githubUrl);
          setField("project-status", project.status);
          if (project.coverImage) {
            showCoverPreview("project-cover-preview", project.coverImage);
          } else {
            const preview = document.getElementById("project-cover-preview");
            if (preview) preview.setAttribute("hidden", "");
          }
        })
        .catch(() => {});
    }
  }

  function closeProjectModal() {
    projectModal?.setAttribute("hidden", "");
    document.body.style.overflow = "";
    const preview = document.getElementById("project-cover-preview");
    if (preview) preview.setAttribute("hidden", "");
  }

  async function handleProjectSubmit(e) {
    e.preventDefault();
    const slug = document.getElementById("project-edit-slug").value;
    const feedback = document.getElementById("project-form-feedback");
    const submitBtn = document.getElementById("project-form-submit");

    const title = document.getElementById("project-title").value.trim();
    const shortDesc = document
      .getElementById("project-short-desc")
      .value.trim();
    const titleErr = document.getElementById("project-title-error");
    const shortDescErr = document.getElementById("project-short-desc-error");
    let valid = true;

    if (titleErr) titleErr.textContent = "";
    if (shortDescErr) shortDescErr.textContent = "";
    if (!title) {
      if (titleErr) titleErr.textContent = "Назва обовʼязкова";
      valid = false;
    }
    if (!shortDesc) {
      if (shortDescErr) shortDescErr.textContent = "Короткий опис обовʼязковий";
      valid = false;
    }
    if (!valid) return;

    const techRaw = document.getElementById("project-technologies").value;
    const technologies = techRaw
      ? techRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const payload = {
      title,
      shortDescription: shortDesc,
      fullDescription:
        document.getElementById("project-full-desc").value.trim() || null,
      technologies,
      coverImage: document.getElementById("project-cover").value.trim() || null,
      projectUrl: document.getElementById("project-url").value.trim() || null,
      githubUrl: document.getElementById("project-github").value.trim() || null,
      status: document.getElementById("project-status").value,
    };

    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = "Збереження...";
    if (feedback) {
      feedback.textContent = "";
      feedback.setAttribute("hidden", "");
    }

    try {
      const res = await fetchWithAuth(
        slug ? `${API}/projects/${slug}` : `${API}/projects`,
        {
          method: slug ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok || res.status === 201) {
        closeProjectModal();
        loadProjects(projectsPage, projectsStatusFilter);
        if (myUserId) loadOverviewStats(myUserId);
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.message || "Помилка збереження. Спробуйте ще раз.";
        if (feedback) {
          feedback.textContent = msg;
          feedback.className =
            "dash-modal__feedback dash-modal__feedback--error";
          feedback.removeAttribute("hidden");
        }
      }
    } catch {
      if (feedback) {
        feedback.textContent = "Помилка зʼєднання.";
        feedback.className = "dash-modal__feedback dash-modal__feedback--error";
        feedback.removeAttribute("hidden");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  async function deleteProject(slug, title) {
    if (!confirm(`Видалити проект "${title}"?`)) return;
    try {
      const res = await fetchWithAuth(`${API}/projects/${slug}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        loadProjects(projectsPage, projectsStatusFilter);
        if (myUserId) loadOverviewStats(myUserId);
      } else {
        alert("Помилка видалення. Спробуйте ще раз.");
      }
    } catch {
      alert("Помилка зʼєднання.");
    }
  }

  // Event wiring — projects panel
  document
    .getElementById("project-create-btn")
    ?.addEventListener("click", () => openProjectModal(null));
  document
    .getElementById("project-modal-close")
    ?.addEventListener("click", closeProjectModal);
  document
    .getElementById("project-modal-cancel")
    ?.addEventListener("click", closeProjectModal);
  document
    .getElementById("project-modal-backdrop")
    ?.addEventListener("click", closeProjectModal);

  document
    .getElementById("project-filter-status")
    ?.addEventListener("change", (e) => {
      loadProjects(0, e.target.value);
    });

  document
    .getElementById("projects-list-body")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const { action, slug, title } = btn.dataset;
      if (action === "edit") openProjectModal(slug);
      else if (action === "delete") deleteProject(slug, title);
    });

  document
    .getElementById("projects-pagination")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      loadProjects(Number(btn.dataset.page), projectsStatusFilter);
    });

  document
    .getElementById("project-form")
    ?.addEventListener("submit", handleProjectSubmit);

  // ---------------------------------------------------------------------------
  // Subscribers panel
  // ---------------------------------------------------------------------------

  const SUB_TYPE_LABEL = { GENERAL: "Загальне", PERSONAL: "Особисте" };
  const SUB_STATUS_LABEL = {
    ACTIVE: "Активна",
    CANCELLED: "Скасована",
    EXPIRED: "Закінчилась",
  };
  const SUB_STATUS_CLASS = {
    ACTIVE: "published",
    CANCELLED: "draft",
    EXPIRED: "archived",
  };

  async function loadSubscribers(page, statusFilter) {
    subscribersPage = page;
    subscribersStatusFilter = statusFilter ?? subscribersStatusFilter;
    const listBody = document.getElementById("subscribers-list-body");
    const pagination = document.getElementById("subscribers-pagination");
    if (!listBody) return;

    listBody.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';
    if (pagination) pagination.innerHTML = "";

    const statusParam = subscribersStatusFilter
      ? `&status=${subscribersStatusFilter}`
      : "";
    try {
      const res = await fetchWithAuth(
        `${API}/admin/subscriptions?size=20&sort=createdAt,desc&page=${page}${statusParam}`,
      );
      if (!res.ok) {
        listBody.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      allSubscribersData = data.content || [];

      const rows = allSubscribersData
        .map((sub) => {
          const sClass = SUB_STATUS_CLASS[sub.status] || "draft";
          const sLabel = SUB_STATUS_LABEL[sub.status] || sub.status;
          const typeLabel = SUB_TYPE_LABEL[sub.type] || sub.type;
          return `<div class="dash-list__row">
            <div data-label="Email">${escHtml(sub.email)}</div>
            <div data-label="Тип">${escHtml(typeLabel)}</div>
            <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
            <div class="dash-list__date" data-label="Дата підписки">${fmtDate(sub.createdAt)}</div>
            <div class="dash-list__actions" data-label="Дії">
              <button type="button" class="btn btn--magenta btn--sm" data-action="delete-sub" data-id="${sub.id}">Видалити</button>
            </div>
          </div>`;
        })
        .join("");
      listBody.innerHTML =
        rows || '<div class="dash-list__empty">Підписників ще немає</div>';

      if (pagination && data.page && data.page.totalPages > 1) {
        const { number, totalPages } = data.page;
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
          const active = i === number ? " is-active" : "";
          return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
        }).join("");
      }
    } catch (err) {
      console.error("Subscribers load error:", err);
      listBody.innerHTML =
        '<div class="dash-list__empty">Помилка завантаження</div>';
    }
  }

  async function deleteSubscriber(id) {
    if (!confirm("Видалити підписника?")) return;
    try {
      const res = await fetchWithAuth(`${API}/admin/subscriptions/${id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        loadSubscribers(subscribersPage, subscribersStatusFilter);
      } else {
        alert("Помилка видалення. Спробуйте ще раз.");
      }
    } catch {
      alert("Помилка зʼєднання.");
    }
  }

  function exportSubscribersCSV() {
    if (!allSubscribersData.length) {
      alert(
        "Немає даних для експорту. Спочатку завантажте список підписників.",
      );
      return;
    }
    const header = ["Email", "Тип", "Статус", "Дата підписки"];
    const rows = allSubscribersData.map((s) => [
      s.email || "",
      SUB_TYPE_LABEL[s.type] || s.type || "",
      SUB_STATUS_LABEL[s.status] || s.status || "",
      s.createdAt ? new Date(s.createdAt).toLocaleDateString("uk-UA") : "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function commentRowHtml(comment) {
    const sClass = COMMENT_STATUS_CLASS[comment.status] || "draft";
    const sLabel = COMMENT_STATUS_LABEL[comment.status] || comment.status;
    const content = comment.content || comment.text || "";
    const excerpt = content.length > 80 ? content.slice(0, 80) + "…" : content;
    const postTitle = comment.blogPost?.title || comment.postTitle || "—";
    const authorName = comment.author?.name || comment.authorName || "—";

    const approveBtn =
      comment.status === "PENDING"
        ? `<button type="button" class="btn btn--green btn--sm" data-action="approve-comment" data-id="${comment.id}" title="Схвалити">✓</button>`
        : "";
    const rejectBtn =
      comment.status === "PENDING"
        ? `<button type="button" class="btn btn--ghost btn--sm" data-action="reject-comment" data-id="${comment.id}" title="Відхилити">✗</button>`
        : "";
    const deleteBtn = `<button type="button" class="btn btn--magenta btn--sm" data-action="delete-comment" data-id="${comment.id}" title="Видалити">Видалити</button>`;

    return `<div class="dash-list__row" data-id="${comment.id}">
      <div data-label="Автор">${escHtml(authorName)}</div>
      <div data-label="Коментар">${escHtml(excerpt)}</div>
      <div class="dash-list__title" data-label="Пост">${escHtml(postTitle)}</div>
      <div class="dash-list__date" data-label="Дата">${fmtDate(comment.createdAt)}</div>
      <div data-label="Статус"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="Дії">${approveBtn}${rejectBtn}${deleteBtn}</div>
    </div>`;
  }

  async function loadComments(page, statusFilter) {
    commentsPage = page;
    commentsStatusFilter = statusFilter;
    const listBody = document.getElementById("comments-list-body");
    const pagination = document.getElementById("comments-pagination");
    if (!listBody) return;

    listBody.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';
    if (pagination) pagination.innerHTML = "";

    const statusParam = statusFilter ? `&status=${statusFilter}` : "";
    try {
      const res = await fetchWithAuth(
        `${API}/admin/comments?size=20&sort=createdAt,desc&page=${page}${statusParam}`,
      );
      if (!res.ok) {
        listBody.innerHTML =
          '<div class="dash-list__empty">Помилка завантаження</div>';
        return;
      }
      const data = await res.json();
      const rows = (data.content || []).map(commentRowHtml).join("");
      listBody.innerHTML =
        rows || '<div class="dash-list__empty">Коментарів ще немає</div>';

      if (pagination && data.page && data.page.totalPages > 1) {
        const { number, totalPages } = data.page;
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
          const active = i === number ? " is-active" : "";
          return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
        }).join("");
      }
    } catch (err) {
      console.error("Comments load error:", err);
      listBody.innerHTML =
        '<div class="dash-list__empty">Помилка завантаження</div>';
    }
  }

  async function moderateComment(id, action) {
    try {
      const res = await fetchWithAuth(`${API}/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        loadComments(commentsPage, commentsStatusFilter);
      } else {
        alert("Помилка модерації. Спробуйте ще раз.");
      }
    } catch {
      alert("Помилка зʼєднання.");
    }
  }

  async function deleteComment(id) {
    if (!confirm("Видалити коментар?")) return;
    try {
      const res = await fetchWithAuth(`${API}/comments/${id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        loadComments(commentsPage, commentsStatusFilter);
      } else {
        alert("Помилка видалення. Спробуйте ще раз.");
      }
    } catch {
      alert("Помилка зʼєднання.");
    }
  }

  async function uploadImage(file, urlInputId, previewContainerId) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetchWithAuth(`${API}/upload/image`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const urlInput = document.getElementById(urlInputId);
        if (urlInput) urlInput.value = data.url || data.imageUrl || "";
        showCoverPreview(previewContainerId, data.url || data.imageUrl || "");
      } else {
        alert("Помилка завантаження файлу. Спробуйте ще раз.");
      }
    } catch {
      alert("Помилка зʼєднання при завантаженні файлу.");
    }
  }

  function showCoverPreview(containerId, src) {
    const container = document.getElementById(containerId);
    const img = document.getElementById(containerId + "-img");
    if (!container || !img || !src) return;
    img.src = src;
    container.removeAttribute("hidden");
  }

  document
    .getElementById("subscribers-pagination")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      loadSubscribers(Number(btn.dataset.page), subscribersStatusFilter);
    });

  document
    .getElementById("subscribers-filter-status")
    ?.addEventListener("change", (e) => {
      loadSubscribers(0, e.target.value);
    });

  document
    .getElementById("subscribers-export-csv")
    ?.addEventListener("click", exportSubscribersCSV);

  document
    .getElementById("subscribers-list-body")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "delete-sub") deleteSubscriber(btn.dataset.id);
    });

  document
    .getElementById("comment-filter-status")
    ?.addEventListener("change", (e) => {
      loadComments(0, e.target.value);
    });

  document
    .getElementById("comments-list-body")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === "approve-comment") moderateComment(Number(id), "APPROVED");
      else if (action === "reject-comment")
        moderateComment(Number(id), "REJECTED");
      else if (action === "delete-comment") deleteComment(Number(id));
    });

  document
    .getElementById("comments-pagination")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      loadComments(Number(btn.dataset.page), commentsStatusFilter);
    });

  document
    .getElementById("post-cover-file")
    ?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) uploadImage(file, "post-cover", "post-cover-preview");
    });

  document
    .getElementById("project-cover-file")
    ?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) uploadImage(file, "project-cover", "project-cover-preview");
    });
});
