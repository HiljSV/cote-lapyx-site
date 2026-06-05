// =============================================================================
// Dashboard — Owner cabinet JS
// =============================================================================

import { fetchWithAuth, ensureSession } from "@js/common/auth.js";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

// Toast UI WYSIWYG editor — lazy-loaded via dynamic import() inside initPostEditor().
// NOT imported statically here — this keeps the ~643KB editor out of app.min.js
// so public pages (index, blog, post, team, …) do not pay for it.

// i18n — language detection, translation apply, switcher wiring, runtime lookup
import {
  detectLanguage,
  applyTranslations,
  initI18nSwitcher,
  translate,
} from "@js/i18n.js";

document.addEventListener("DOMContentLoaded", async () => {
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

  // Token guard — runs only on dashboard page (after sidebar check).
  // ensureSession() silently refreshes an expired/missing access token via the
  // HttpOnly refresh cookie BEFORE giving up, so an idle user is not kicked out
  // while their refresh cookie is still valid. Only redirect if there is truly
  // no session.
  if (!(await ensureSession())) {
    window.location.replace("/login.html");
    return;
  }

  // Hide content while /users/me is being verified — prevents stale-token flash
  const wrapper = document.querySelector(".wrapper");
  if (wrapper) wrapper.style.visibility = "hidden";

  // Shared state — set once /users/me resolves
  let myUserId = null;
  let currentSocialLinks = {}; // stores user.socialLinks for merge in profile PATCH
  let postsPage = 0;
  let postsStatusFilter = "";
  let projectsPage = 0;
  let projectsStatusFilter = "";
  let subscribersPage = 0;
  let commentsPage = 0;
  let commentsStatusFilter = "";
  let subscribersStatusFilter = "";
  let allSubscribersData = [];

  // Post WYSIWYG editor instance — initialized once (guard against re-init)
  // Holds the Toast UI Editor mounted on #post-content-editor
  let postEditor = null;

  // Load user data: reveal admin link + populate profile form + update sidebar
  (async () => {
    try {
      const res = await fetchWithAuth(
        "https://api.cote-lapyx.com/api/v1/users/me",
      );
      // Reveal page — auth confirmed (or signOut already fired on 401)
      if (wrapper) wrapper.style.visibility = "";
      if (!res.ok) return;
      const user = await res.json();

      // Reveal admin link for admin users
      if (user.isAdmin) {
        document.getElementById("dash-admin-link")?.removeAttribute("hidden");
      }

      // Populate profile form with real data from /users/me
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
      };
      setVal("profile-name", user.name);
      setVal("profile-email", user.email);
      setVal("profile-role", user.role);
      setVal("profile-bio", user.bio);
      // Hydrate Latin display name — may be null when not yet set
      setVal("profile-display-name", user.displayName);

      // Hydrate personal social links from user.socialLinks private shape.
      // Each platform is { url, enabled } or null/absent when never set.
      // Store the full object for merge in profile PATCH (prevents wiping unrendered fields).
      currentSocialLinks = user.socialLinks ?? {};

      // Populate URL + enabled toggle for each rendered social platform
      const socialPlatforms = [
        "telegram",
        "instagram",
        "linkedin",
        "github",
        "email",
      ];
      socialPlatforms.forEach((platform) => {
        const entry = currentSocialLinks[platform];
        const urlEl = document.getElementById(`profile-social-${platform}-url`);
        const enabledEl = document.getElementById(
          `profile-social-${platform}-enabled`,
        );
        // Hydrate URL field — use entry.url if present, empty string otherwise
        if (urlEl) urlEl.value = entry?.url ?? "";
        // Hydrate enabled toggle — default false when entry is absent
        if (enabledEl) enabledEl.checked = entry?.enabled ?? false;
      });

      // Update sidebar user info block — name, initials, role, badge
      const nameEl = document.querySelector(".dash-sidebar__name");
      const initEl = document.querySelector(".dash-sidebar__avatar");
      const roleEl = document.querySelector(".dash-sidebar__role");
      const badgeEl = document.querySelector(".dash-sidebar__badge");

      // Set sidebar name text
      if (nameEl && user.name) nameEl.textContent = user.name;

      // Generate initials from name parts (first letter of each word, max 2)
      if (initEl && user.name) {
        const parts = user.name.trim().split(/\s+/);
        const initials =
          parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
        initEl.textContent = initials.toUpperCase();
      }

      // Sidebar __role shows profession/title — not available in API, leave empty (JS cleared it via HTML)
      // Sidebar badge shows the role enum (e.g. "owner")
      if (badgeEl && user.role) badgeEl.textContent = user.role.toLowerCase();

      // Hydrate avatar widget in profile section + sidebar photo
      initAvatarWidget(user);

      myUserId = user.id;

      // Reveal OWNER-only nav items and load overview stats
      if (user.role === "OWNER") {
        document
          .querySelectorAll("[data-owner-nav]")
          .forEach((el) => el.removeAttribute("hidden"));
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

      // Deep-link from the admin panel: open the post/project editor directly.
      // Supported query params (mutually exclusive):
      //   ?newPost=1            → new-post modal
      //   ?editPost=<slug>      → edit existing post
      //   ?newProject=1         → new-project modal
      //   ?editProject=<slug>   → edit existing project
      // The query string is cleared afterwards so a refresh doesn't re-open it.
      handleEditorDeepLink();
    } catch (_) {}
  })();

  /**
   * Inspect the URL query string and open the relevant editor modal.
   * Called once /users/me has resolved (so myUserId-dependent loaders work).
   */
  function handleEditorDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const editPost = params.get("editPost");
    const editProject = params.get("editProject");
    const newPost = params.get("newPost");
    const newProject = params.get("newProject");
    if (!editPost && !editProject && !newPost && !newProject) return;

    if (newPost || editPost) {
      activateSection("posts");
      loadPosts(0, postsStatusFilter);
      openPostModal(editPost || null);
    } else if (newProject || editProject) {
      activateSection("projects");
      loadProjects(0, projectsStatusFilter);
      openProjectModal(editProject || null);
    }

    // Strip the params so a refresh / back-navigation doesn't reopen the modal.
    window.history.replaceState({}, "", window.location.pathname);
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
      if (section === "posts" && myUserId) {
        loadPosts(0, postsStatusFilter);
      }
      if (section === "projects" && myUserId) {
        loadProjects(0, projectsStatusFilter);
      }
      if (section === "subscribers") {
        loadSubscribers(0, subscribersStatusFilter);
      }
      if (section === "my-subscriptions") {
        loadMySubscriptions();
      }
      if (section === "favorites") {
        loadFavorites(0);
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

  // Overview panel — edit/delete buttons for recent posts
  document
    .getElementById("overview-posts-body")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const { action, slug, title } = btn.dataset;
      if (action === "edit") openPostModal(slug);
      else if (action === "delete") deletePost(slug, title);
    });

  // Overview panel — edit/delete buttons for recent projects
  document
    .getElementById("overview-projects-body")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const { action, slug, id, title } = btn.dataset;
      if (action === "edit") openProjectModal(slug);
      else if (action === "delete") deleteProject(slug, id, title);
    });

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
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
      window.location.replace("/");
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

  // ---------------------------------------------------------------------------
  // i18n label maps — resolved at runtime via translate() so they update on
  // language change without a full page reload.
  // ---------------------------------------------------------------------------

  // Post/project status → human-readable label (dash.status.*)
  const STATUS_LABEL = {
    PUBLISHED: translate("dash.status.published"),
    DRAFT: translate("dash.status.draft"),
    ARCHIVED: translate("dash.status.archived"),
  };

  // Post/project status → CSS modifier suffix for dash-status--*
  const STATUS_CLASS = {
    PUBLISHED: "published",
    DRAFT: "draft",
    ARCHIVED: "archived",
  };

  // Comment status → human-readable label (dash.comment_status.*)
  const COMMENT_STATUS_LABEL = {
    PENDING: translate("dash.comment_status.pending"),
    APPROVED: translate("dash.comment_status.approved"),
    REJECTED: translate("dash.comment_status.rejected"),
    DELETED: translate("dash.comment_status.deleted"),
  };

  // Comment status → CSS modifier suffix
  const COMMENT_STATUS_CLASS = {
    PENDING: "draft",
    APPROVED: "published",
    REJECTED: "archived",
    DELETED: "archived",
  };

  // Post type → [badge color, translated label] (dash.type.*)
  const TYPE_BADGE = {
    GENERAL: ["cyan", translate("dash.type.general")],
    PERSONAL: ["magenta", translate("dash.type.personal")],
  };

  const TECH_COLORS = ["cyan", "magenta", "green"];

  function postRowHtml(post) {
    const [badgeColor, typeLabel] = TYPE_BADGE[post.type] || [
      "cyan",
      post.type,
    ];
    const sClass = STATUS_CLASS[post.status] || "draft";
    const sLabel = STATUS_LABEL[post.status] || post.status;
    const thumb = post.coverImage
      ? `<img class="dash-list__thumb" src="${escHtml(post.coverImage)}" alt="" aria-hidden="true" />`
      : `<div class="dash-list__thumb dash-list__thumb--empty" aria-hidden="true"></div>`;
    // Build post row HTML — data-label attributes use translate() for responsive column headers
    return `<div class="dash-list__row">
      <div class="dash-list__title" data-label="${translate("dash.col.title")}">
        ${thumb}${escHtml(post.title)}
      </div>
      <div data-label="${translate("dash.col.category")}"><span class="neon-badge neon-badge--${badgeColor}">${typeLabel}</span></div>
      <div class="dash-list__date" data-label="${translate("dash.col.date")}">${fmtDate(post.createdAt)}</div>
      <div data-label="${translate("dash.col.status")}"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="${translate("dash.col.actions")}">
        <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-slug="${escHtml(post.slug)}">${translate("dash.action.edit")}</button>
        <button type="button" class="btn btn--magenta btn--sm" data-action="delete" data-slug="${escHtml(post.slug)}" data-title="${escHtml(post.title)}">${translate("dash.btn.delete")}</button>
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
    // Build project row HTML — data-label attributes use translate() for responsive column headers
    return `<div class="dash-list__row">
      <div class="dash-list__title" data-label="${translate("dash.col.name")}">${escHtml(project.title)}</div>
      <div class="dash-list__tech" data-label="${translate("dash.col.technologies")}">${techs || "—"}</div>
      <div data-label="${translate("dash.col.status")}"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="${translate("dash.col.actions")}">
        <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-slug="${escHtml(project.slug)}">${translate("dash.action.edit")}</button>
        <button type="button" class="btn btn--magenta btn--sm" data-action="delete" data-slug="${escHtml(project.slug)}" data-id="${project.id}" data-title="${escHtml(project.title)}">${translate("dash.btn.delete")}</button>
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

      // Recent posts — show rows or translated empty/error state
      const postsBody = document.getElementById("overview-posts-body");
      if (postsBody) {
        if (postsRes.ok) {
          const data = await postsRes.json();
          const rows = (data.content || []).map(postRowHtml).join("");
          postsBody.innerHTML =
            rows ||
            `<div class="dash-list__empty">${translate("dash.empty.no_posts")}</div>`;
        } else {
          postsBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
        }
      }

      // Recent projects — show rows or translated empty/error state
      const projectsBody = document.getElementById("overview-projects-body");
      if (projectsBody) {
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          const rows = (data.content || []).map(projectRowHtml).join("");
          projectsBody.innerHTML =
            rows ||
            `<div class="dash-list__empty">${translate("dash.empty.no_projects")}</div>`;
        } else {
          projectsBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
        }
      }
    } catch (err) {
      console.error("Overview load error:", err);
      // Show translated error state in both overview tables
      document
        .querySelectorAll("#overview-posts-body, #overview-projects-body")
        .forEach((el) => {
          el.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
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
      // Update aria-label to reflect the new toggle state — localized
      btn.setAttribute(
        "aria-label",
        isVisible
          ? translate("dash.show_pwd.show")
          : translate("dash.show_pwd.hide"),
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
    // Localized saving state — shown while PATCH request is in flight
    submitBtn.textContent = translate("dash.state.saving");

    // Build PATCH body — only include fields with non-empty values
    // displayName: send empty string to clear, undefined to skip (no change)
    const rawDisplayName =
      document.getElementById("profile-display-name")?.value ?? null;
    const body = {
      name: document.getElementById("profile-name")?.value?.trim() || undefined,
      bio: document.getElementById("profile-bio")?.value?.trim() || undefined,
      displayName: rawDisplayName !== null ? rawDisplayName.trim() : undefined,
    };

    // Build socialLinks payload from the per-platform URL + enabled inputs.
    // Strategy: start from current server state (prevents wiping platforms not
    // in the form), then overlay only the platforms rendered on this page.
    // API shape per platform: { url: string, enabled: boolean }
    // Empty URL string → send "" to clear the URL while keeping enabled state.
    const SOCIAL_PLATFORMS_DASH = [
      "telegram",
      "instagram",
      "linkedin",
      "github",
      "email",
    ];
    const socialLinksPayload = { ...currentSocialLinks };
    SOCIAL_PLATFORMS_DASH.forEach((platform) => {
      const urlEl = document.getElementById(`profile-social-${platform}-url`);
      const enabledEl = document.getElementById(
        `profile-social-${platform}-enabled`,
      );
      // Only include this platform if its input exists in the DOM
      if (urlEl) {
        // Send url:"" to clear; enabled defaults to false when toggle absent
        socialLinksPayload[platform] = {
          url: urlEl.value.trim(),
          enabled: enabledEl ? enabledEl.checked : false,
        };
      }
    });
    body.socialLinks = socialLinksPayload;

    // After save, update currentSocialLinks so subsequent saves use fresh state
    // (the actual update happens below on res.ok)

    // Strip top-level keys with undefined values before sending
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
        // Update local social links state so next save sees the new values
        currentSocialLinks = body.socialLinks ?? currentSocialLinks;
        // Show localized saved confirmation with checkmark icon
        submitBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ${translate("dash.state.saved")}`;
        setTimeout(() => {
          submitBtn.innerHTML = originalHTML;
          submitBtn.disabled = false;
        }, 2500);
      } else {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
        // Show localized save error alert
        alert(translate("dash.error.save"));
      }
    } catch {
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
      // Show localized network error alert
      alert(translate("dash.error.network"));
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
    /* Use textContent to avoid XSS — message may come from API error response */
    const p = document.createElement("p");
    p.className = `dash-profile-form__feedback dash-profile-form__feedback--${type}`;
    p.textContent = message;
    pwdFeedback.replaceChildren(p);
    pwdFeedback.removeAttribute("hidden");
  }

  passwordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPwd = document.getElementById("pwd-current").value;
    const newPwd = document.getElementById("pwd-new").value;
    const confirmPwd = document.getElementById("pwd-confirm").value;

    // Hide any previous feedback before re-validation
    pwdFeedback.setAttribute("hidden", "");

    // Client-side validation — localized error messages
    if (newPwd.length < 8) {
      showPwdFeedback(translate("dash.validation.pwd_min_length"), "error");
      return;
    }

    if (newPwd !== confirmPwd) {
      showPwdFeedback(translate("dash.validation.pwd_mismatch"), "error");
      return;
    }

    const originalHTML = pwdSubmitBtn.innerHTML;
    pwdSubmitBtn.disabled = true;
    // Localized saving state — shown while POST request is in flight
    pwdSubmitBtn.textContent = translate("dash.state.saving");

    try {
      const res = await fetchWithAuth(`${API}/users/me/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd,
        }),
      });

      if (res.status === 204) {
        // Localized success feedback message
        showPwdFeedback(translate("dash.pwd.success"), "success");
        passwordForm.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        // Prefer API error message; fall back to localized generic password error
        const msg = data.message || translate("dash.pwd.error_generic");
        showPwdFeedback(msg, "error");
      }
    } catch {
      // Localized network error feedback
      showPwdFeedback(translate("dash.pwd.error_network"), "error");
    } finally {
      pwdSubmitBtn.disabled = false;
      pwdSubmitBtn.innerHTML = originalHTML;
    }
  });

  // ---------------------------------------------------------------------------
  // Email change form — PATCH /api/v1/users/me/email
  // ---------------------------------------------------------------------------

  const emailForm = document.getElementById("dash-email-form");
  const emailFeedback = document.getElementById("email-feedback");

  /**
   * Display an inline feedback message inside the email change form.
   * @param {string} message - Text to show
   * @param {"success"|"error"} type - Modifier suffix for BEM class
   */
  function showEmailFeedback(message, type) {
    /* Use textContent to avoid XSS — message may come from API error response */
    const p = document.createElement("p");
    p.className = `dash-profile-form__feedback dash-profile-form__feedback--${type}`;
    p.textContent = message;
    emailFeedback.replaceChildren(p);
    emailFeedback.removeAttribute("hidden");
  }

  // Email form submit handler — verifies with current password, sends new email
  emailForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("email-submit");
    const currentPassword = document.getElementById("email-current-pwd")?.value;
    const newEmail = document.getElementById("email-new")?.value?.trim();

    // Hide any previous feedback message
    if (emailFeedback) emailFeedback.setAttribute("hidden", "");

    // Client-side guard: require both fields
    if (!currentPassword || !newEmail) return;

    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    // Localized saving state for the email change submit button
    submitBtn.textContent = translate("dash.state.saving");

    try {
      // PATCH /api/v1/users/me/email — authenticated; requires current password
      const res = await fetchWithAuth(`${API}/users/me/email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newEmail }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // Localized success feedback — key is always resolved by translate()
        showEmailFeedback(translate("dash.email.success"), "success");
        emailForm.reset();
        // Update displayed email in the profile section if response contains new email
        const emailDisplayEl = document.getElementById("profile-email");
        if (emailDisplayEl && data.email) emailDisplayEl.value = data.email;
      } else {
        const data = await res.json().catch(() => ({}));
        // Prefer API error detail; fall back to localized generic error
        showEmailFeedback(
          data.message || data.detail || translate("error.generic"),
          "error",
        );
      }
    } catch {
      // Localized network error feedback
      showEmailFeedback(translate("error.network"), "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
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
    // Posts list row — data-label attributes and buttons use translate() for i18n
    return `<div class="dash-list__row" data-slug="${escHtml(post.slug)}">
      <div class="dash-list__title" data-label="${translate("dash.col.title")}">${escHtml(post.title)}</div>
      <div data-label="${translate("dash.col.category")}"><span class="neon-badge neon-badge--${badgeColor}">${typeLabel}</span></div>
      <div class="dash-list__date" data-label="${translate("dash.col.date")}">${fmtDate(post.createdAt)}</div>
      <div data-label="${translate("dash.col.status")}"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="${translate("dash.col.actions")}">
        <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-slug="${escHtml(post.slug)}">${translate("dash.action.edit")}</button>
        <button type="button" class="btn btn--magenta btn--sm" data-action="delete" data-slug="${escHtml(post.slug)}" data-title="${escHtml(post.title)}">${translate("dash.btn.delete")}</button>
      </div>
    </div>`;
  }

  async function loadPosts(page, status) {
    postsPage = page;
    postsStatusFilter = status;
    const listBody = document.getElementById("posts-list-body");
    const pagination = document.getElementById("posts-pagination");
    if (!listBody) return;

    // Show localized loading state while request is in flight
    listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.empty.loading")}</div>`;
    if (pagination) pagination.innerHTML = "";

    const statusParam = status ? `&status=${status}` : "";
    const authorParam = myUserId ? `&authorId=${myUserId}` : "";
    try {
      const res = await fetchWithAuth(
        `${API}/admin/posts?size=20&sort=createdAt,desc&page=${page}${statusParam}${authorParam}`,
      );
      if (!res.ok) {
        listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
        return;
      }
      const data = await res.json();
      const rows = (data.content || []).map(postListRowHtml).join("");
      listBody.innerHTML =
        rows ||
        `<div class="dash-list__empty">${translate("dash.empty.no_posts")}</div>`;

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
      listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
    }
  }

  // ---------------------------------------------------------------------------
  // Post WYSIWYG editor — Toast UI, Markdown output
  // ---------------------------------------------------------------------------

  /**
   * initPostEditor — initialize Toast UI Editor on #post-content-editor (once).
   *
   * Guard: if postEditor already exists the function returns immediately.
   * This prevents duplicate editor instances when the post modal is opened
   * multiple times without a full page reload.
   *
   * The editor and its CSS are loaded via dynamic import() on the FIRST call
   * so that Rollup code-splits them into a separate async chunk (vendor-toastui).
   * Public pages never load that chunk — they are unaffected by the editor weight.
   *
   * The editor mounts in WYSIWYG mode with a Markdown tab available.
   * On every change the hidden #post-content textarea is kept in sync so that
   * the native form.reset() call in openPostModal still clears it, and the
   * existing validation logic (content.trim()) keeps working unchanged.
   *
   * @returns {Promise<void>} resolves when the editor is mounted and ready.
   */
  async function initPostEditor() {
    // Guard: only init once per page lifecycle
    if (postEditor) return;

    const mountEl = document.getElementById("post-content-editor");
    if (!mountEl) return;

    // Lazy-load Toast UI Editor + its CSS on first modal open.
    // Dynamic import() tells Rollup to code-split this into a separate chunk
    // that is only fetched when the dashboard user actually opens the post modal.
    const [{ default: Editor }] = await Promise.all([
      import("@toast-ui/editor"),
      import("@toast-ui/editor/dist/toastui-editor.css"),
    ]);

    // Create the Toast UI Editor instance
    postEditor = new Editor({
      // Mount point — the <div id="post-content-editor"> from HTML
      el: mountEl,
      // Start in WYSIWYG mode; user can switch to Markdown tab via toolbar
      initialEditType: "wysiwyg",
      // Preview panel shown beside the markdown tab (split) — not used in wysiwyg start
      previewStyle: "tab",
      // Initial empty content
      initialValue: "",
      // Fixed height (scroll inside) — matches the old textarea rows="8"
      height: "280px",
      // Minimal toolbar — enough for blog posts without overwhelming the modal
      toolbarItems: [
        ["heading", "bold", "italic", "strike"],
        ["hr", "quote"],
        ["ul", "ol"],
        ["table", "link"],
        ["code", "codeblock"],
      ],
    });

    // Sync editor content → hidden textarea on every change.
    // This keeps #post-content.value up to date so form.reset() and
    // the existing handlePostSubmit validation read the correct value.
    postEditor.on("change", () => {
      const hiddenField = document.getElementById("post-content");
      if (hiddenField) {
        hiddenField.value = postEditor.getMarkdown();
      }
    });
  }

  // Modal helpers
  const postModal = document.getElementById("post-modal");

  /**
   * openPostModal — show the post create/edit modal and prime the editor.
   *
   * Async because initPostEditor() is async (lazy-loads Toast UI on first call).
   * The editor is awaited BEFORE form.reset() and setMarkdown() so the instance
   * is guaranteed to exist when we try to clear or populate it.
   *
   * @param {string|null} slug — post slug to edit, or null/undefined for new post.
   */
  async function openPostModal(slug) {
    const form = document.getElementById("post-form");
    const titleEl = document.getElementById("post-modal-title");
    const feedback = document.getElementById("post-form-feedback");

    // Initialize the WYSIWYG editor on first open (no-op on subsequent opens).
    // Must await so the editor instance (postEditor) exists before setMarkdown() calls below.
    await initPostEditor();

    form?.reset();
    // After form.reset() the hidden textarea is cleared — clear editor too
    if (postEditor) postEditor.setMarkdown("");

    if (feedback) {
      feedback.textContent = "";
      feedback.setAttribute("hidden", "");
    }
    document.getElementById("post-edit-slug").value = slug || "";
    // Set modal title — localized edit vs. new post label
    if (titleEl)
      titleEl.textContent = slug
        ? translate("dash.editor.edit_post")
        : translate("dash.modal.new_post_title");
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
          // Populate editor with existing post content (Markdown string from API)
          // Also sync the hidden textarea so validation is consistent
          if (postEditor) {
            postEditor.setMarkdown(post.content || "");
          }
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
    // Clear editor content on close so it's blank on next "New post" open
    if (postEditor) postEditor.setMarkdown("");
    const preview = document.getElementById("post-cover-preview");
    if (preview) preview.setAttribute("hidden", "");
  }

  async function handlePostSubmit(e) {
    e.preventDefault();
    const slug = document.getElementById("post-edit-slug").value;
    const feedback = document.getElementById("post-form-feedback");
    const submitBtn = document.getElementById("post-form-submit");

    // Sync markdown from WYSIWYG editor → hidden textarea BEFORE reading the value.
    // This is the canonical read path: editor.getMarkdown() → textarea.value → content var.
    // The "change" listener keeps the textarea in sync on every keystroke, but we
    // do an explicit sync here as a safety net (e.g. programmatic content changes).
    if (postEditor) {
      const hiddenField = document.getElementById("post-content");
      if (hiddenField) hiddenField.value = postEditor.getMarkdown();
    }

    // Client-side validation
    const title = document.getElementById("post-title").value.trim();
    const content = document.getElementById("post-content").value.trim();
    const titleErr = document.getElementById("post-title-error");
    const contentErr = document.getElementById("post-content-error");
    let valid = true;

    if (titleErr) titleErr.textContent = "";
    if (contentErr) contentErr.textContent = "";
    // Localized client-side validation messages for required fields
    if (!title) {
      if (titleErr)
        titleErr.textContent = translate("dash.validation.title_required");
      valid = false;
    }
    if (!content) {
      if (contentErr)
        contentErr.textContent = translate("dash.validation.content_required");
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
    // Localized saving state — shown while PATCH/POST request is in flight
    submitBtn.textContent = translate("dash.state.saving");
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
        // Prefer API error message; fall back to localized save error
        const msg = err.message || translate("dash.error.save");
        if (feedback) {
          feedback.textContent = msg;
          feedback.className =
            "dash-modal__feedback dash-modal__feedback--error";
          feedback.removeAttribute("hidden");
        }
      }
    } catch {
      if (feedback) {
        // Localized network error message in modal feedback
        feedback.textContent = translate("dash.error.network");
        feedback.className = "dash-modal__feedback dash-modal__feedback--error";
        feedback.removeAttribute("hidden");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  async function deletePost(slug, title) {
    // Localized confirmation — title is user/API data escaped by escHtml in the button
    if (
      !confirm(translate("dash.confirm.delete_post").replace("{title}", title))
    )
      return;
    try {
      const res = await fetchWithAuth(`${API}/posts/${slug}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        loadPosts(postsPage, postsStatusFilter);
        if (myUserId) loadOverviewStats(myUserId);
      } else {
        // Localized delete-failure alert
        alert(translate("dash.error.delete"));
      }
    } catch {
      // Localized network-failure alert
      alert(translate("dash.error.network"));
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
    // Projects list row — data-label and buttons use translate() for i18n
    return `<div class="dash-list__row" data-slug="${escHtml(project.slug)}">
      <div class="dash-list__title" data-label="${translate("dash.col.name")}">${escHtml(project.title)}</div>
      <div class="dash-list__tech" data-label="${translate("dash.col.technologies")}">${techs || "—"}</div>
      <div data-label="${translate("dash.col.status")}"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="${translate("dash.col.actions")}">
        <button type="button" class="btn btn--ghost btn--sm" data-action="edit" data-slug="${escHtml(project.slug)}">${translate("dash.action.edit")}</button>
        <button type="button" class="btn btn--magenta btn--sm" data-action="delete"
          data-slug="${escHtml(project.slug)}" data-id="${project.id}" data-title="${escHtml(project.title)}">${translate("dash.btn.delete")}</button>
      </div>
    </div>`;
  }

  async function loadProjects(page, status) {
    projectsPage = page;
    projectsStatusFilter = status;
    const listBody = document.getElementById("projects-list-body");
    const pagination = document.getElementById("projects-pagination");
    if (!listBody) return;

    // Show localized loading state while request is in flight
    listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.empty.loading")}</div>`;
    if (pagination) pagination.innerHTML = "";

    const statusParam = status ? `&status=${status}` : "";
    const authorParam = myUserId ? `&authorId=${myUserId}` : "";
    try {
      const res = await fetchWithAuth(
        `${API}/admin/projects?size=20&sort=createdAt,desc&page=${page}${statusParam}${authorParam}`,
      );
      if (!res.ok) {
        listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
        return;
      }
      const data = await res.json();
      const rows = (data.content || []).map(projectListRowHtml).join("");
      listBody.innerHTML =
        rows ||
        `<div class="dash-list__empty">${translate("dash.empty.no_projects")}</div>`;

      if (pagination && data.page && data.page.totalPages > 1) {
        const { number, totalPages } = data.page;
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
          const active = i === number ? " is-active" : "";
          return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
        }).join("");
      }
    } catch (err) {
      console.error("Projects load error:", err);
      listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
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
    // Set modal title — localized edit vs. new project label
    if (titleEl)
      titleEl.textContent = slug
        ? translate("dash.editor.edit_project")
        : translate("dash.modal.new_project_title");
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
    // Localized client-side validation messages for required fields
    if (!title) {
      if (titleErr)
        titleErr.textContent = translate("dash.validation.name_required");
      valid = false;
    }
    if (!shortDesc) {
      if (shortDescErr)
        shortDescErr.textContent = translate(
          "dash.validation.short_desc_required",
        );
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
    // Localized saving state — shown while PATCH/POST request is in flight
    submitBtn.textContent = translate("dash.state.saving");
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
        // Prefer API error message; fall back to localized save error
        const msg = err.message || translate("dash.error.save");
        if (feedback) {
          feedback.textContent = msg;
          feedback.className =
            "dash-modal__feedback dash-modal__feedback--error";
          feedback.removeAttribute("hidden");
        }
      }
    } catch {
      if (feedback) {
        // Localized network error message in modal feedback
        feedback.textContent = translate("dash.error.network");
        feedback.className = "dash-modal__feedback dash-modal__feedback--error";
        feedback.removeAttribute("hidden");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  async function deleteProject(slug, id, title) {
    // Localized confirmation — title is user/API data escaped by escHtml in the button
    if (
      !confirm(
        translate("dash.confirm.delete_project").replace("{title}", title),
      )
    )
      return;
    // Use slug-based URL when slug exists; fall back to ID for projects with empty slug
    const url = slug
      ? `${API}/projects/${encodeURIComponent(slug)}`
      : `${API}/projects/id/${id}`;
    try {
      const res = await fetchWithAuth(url, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        loadProjects(projectsPage, projectsStatusFilter);
        if (myUserId) loadOverviewStats(myUserId);
      } else {
        // Localized delete error alert
        alert(translate("dash.error.delete"));
      }
    } catch {
      // Localized network error alert
      alert(translate("dash.error.network"));
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
      const { action, slug, id, title } = btn.dataset;
      if (action === "edit") openProjectModal(slug);
      else if (action === "delete") deleteProject(slug, id, title);
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
  // My Subscriptions panel — current user's own subscriptions
  // ---------------------------------------------------------------------------

  // Label maps for subscription type — runtime translate() for i18n support
  // Shared with Subscribers (admin) panel below
  const SUB_TYPE_LABEL = {
    GENERAL: translate("dash.type.general"),
    PERSONAL: translate("dash.type.personal"),
  };

  // Human-readable status labels for subscription status enum values — localized
  const SUB_STATUS_LABEL = {
    ACTIVE: translate("dash.sub_status.active"),
    CANCELLED: translate("dash.sub_status.cancelled"),
    EXPIRED: translate("dash.sub_status.expired"),
  };

  // CSS modifier suffix for dash-status--* class (maps status → visual badge style)
  const SUB_STATUS_CLASS = {
    ACTIVE: "published",
    CANCELLED: "draft",
    EXPIRED: "archived",
  };

  /**
   * Load and render current user's own subscriptions.
   * Calls GET /api/v1/subscriptions/me — returns plain array (not paginated).
   * Fix: was incorrectly calling /users/me/subscriptions (404 — endpoint does not exist).
   */
  async function loadMySubscriptions() {
    const listBody = document.getElementById("my-subscriptions-list-body");
    if (!listBody) return;

    // Show localized loading state while fetching
    listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.empty.loading")}</div>`;
    try {
      // Correct endpoint: /subscriptions/me returns List<SubscriptionResponse> (plain array)
      const res = await fetchWithAuth(`${API}/subscriptions/me`);
      if (!res.ok) {
        listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
        return;
      }
      const subs = await res.json();

      // Empty state — user has no subscriptions yet
      if (!subs.length) {
        listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.empty.no_my_subs")}</div>`;
        return;
      }

      // Render subscription rows with status badge and optional cancel button
      listBody.innerHTML = subs
        .map((sub) => {
          // Map status enum to CSS modifier and human label
          const sClass = SUB_STATUS_CLASS[sub.status] || "draft";
          const sLabel = SUB_STATUS_LABEL[sub.status] || sub.status;
          const typeLabel = SUB_TYPE_LABEL[sub.type] || sub.type;

          // Cancel button — only for ACTIVE subscriptions; label and aria-label localized
          const cancelBtn =
            sub.status === "ACTIVE"
              ? `<button type="button" class="btn btn--magenta btn--sm" data-action="cancel-my-sub" data-id="${sub.id}" aria-label="${translate("dash.confirm.cancel_sub")}">${translate("dash.action.cancel_sub")}</button>`
              : "";
          return `<div class="dash-list__row">
            <div data-label="${translate("dash.col.type")}">${escHtml(typeLabel)}</div>
            <div data-label="${translate("dash.col.status")}"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
            <div class="dash-list__date" data-label="${translate("dash.col.sub_date")}">${fmtDate(sub.createdAt)}</div>
            <div class="dash-list__actions" data-label="${translate("dash.col.actions")}">${cancelBtn}</div>
          </div>`;
        })
        .join("");
    } catch (err) {
      console.error("My subscriptions load error:", err);
      listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
    }
  }

  /**
   * Cancel a specific subscription by id.
   * Calls DELETE /api/v1/subscriptions/me/{id} — user-scoped cancel endpoint.
   * Fix: was calling /subscriptions/{id} (wrong path — admin endpoint, returns 403).
   * @param {string|number} id - Subscription ID from data-id attribute
   */
  async function cancelMySubscription(id) {
    // Localized confirmation dialog
    if (!confirm(translate("dash.confirm.cancel_sub"))) return;

    // Correct endpoint: /subscriptions/me/{id} — user cancels their own subscription
    const res = await fetchWithAuth(`${API}/subscriptions/me/${id}`, {
      method: "DELETE",
    });

    // Reload list on success (204 No Content or 200)
    if (res.ok || res.status === 204) {
      loadMySubscriptions();
    }
  }

  // ---------------------------------------------------------------------------
  // Favorites panel — saved posts for the current user
  // ---------------------------------------------------------------------------

  // Track current favorites page for reload after remove
  let favoritesPage = 0;

  // Render a single row for a favorited post entry — data-labels and button localized
  function favoriteRowHtml(fav) {
    // Build row with post link, date added, and remove button
    return `<div class="dash-list__row">
      <div class="dash-list__title" data-label="${translate("dash.favorites.col.title")}">
        <a href="/blog/${escHtml(fav.postSlug)}" class="dash-list__link" target="_blank">
          ${escHtml(fav.postTitle)}
        </a>
      </div>
      <div class="dash-list__date" data-label="${translate("dash.favorites.col.date")}">${fmtDate(fav.favoritedAt)}</div>
      <div class="dash-list__actions" data-label="${translate("dash.col.actions")}">
        <button type="button" class="btn btn--magenta btn--sm"
          data-action="remove-favorite" data-slug="${escHtml(fav.postSlug)}">
          ${translate("dash.btn.delete")}
        </button>
      </div>
    </div>`;
  }

  // Load paginated favorites from GET /users/me/favorites
  async function loadFavorites(page = 0) {
    favoritesPage = page;
    const listBody = document.getElementById("favorites-list-body");
    const pagination = document.getElementById("favorites-pagination");
    if (!listBody) return;

    // Show localized loading state while request is in flight
    listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.empty.loading")}</div>`;
    if (pagination) pagination.innerHTML = "";

    try {
      // Authenticated request — always via fetchWithAuth, never raw fetch
      const res = await fetchWithAuth(
        `${API}/users/me/favorites?size=20&page=${page}`,
      );
      if (!res.ok) {
        listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
        return;
      }
      const data = await res.json();
      // Render rows or localized empty state message
      const rows = (data.content || []).map(favoriteRowHtml).join("");
      listBody.innerHTML =
        rows ||
        `<div class="dash-list__empty">${translate("dash.empty.no_favorites")}</div>`;

      // Render pagination buttons only when more than one page exists
      if (pagination && data.page && data.page.totalPages > 1) {
        const { number, totalPages } = data.page;
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
          const active = i === number ? " is-active" : "";
          return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
        }).join("");
      }
    } catch (err) {
      // Log and show localized user-facing error on network failure
      console.error("Favorites load error:", err);
      listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
    }
  }

  // Remove a post from favorites via DELETE /posts/{slug}/favorites
  async function removeFavorite(slug) {
    try {
      // Authenticated delete request — uses fetchWithAuth
      const res = await fetchWithAuth(
        `${API}/posts/${encodeURIComponent(slug)}/favorites`,
        { method: "DELETE" },
      );
      if (res.ok || res.status === 204) {
        // Reload current page to reflect removal
        loadFavorites(favoritesPage);
      } else {
        // Localized delete error alert
        alert(translate("dash.error.delete"));
      }
    } catch {
      // Localized network error alert
      alert(translate("dash.error.network"));
    }
  }

  // ---------------------------------------------------------------------------
  // Subscribers panel
  // (SUB_TYPE_LABEL / SUB_STATUS_LABEL / SUB_STATUS_CLASS are declared in My
  //  Subscriptions section above — shared between both panels)
  // ---------------------------------------------------------------------------

  async function loadSubscribers(page, statusFilter) {
    subscribersPage = page;
    subscribersStatusFilter = statusFilter ?? subscribersStatusFilter;
    const listBody = document.getElementById("subscribers-list-body");
    const pagination = document.getElementById("subscribers-pagination");
    if (!listBody) return;

    // Show localized loading state while request is in flight
    listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.empty.loading")}</div>`;
    if (pagination) pagination.innerHTML = "";

    const statusParam = subscribersStatusFilter
      ? `&status=${subscribersStatusFilter}`
      : "";
    try {
      const res = await fetchWithAuth(
        `${API}/admin/subscriptions?size=20&sort=createdAt,desc&page=${page}${statusParam}`,
      );
      if (!res.ok) {
        listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
        return;
      }
      const data = await res.json();
      allSubscribersData = data.content || [];

      // Build subscriber rows — data-label and button text localized via translate()
      const rows = allSubscribersData
        .map((sub) => {
          const sClass = SUB_STATUS_CLASS[sub.status] || "draft";
          const sLabel = SUB_STATUS_LABEL[sub.status] || sub.status;
          const typeLabel = SUB_TYPE_LABEL[sub.type] || sub.type;
          return `<div class="dash-list__row">
            <div data-label="Email">${escHtml(sub.email)}</div>
            <div data-label="${translate("dash.col.type")}">${escHtml(typeLabel)}</div>
            <div data-label="${translate("dash.col.status")}"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
            <div class="dash-list__date" data-label="${translate("dash.col.sub_date")}">${fmtDate(sub.createdAt)}</div>
            <div class="dash-list__actions" data-label="${translate("dash.col.actions")}">
              <button type="button" class="btn btn--magenta btn--sm" data-action="delete-sub" data-id="${sub.id}">${translate("dash.btn.delete")}</button>
            </div>
          </div>`;
        })
        .join("");
      listBody.innerHTML =
        rows ||
        `<div class="dash-list__empty">${translate("dash.empty.no_subscribers")}</div>`;

      if (pagination && data.page && data.page.totalPages > 1) {
        const { number, totalPages } = data.page;
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
          const active = i === number ? " is-active" : "";
          return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
        }).join("");
      }
    } catch (err) {
      console.error("Subscribers load error:", err);
      listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
    }
  }

  async function deleteSubscriber(id) {
    // Localized confirmation dialog
    if (!confirm(translate("dash.confirm.delete_sub"))) return;
    try {
      const res = await fetchWithAuth(`${API}/admin/subscriptions/${id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        loadSubscribers(subscribersPage, subscribersStatusFilter);
      } else {
        // Localized delete error alert
        alert(translate("dash.error.delete"));
      }
    } catch {
      // Localized network error alert
      alert(translate("dash.error.network"));
    }
  }

  /* Prevents CSV formula injection (Excel/LibreOffice RCE via =, +, -, @) */
  function csvCell(v) {
    const s = String(v ?? "");
    return /^[=+\-@\t\r]/.test(s)
      ? `"'${s.replace(/"/g, '""')}"`
      : `"${s.replace(/"/g, '""')}"`;
  }

  function exportSubscribersCSV() {
    if (!allSubscribersData.length) {
      // Localized no-data alert before export
      alert(translate("dash.export.no_data"));
      return;
    }
    // CSV header row — type/status/date columns use translated labels for readability
    const header = [
      "Email",
      translate("dash.col.type"),
      translate("dash.col.status"),
      translate("dash.col.sub_date"),
    ];
    const rows = allSubscribersData.map((s) => [
      s.email || "",
      SUB_TYPE_LABEL[s.type] || s.type || "",
      SUB_STATUS_LABEL[s.status] || s.status || "",
      s.createdAt ? new Date(s.createdAt).toLocaleDateString("uk-UA") : "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
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

    // Approve/reject buttons — title tooltips localized; only shown for PENDING
    const approveBtn =
      comment.status === "PENDING"
        ? `<button type="button" class="btn btn--green btn--sm" data-action="approve-comment" data-id="${comment.id}" title="${translate("dash.comment_status.approved")}">✓</button>`
        : "";
    const rejectBtn =
      comment.status === "PENDING"
        ? `<button type="button" class="btn btn--ghost btn--sm" data-action="reject-comment" data-id="${comment.id}" title="${translate("dash.comment_status.rejected")}">✗</button>`
        : "";
    // Delete button — title tooltip and label localized
    const deleteBtn = `<button type="button" class="btn btn--magenta btn--sm" data-action="delete-comment" data-id="${comment.id}" title="${translate("dash.btn.delete")}">${translate("dash.btn.delete")}</button>`;

    // Comment row — data-label attributes and action buttons localized
    return `<div class="dash-list__row" data-id="${comment.id}">
      <div data-label="${translate("dash.col.author")}">${escHtml(authorName)}</div>
      <div data-label="${translate("dash.col.comment")}">${escHtml(excerpt)}</div>
      <div class="dash-list__title" data-label="${translate("dash.col.post")}">${escHtml(postTitle)}</div>
      <div class="dash-list__date" data-label="${translate("dash.col.date")}">${fmtDate(comment.createdAt)}</div>
      <div data-label="${translate("dash.col.status")}"><span class="dash-status dash-status--${sClass}">${sLabel}</span></div>
      <div class="dash-list__actions" data-label="${translate("dash.col.actions")}">${approveBtn}${rejectBtn}${deleteBtn}</div>
    </div>`;
  }

  async function loadComments(page, statusFilter) {
    commentsPage = page;
    commentsStatusFilter = statusFilter;
    const listBody = document.getElementById("comments-list-body");
    const pagination = document.getElementById("comments-pagination");
    if (!listBody) return;

    // Show localized loading state while request is in flight
    listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.empty.loading")}</div>`;
    if (pagination) pagination.innerHTML = "";

    const statusParam = statusFilter ? `&status=${statusFilter}` : "";
    try {
      const res = await fetchWithAuth(
        `${API}/admin/comments?size=20&sort=createdAt,desc&page=${page}${statusParam}`,
      );
      if (!res.ok) {
        listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
        return;
      }
      const data = await res.json();
      const rows = (data.content || []).map(commentRowHtml).join("");
      listBody.innerHTML =
        rows ||
        `<div class="dash-list__empty">${translate("dash.empty.no_comments")}</div>`;

      if (pagination && data.page && data.page.totalPages > 1) {
        const { number, totalPages } = data.page;
        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
          const active = i === number ? " is-active" : "";
          return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
        }).join("");
      }
    } catch (err) {
      console.error("Comments load error:", err);
      listBody.innerHTML = `<div class="dash-list__empty">${translate("dash.error.load")}</div>`;
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
        // Localized moderation error alert
        alert(translate("dash.error.moderation"));
      }
    } catch {
      // Localized network error alert
      alert(translate("dash.error.network"));
    }
  }

  async function deleteComment(id) {
    // Localized confirmation dialog
    if (!confirm(translate("dash.confirm.delete_comment"))) return;
    try {
      const res = await fetchWithAuth(`${API}/comments/${id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        loadComments(commentsPage, commentsStatusFilter);
      } else {
        // Localized delete error alert
        alert(translate("dash.error.delete"));
      }
    } catch {
      // Localized network error alert
      alert(translate("dash.error.network"));
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
        const err = await res.json().catch(() => ({}));
        // Prefer API error detail; fall back to localized upload error
        const msg = err.detail || err.message || translate("dash.error.upload");
        alert(msg);
      }
    } catch {
      // Localized network error alert for file upload
      alert(translate("dash.error.network_upload"));
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

  /* My subscriptions — cancel action */
  document
    .getElementById("my-subscriptions-list-body")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "cancel-my-sub")
        cancelMySubscription(btn.dataset.id);
    });

  /* Favorites — remove button delegation */
  document
    .getElementById("favorites-list-body")
    ?.addEventListener("click", (e) => {
      // Find the nearest button with data-action attribute
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "remove-favorite")
        removeFavorite(btn.dataset.slug);
    });

  /* Favorites — pagination button delegation */
  document
    .getElementById("favorites-pagination")
    ?.addEventListener("click", (e) => {
      // Find the nearest button with data-page attribute
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      loadFavorites(Number(btn.dataset.page));
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

  // ===========================================================================
  // Avatar upload / delete + Cropper.js crop modal
  // ===========================================================================

  let cropperInstance = null;

  const cropModal = document.getElementById("crop-modal");
  const cropImage = document.getElementById("crop-image");
  const cropSaveBtn = document.getElementById("crop-save-btn");
  const cropCancelBtn = document.getElementById("crop-cancel-btn");
  const cropModalClose = document.getElementById("crop-modal-close");
  const cropModalBackdrop = document.getElementById("crop-modal-backdrop");

  // Open crop modal: load file into <img>, init Cropper.js
  function openCropModal(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Destroy previous Cropper instance if any
      if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
      }
      cropImage.src = ev.target.result;
      cropModal.hidden = false;
      // Init after the image is rendered to get correct dimensions
      cropperInstance = new Cropper(cropImage, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 0.8,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: false,
        cropBoxResizable: false,
        toggleDragModeOnDblclick: false,
      });
    };
    reader.readAsDataURL(file);
  }

  // Close crop modal and clean up
  function closeCropModal() {
    cropModal.hidden = true;
    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }
    cropImage.src = "";
    // Reset file input so same file can be re-selected
    const input = document.getElementById("dash-avatar-input");
    if (input) input.value = "";
  }

  if (cropCancelBtn) cropCancelBtn.addEventListener("click", closeCropModal);
  if (cropModalClose) cropModalClose.addEventListener("click", closeCropModal);
  if (cropModalBackdrop)
    cropModalBackdrop.addEventListener("click", closeCropModal);

  // Save: get cropped canvas blob → upload → close modal
  if (cropSaveBtn) {
    cropSaveBtn.addEventListener("click", async () => {
      if (!cropperInstance) return;

      cropSaveBtn.disabled = true;
      // Localized saving state — shown while avatar is being uploaded
      cropSaveBtn.textContent = translate("dash.state.saving");

      try {
        const canvas = cropperInstance.getCroppedCanvas({
          width: 400,
          height: 400,
        });
        const blob = await new Promise((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Canvas error"))),
            "image/jpeg",
            0.92,
          ),
        );

        const fd = new FormData();
        fd.append("file", blob, "avatar.jpg");

        const res = await fetchWithAuth(
          "https://api.cote-lapyx.com/api/v1/users/me/avatar",
          { method: "POST", body: fd },
        );
        if (!res.ok) {
          const msg = await res.text().catch(() => "Server error");
          throw new Error(msg);
        }
        const updatedUser = await res.json();
        closeCropModal();
        initAvatarWidget(updatedUser);
      } catch (err) {
        // Localized save error prefix; err.message is a server/system string (not user content)
        alert(translate("dash.error.save") + " " + err.message);
      } finally {
        cropSaveBtn.disabled = false;
        // Restore localized button label after save attempt
        cropSaveBtn.textContent = translate("dash.crop.save_btn");
      }
    });
  }

  // Bind the upload button to the hidden file input
  document
    .getElementById("dash-avatar-upload-btn")
    ?.addEventListener("click", () => {
      document.getElementById("dash-avatar-input")?.click();
    });

  // When user picks a file — open crop modal instead of uploading directly
  document
    .getElementById("dash-avatar-input")
    ?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      openCropModal(file);
    });

  // Delete avatar via DELETE /users/me/avatar
  document
    .getElementById("dash-avatar-delete-btn")
    ?.addEventListener("click", async () => {
      // Localized confirmation dialog
      if (!confirm(translate("dash.confirm.delete_avatar"))) return;

      try {
        const res = await fetchWithAuth(
          "https://api.cote-lapyx.com/api/v1/users/me/avatar",
          { method: "DELETE" },
        );
        if (!res.ok && res.status !== 204) throw new Error("Server error");
        initAvatarWidget({
          avatar: null,
          name: document.querySelector(".dash-sidebar__name")?.textContent,
        });
      } catch (err) {
        // Localized delete error prefix; err.message is a server/system string
        alert(translate("dash.error.delete") + " " + err.message);
      }
    });

  // ---------------------------------------------------------------------------
  // i18n initialization — detect language and apply translations to dashboard
  // Must run after all DOM refs are set up; async because detectLanguage() hits geo-IP
  // ---------------------------------------------------------------------------

  // Detect language: 1) localStorage → 2) navigator → 3) geo-IP → 4) "en"
  const lang = await detectLanguage();

  // Apply translations to all [data-i18n], [data-i18n-aria], [data-i18n-placeholder] elements
  applyTranslations(lang);

  // Wire language switcher buttons (header .header__lang-btn[data-lang])
  initI18nSwitcher(lang);
});

// =============================================================================
// Avatar widget initialisation helper
// Called after /users/me resolves and after successful upload/delete.
// =============================================================================

function initAvatarWidget(user) {
  const initialsEl = document.getElementById("dash-avatar-initials");
  const imgEl = document.getElementById("dash-avatar-img");
  const delBtn = document.getElementById("dash-avatar-delete-btn");
  const sidebarAvatar = document.getElementById("dash-sidebar-avatar");

  if (!initialsEl || !imgEl) return;

  if (user.avatar) {
    // Show photo, hide initials
    imgEl.src = user.avatar;
    imgEl.hidden = false;
    initialsEl.hidden = true;
    if (delBtn) delBtn.hidden = false;
  } else {
    // Show initials, hide photo
    imgEl.hidden = true;
    initialsEl.hidden = false;
    if (delBtn) delBtn.hidden = true;
  }

  // Update sidebar avatar circle: photo via background-image or initials text
  if (sidebarAvatar) {
    if (user.avatar) {
      sidebarAvatar.style.backgroundImage = `url(${user.avatar})`;
      sidebarAvatar.textContent = "";
    } else {
      sidebarAvatar.style.backgroundImage = "";
      // Restore initials from displayed name
      const name =
        user.name ||
        document.querySelector(".dash-sidebar__name")?.textContent ||
        "";
      if (name) {
        const parts = name.trim().split(/\s+/);
        const initials =
          parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2);
        sidebarAvatar.textContent = initials.toUpperCase();
      }
    }
  }
}
