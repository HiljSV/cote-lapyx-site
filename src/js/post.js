// =============================================================================
// Post detail page — fetches a single post by slug from the API
// =============================================================================

// Import translate() for runtime i18n lookups on dynamically rendered strings
import { translate } from "@js/i18n.js";
// Import fetchWithAuth for authenticated API calls (favorites, comments)
import { fetchWithAuth } from "@js/common/auth.js";
// Markdown parser — converts raw Markdown from backend to HTML
import { marked } from "marked";
// XSS sanitizer — cleans parsed HTML before injecting into DOM
import DOMPurify from "dompurify";

const API = "https://api.cote-lapyx.com/api/v1";

/* Sanitizes user-controlled strings before injecting into innerHTML */
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Format ISO date string using the current UI language locale
function fmtDate(iso) {
  if (!iso) return "";
  // Read active language from localStorage — same pattern as blog.js
  const lang = localStorage.getItem("cl_lang") || "uk";
  return new Date(iso).toLocaleDateString(lang, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Build author initials (first letter of first + last name, or first two chars)
function authorInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

// Return Latin displayName for non-UK locales, fall back to Cyrillic name
function authorDisplayName(author) {
  if (!author) return "—";
  const lang = localStorage.getItem("cl_lang") || "uk";
  return lang !== "uk" && author.displayName
    ? author.displayName
    : author.name || "—";
}

// Show the "post not found" state — hides article, tags, actions, comments; reveals fallback
function showNotFound() {
  const article = document.querySelector(".post-article");
  const tagsSection = document.getElementById("post-tags-section");
  const notFound = document.getElementById("post-not-found");
  const titleEl = document.getElementById("post-title");
  // Hide post-actions section — irrelevant when post is not found
  const actionsSection = document.getElementById("post-actions-section");
  // Hide comments section — irrelevant when post is not found
  const commentsSection = document.getElementById("post-comments-section");

  // Use translated string instead of hardcoded Ukrainian
  if (titleEl) titleEl.textContent = translate("post.not_found");
  if (article) article.setAttribute("hidden", "");
  if (tagsSection) tagsSection.setAttribute("hidden", "");
  if (actionsSection) actionsSection.setAttribute("hidden", "");
  if (commentsSection) commentsSection.setAttribute("hidden", "");
  if (notFound) notFound.removeAttribute("hidden");
}

// =============================================================================
// Main post loader — runs on DOMContentLoaded, fetches post by slug
// =============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  // Guard: only run on post.html (bundle mode sends all JS to every page)
  if (!document.getElementById("post-main")) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) {
    window.location.href = "blog.html";
    return;
  }

  try {
    // Read current UI language so the backend returns translated post content
    const lang = localStorage.getItem("cl_lang") || "uk";
    // GET /api/v1/posts/{slug} — public endpoint, no auth needed; locale passed for translations
    const res = await fetch(
      `${API}/posts/${encodeURIComponent(slug)}?locale=${lang}`,
    );
    if (!res.ok) {
      showNotFound();
      return;
    }
    const post = await res.json();

    document.title = `${post.title} — cote-lapyx`;

    /* SEO: inject dynamic canonical, OG tags and JSON-LD BlogPosting */
    (function injectPostSEO(post, slug) {
      const canonical = `https://cote-lapyx.com/post.html?slug=${encodeURIComponent(slug)}`;

      let canonEl = document.querySelector("link[rel='canonical']");
      if (!canonEl) {
        canonEl = document.createElement("link");
        canonEl.rel = "canonical";
        document.head.appendChild(canonEl);
      }
      canonEl.href = canonical;

      const descEl = document.querySelector("meta[name='description']");
      if (descEl && post.excerpt) descEl.content = post.excerpt.slice(0, 155);

      const ogData = {
        "og:title": post.title,
        "og:description": (post.excerpt || post.title).slice(0, 155),
        "og:image":
          post.coverImage || "https://cote-lapyx.com/assets/img/og-image.png",
        "og:url": canonical,
        "og:type": "article",
      };
      Object.entries(ogData).forEach(([prop, val]) => {
        let el = document.querySelector(`meta[property='${prop}']`);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute("property", prop);
          document.head.appendChild(el);
        }
        el.setAttribute("content", val);
      });

      const ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt || "",
        image:
          post.coverImage || "https://cote-lapyx.com/assets/img/og-image.png",
        url: canonical,
        datePublished: post.publishedAt || post.createdAt,
        dateModified: post.updatedAt || post.publishedAt || post.createdAt,
        author: { "@type": "Person", name: post.author?.name || "COTE-LAPYX" },
        publisher: {
          "@type": "Organization",
          name: "COTE-LAPYX",
          logo: {
            "@type": "ImageObject",
            url: "https://cote-lapyx.com/assets/img/logo/cote-lapyx-new-512.png",
          },
        },
        keywords: (post.tags || []).map((t) => t.name || t).join(", "),
      };
      let ldEl = document.querySelector("script[type='application/ld+json']");
      if (!ldEl) {
        ldEl = document.createElement("script");
        ldEl.type = "application/ld+json";
        document.head.appendChild(ldEl);
      }
      ldEl.textContent = JSON.stringify(ld);
    })(post, params.get("slug") || "");

    // Title + meta
    const titleEl = document.getElementById("post-title");
    if (titleEl) titleEl.textContent = post.title;

    const dateEl = document.getElementById("post-date");
    const dateIso = post.publishedAt || post.createdAt;
    if (dateEl) {
      dateEl.textContent = fmtDate(dateIso);
      if (dateIso) dateEl.setAttribute("datetime", dateIso);
    }

    // Category — fall back to translated "General" label
    const catEl = document.getElementById("post-category");
    const catName =
      post.categories?.length > 0
        ? post.categories[0].name
        : translate("blog.category.general");
    if (catEl) catEl.textContent = catName;

    // Author block — avatar image or initials fallback
    const authorEl = document.getElementById("post-author-block");
    if (authorEl && post.author?.name) {
      const initials = authorInitials(post.author.name);
      // Render avatar img if available, otherwise show initials
      const avatarInner = post.author.avatar
        ? `<img src="${escHtml(post.author.avatar)}" alt="" aria-hidden="true" />`
        : escHtml(initials);
      authorEl.innerHTML = `
        <div class="post-hero__author-avatar" aria-hidden="true">${avatarInner}</div>
        <span class="post-hero__author-name">${escHtml(authorDisplayName(post.author))}</span>`;
    }

    // Cover image — unhide wrapper and inject inner container + img when image is present.
    // .post-cover__inner constrains the image to the article column width (not full-bleed).
    if (post.coverImage) {
      const coverWrap = document.getElementById("post-cover-wrap");
      if (coverWrap) {
        // Inject inner container wrapper so the image aligns with the article text column
        coverWrap.innerHTML = `<div class="post-cover__inner"><img class="post-cover__img" src="${escHtml(post.coverImage)}" alt="${escHtml(post.title)}" /></div>`;
        coverWrap.removeAttribute("hidden");
      }
    }

    // Content — backend returns raw Markdown; parse + sanitize before injecting
    const contentEl = document.getElementById("post-content");
    if (contentEl) {
      if (post.content) {
        // Parse Markdown → HTML, then sanitize with DOMPurify to prevent XSS
        contentEl.innerHTML = DOMPurify.sanitize(marked.parse(post.content));
      } else if (post.excerpt) {
        contentEl.innerHTML = `<p>${escHtml(post.excerpt)}</p>`;
      } else {
        // Translated "no content" message instead of hardcoded Ukrainian
        contentEl.innerHTML = `<p class="post-article__loading">${escHtml(translate("post.content_empty"))}</p>`;
      }
    }

    // Tags section — show only when tags are present
    if (post.tags?.length > 0) {
      const tagsEl = document.getElementById("post-tags");
      const tagsSection = document.getElementById("post-tags-section");
      if (tagsEl) {
        tagsEl.innerHTML = post.tags
          .map(
            (t) =>
              `<li><span class="neon-badge neon-badge--cyan">${escHtml(t.name || t)}</span></li>`,
          )
          .join("");
      }
      if (tagsSection) tagsSection.removeAttribute("hidden");
    }
  } catch {
    showNotFound();
  }

  // ── Language switch listener — re-renders translated post content on lang change ──
  document.addEventListener("cl:languagechange", async () => {
    // Only act when we are on the post page
    if (!document.getElementById("post-main")) return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    if (!slug) return;
    const lang = localStorage.getItem("cl_lang") || "uk";
    try {
      // Fetch post again with new locale — public endpoint, no auth needed
      const res = await fetch(
        `${API}/posts/${encodeURIComponent(slug)}?locale=${lang}`,
      );
      if (!res.ok) return;
      const post = await res.json();

      // Update title
      const titleEl = document.getElementById("post-title");
      if (titleEl) titleEl.textContent = post.title;

      // Update category with translated fallback
      const catEl = document.getElementById("post-category");
      if (catEl) {
        catEl.textContent =
          post.categories?.length > 0
            ? post.categories[0].name
            : translate("blog.category.general");
      }

      // Update date with locale-aware formatting
      const dateEl = document.getElementById("post-date");
      if (dateEl) {
        const dateIso = post.publishedAt || post.createdAt;
        if (dateIso) dateEl.textContent = fmtDate(dateIso);
      }

      // Update author block — name uses locale-aware displayName
      const authorEl = document.getElementById("post-author-block");
      if (authorEl && post.author?.name) {
        const avatarInner = post.author.avatar
          ? `<img src="${escHtml(post.author.avatar)}" alt="" aria-hidden="true" />`
          : escHtml(authorInitials(post.author.name));
        authorEl.innerHTML = `
          <div class="post-hero__author-avatar" aria-hidden="true">${avatarInner}</div>
          <span class="post-hero__author-name">${escHtml(authorDisplayName(post.author))}</span>`;
      }

      // Update content area — re-parse Markdown + sanitize on language switch
      const contentEl = document.getElementById("post-content");
      if (contentEl && post.content) {
        // Parse Markdown → HTML, sanitize with DOMPurify to prevent XSS
        contentEl.innerHTML = DOMPurify.sanitize(marked.parse(post.content));
      }
      if (contentEl && post.excerpt && !post.content)
        contentEl.innerHTML = `<p>${escHtml(post.excerpt)}</p>`;
    } catch {
      /* silent — best-effort language reload */
    }
  });
});

// =============================================================================
// Interactions block — favorites, like, subscribe form, comments
// Runs after main load block (slug already parsed from URL)
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("post-main")) return;
  // interactions init — runs after main block (slug already in URL)
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) return;

  const API = "https://api.cote-lapyx.com/api/v1";

  // Return stored access token (null if not logged in)
  function getToken() {
    return localStorage.getItem("cl_access");
  }

  // ── JWT decode helper — read payload without verifying signature ──────────

  /**
   * Decode JWT payload and return it as an object.
   * Used to identify the current user for comment author checks.
   * @param {string} token - raw JWT string
   * @returns {object|null} decoded payload or null on failure
   */
  function decodeJwtPayload(token) {
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }

  /**
   * Return the current user's email from the stored JWT.
   * The JWT payload field is "sub" (Spring Security standard).
   * @returns {string|null}
   */
  function getCurrentUserEmail() {
    const token = getToken();
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    // Spring Security sets "sub" to the user's email/username
    return payload?.sub || payload?.email || null;
  }

  // ── Favorites ────────────────────────────────────────────────────────────

  const favBtn = document.getElementById("post-fav-btn");

  // Load initial favorite state from /users/me/favorites if user is logged in
  if (favBtn && getToken()) {
    (async () => {
      try {
        // GET /api/v1/users/me/favorites — returns paginated list of favorited posts
        const res = await fetchWithAuth(`${API}/users/me/favorites`);
        if (res && res.ok) {
          const data = await res.json();
          // Support both paginated (data.content) and plain array responses
          const items = data.content || data || [];
          // Check if current post slug is in the favorites list
          const isFaved = items.some(
            (p) => p.slug === slug || p.post?.slug === slug,
          );
          if (isFaved) favBtn.classList.add("is-active");
        }
      } catch {
        /* silent — best-effort initial state */
      }
    })();
  }

  if (favBtn) {
    favBtn.addEventListener("click", async () => {
      const token = getToken();
      if (!token) {
        // Translated "sign in" prompt instead of hardcoded Ukrainian
        alert(translate("post.login_for_favorites"));
        return;
      }
      const isActive = favBtn.classList.contains("is-active");
      try {
        // Use fetchWithAuth — never use raw fetch with manual Authorization header
        const res = await fetchWithAuth(
          `${API}/posts/${encodeURIComponent(slug)}/favorites`,
          { method: isActive ? "DELETE" : "POST" },
        );
        if (res && (res.ok || res.status === 204 || res.status === 200)) {
          favBtn.classList.toggle("is-active");
        }
      } catch {
        /* silent */
      }
    });
  }

  // ── Post like button ──────────────────────────────────────────────────────

  const likeBtn = document.getElementById("post-like-btn");
  const likeCount = document.getElementById("post-like-count");

  // Load initial like count + user's like state
  // GET /api/v1/posts/{slug}/likes — public endpoint, no auth needed
  if (likeBtn) {
    (async () => {
      try {
        const res = await fetch(
          `${API}/posts/${encodeURIComponent(slug)}/likes`,
        );
        if (res.ok) {
          const data = await res.json();
          // Update count display from API response
          if (likeCount) likeCount.textContent = data.total ?? 0;
          // Mark button as active if authenticated user already liked
          if (data.likedByCurrentUser) likeBtn.classList.add("is-active");
        }
      } catch {
        /* silent — API not yet implemented, graceful degradation */
      }
    })();
  }

  // Like button click handler — anonymous or authenticated toggle
  if (likeBtn) {
    likeBtn.addEventListener("click", async () => {
      const isActive = likeBtn.classList.contains("is-active");
      try {
        const token = getToken();
        let res;
        if (token) {
          // Authenticated like — use fetchWithAuth to attach user identity
          res = await fetchWithAuth(
            `${API}/posts/${encodeURIComponent(slug)}/likes`,
            { method: isActive ? "DELETE" : "POST" },
          );
        } else {
          // Anonymous like — plain fetch, no auth header needed
          res = await fetch(`${API}/posts/${encodeURIComponent(slug)}/likes`, {
            method: isActive ? "DELETE" : "POST",
          });
        }
        if (res && (res.ok || res.status === 204)) {
          likeBtn.classList.toggle("is-active");
          // Update count from API response if available
          const data = await res.json().catch(() => null);
          if (data && likeCount) likeCount.textContent = data.total ?? 0;
        }
      } catch {
        /* silent — graceful degradation if API not yet available */
      }
    });
  }

  // ── Subscribe form ─────────────────────────────────────────────────────────
  const subBtn = document.getElementById("post-sub-btn");
  const subForm = document.getElementById("post-subscribe-form");
  const subFormEl = document.getElementById("post-sub-form");
  const subMsg = document.getElementById("post-sub-msg");

  // Toggle subscribe email form visibility
  subBtn?.addEventListener("click", () => {
    const hidden = subForm?.hasAttribute("hidden");
    if (hidden) {
      subForm?.removeAttribute("hidden");
    } else {
      subForm?.setAttribute("hidden", "");
    }
  });

  // Handle subscribe form submission
  subFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("post-sub-email")?.value.trim();
    if (!email) return;
    const submitBtn = document.getElementById("post-sub-submit");
    submitBtn.disabled = true;
    try {
      // POST /api/v1/subscriptions — public endpoint, no auth needed
      const res = await fetch(`${API}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "GENERAL" }),
      });
      if (subMsg) {
        // Translated success/error message
        subMsg.textContent = res.ok
          ? translate("post.subscribe_ok")
          : translate("post.subscribe_err");
        subMsg.className = `post-subscribe-form__msg ${res.ok ? "post-subscribe-form__msg--ok" : "post-subscribe-form__msg--err"}`;
        subMsg.removeAttribute("hidden");
      }
      if (res.ok) subFormEl.reset();
    } catch {
      // Network failure — translated error message
      if (subMsg) {
        subMsg.textContent = translate("error.network");
        subMsg.className =
          "post-subscribe-form__msg post-subscribe-form__msg--err";
        subMsg.removeAttribute("hidden");
      }
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ── Comments ─────────────────────────────────────────────────────────────

  // Load and render all comments for the current post
  async function loadComments() {
    const list = document.getElementById("post-comments-list");
    const emptyEl = document.getElementById("post-comments-empty");
    if (!list) return;
    try {
      // GET /api/v1/posts/{slug}/comments — public endpoint
      const res = await fetch(
        `${API}/posts/${encodeURIComponent(slug)}/comments`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const comments = data.content || [];
      if (comments.length === 0) {
        emptyEl?.removeAttribute("hidden");
        return;
      }
      emptyEl?.setAttribute("hidden", "");
      // Remove existing comment elements before re-render
      const existing = list.querySelectorAll(".post-comment");
      existing.forEach((el) => el.remove());

      // getCurrentUserEmail kept for legacy reference; author check now uses backend-provided isMine flag
      const currentUserEmail = getCurrentUserEmail();

      comments.forEach((c) => {
        const authorName = c.author?.name || "Анонім";
        const initials = authorName
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        // Format date with active UI language locale
        const commentLang = localStorage.getItem("cl_lang") || "uk";
        const date = c.createdAt
          ? new Date(c.createdAt).toLocaleDateString(commentLang, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "";
        // Render avatar img if available, otherwise show initials
        const commentAvatarInner = c.author?.avatar
          ? `<img src="${escHtml(c.author.avatar)}" alt="" aria-hidden="true" />`
          : escHtml(initials);

        // Comment like button — shows count, toggles liked state
        const likedClass = c.likedByCurrentUser ? " is-active" : "";
        const commentLikeBtn = `
          <button class="post-comment__like-btn${likedClass}"
                  data-comment-id="${escHtml(String(c.id))}"
                  aria-label="${escHtml(translate("post.comment.liked_hint"))}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span class="post-comment__like-count">${Number(c.likesCount) || 0}</span>
          </button>`;

        // Edit/delete buttons — only for the comment author (backend provides isMine flag)
        const isAuthor = c.isMine === true;
        const authorActions = isAuthor
          ? `<button class="post-comment__edit-btn"
                    data-id="${escHtml(String(c.id))}"
                    title="${escHtml(translate("post.comment.edit"))}"
                    aria-label="${escHtml(translate("post.comment.edit"))}">&#9998;</button>
             <button class="post-comment__delete-btn"
                    data-id="${escHtml(String(c.id))}"
                    title="${escHtml(translate("post.comment.delete"))}"
                    aria-label="${escHtml(translate("post.comment.delete"))}">&#128465;</button>`
          : "";

        const div = document.createElement("div");
        div.className = "post-comment";
        // Store comment id and content for inline editing
        div.dataset.commentId = String(c.id);
        div.innerHTML = `
          <div class="post-comment__avatar" aria-hidden="true">${commentAvatarInner}</div>
          <div class="post-comment__body">
            <div class="post-comment__meta">
              <span class="post-comment__author">${escHtml(authorName)}</span>
              <time class="post-comment__date">${date}</time>
            </div>
            <p class="post-comment__text" data-original="${escHtml(c.content || "")}">${String(
              c.content || "",
            )
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</p>
            <div class="post-comment__actions">
              ${commentLikeBtn}
              ${authorActions}
            </div>
          </div>`;
        list.appendChild(div);
      });

      // Attach comment like button handlers after all comments are rendered
      attachCommentLikeHandlers(list);
      // Attach comment edit/delete handlers
      attachCommentAuthorHandlers(list);
    } catch {
      /* silent */
    }
  }

  // ── Comment like button handlers ──────────────────────────────────────────

  /**
   * Attach click handlers to all comment like buttons in the list container.
   * Uses anonymous or authenticated fetch depending on JWT presence.
   * @param {HTMLElement} list - the comments list container
   */
  function attachCommentLikeHandlers(list) {
    list.querySelectorAll(".post-comment__like-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const commentId = btn.dataset.commentId;
        const isActive = btn.classList.contains("is-active");
        try {
          const token = getToken();
          let res;
          if (token) {
            // Authenticated comment like — fetchWithAuth for user identity
            res = await fetchWithAuth(`${API}/comments/${commentId}/likes`, {
              method: isActive ? "DELETE" : "POST",
            });
          } else {
            // Anonymous comment like — plain fetch
            res = await fetch(`${API}/comments/${commentId}/likes`, {
              method: isActive ? "DELETE" : "POST",
            });
          }
          if (res && res.ok) {
            btn.classList.toggle("is-active");
            // Update count from API response if available
            const respData = await res.json().catch(() => null);
            if (respData) {
              const countEl = btn.querySelector(".post-comment__like-count");
              if (countEl) countEl.textContent = respData.count ?? 0;
            }
          } else if (res && res.status === 409 && !isActive) {
            // 409 Conflict on POST means already liked — sync button to active state
            btn.classList.add("is-active");
          }
        } catch {
          /* silent — graceful degradation if API not yet available */
        }
      });
    });
  }

  // ── Comment edit/delete handlers (author only) ────────────────────────────

  /**
   * Attach click handlers to comment edit and delete buttons.
   * Edit: replaces comment text with an editable textarea + save/cancel.
   * Delete: calls DELETE /api/v1/comments/{id} and reloads the list.
   * @param {HTMLElement} list - the comments list container
   */
  function attachCommentAuthorHandlers(list) {
    // Edit button — replace text with inline textarea
    list.querySelectorAll(".post-comment__edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const commentId = btn.dataset.id;
        // Find the parent comment element by stored data-comment-id
        const commentEl = list.querySelector(
          `.post-comment[data-comment-id="${commentId}"]`,
        );
        if (!commentEl) return;
        const textEl = commentEl.querySelector(".post-comment__text");
        if (!textEl) return;
        // Already in edit mode — do nothing
        if (commentEl.querySelector(".post-comment__edit-area")) return;

        // Read original (unescaped) text from data-original attribute
        const originalText = textEl.dataset.original || textEl.textContent;

        // Replace text paragraph with textarea + action buttons
        textEl.setAttribute("hidden", "");
        const actionsEl = commentEl.querySelector(".post-comment__actions");
        if (actionsEl) actionsEl.setAttribute("hidden", "");

        const editArea = document.createElement("div");
        editArea.className = "post-comment__edit-area";
        editArea.innerHTML = `
          <textarea class="post-comment__edit-textarea"
                    rows="3"
                    maxlength="2000"
                    aria-label="${escHtml(translate("post.comment.edit"))}">${escHtml(originalText)}</textarea>
          <div class="post-comment__edit-footer">
            <button type="button" class="btn btn--cyan btn--sm post-comment__save-btn"
                    data-id="${escHtml(commentId)}">
              ${escHtml(translate("post.comment.save"))}
            </button>
            <button type="button" class="btn btn--ghost btn--sm post-comment__cancel-btn">
              ${escHtml(translate("post.comment.cancel"))}
            </button>
          </div>`;
        commentEl.querySelector(".post-comment__body").appendChild(editArea);

        // Focus textarea for immediate editing
        editArea.querySelector("textarea").focus();

        // Cancel — restore original state
        editArea
          .querySelector(".post-comment__cancel-btn")
          .addEventListener("click", () => {
            editArea.remove();
            textEl.removeAttribute("hidden");
            if (actionsEl) actionsEl.removeAttribute("hidden");
          });

        // Save — PATCH /api/v1/comments/{id} with new content
        editArea
          .querySelector(".post-comment__save-btn")
          .addEventListener("click", async () => {
            const newText = editArea.querySelector("textarea").value.trim();
            if (!newText) return;
            const saveBtn = editArea.querySelector(".post-comment__save-btn");
            saveBtn.disabled = true;
            try {
              // PATCH comment — requires authentication via fetchWithAuth
              const res = await fetchWithAuth(`${API}/comments/${commentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newText }),
              });
              if (res && res.ok) {
                // Reload full comment list to reflect updated content
                await loadComments();
              } else {
                saveBtn.disabled = false;
              }
            } catch {
              /* silent */
              saveBtn.disabled = false;
            }
          });
      });
    });

    // Delete button — DELETE /api/v1/comments/{id} then reload
    list.querySelectorAll(".post-comment__delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const commentId = btn.dataset.id;
        // Native confirm dialog — no i18n needed for admin-level destructive action
        if (!confirm(translate("post.comment.delete") + "?")) return;
        try {
          // DELETE comment — requires authentication via fetchWithAuth
          const res = await fetchWithAuth(`${API}/comments/${commentId}`, {
            method: "DELETE",
          });
          if (res && (res.ok || res.status === 204)) {
            // Reload comment list after successful deletion
            await loadComments();
          }
        } catch {
          /* silent */
        }
      });
    });
  }

  loadComments();

  const commentForm = document.getElementById("post-comment-form");
  const commentText = document.getElementById("post-comment-text");
  const commentChars = document.getElementById("post-comment-chars");
  const commentMsg = document.getElementById("post-comment-msg");

  // Live character count for comment textarea
  commentText?.addEventListener("input", () => {
    if (commentChars) commentChars.textContent = commentText.value.length;
  });

  // Handle comment form submission
  commentForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      // Translated "sign in to comment" message
      if (commentMsg) {
        commentMsg.textContent = translate("post.login_for_comment");
        commentMsg.removeAttribute("hidden");
      }
      return;
    }
    const text = commentText?.value.trim();
    if (!text) return;
    const submitBtn = document.getElementById("post-comment-submit");
    submitBtn.disabled = true;
    try {
      // POST /api/v1/posts/{slug}/comments — use fetchWithAuth, never raw Bearer
      const res = await fetchWithAuth(
        `${API}/posts/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        },
      );
      if (res.ok) {
        commentForm.reset();
        if (commentChars) commentChars.textContent = "0";
        if (commentMsg) commentMsg.setAttribute("hidden", "");
        await loadComments();
      } else {
        const err = await res.json().catch(() => ({}));
        if (commentMsg) {
          // Use API error detail if available, fall back to translated generic message
          commentMsg.textContent =
            err.detail || err.message || translate("post.comment_err");
          commentMsg.removeAttribute("hidden");
        }
      }
    } catch {
      // Network failure — translated error message
      if (commentMsg) {
        commentMsg.textContent = translate("error.network");
        commentMsg.removeAttribute("hidden");
      }
    } finally {
      submitBtn.disabled = false;
    }
  });
});
