// =============================================================================
// Post detail page — fetches a single post by slug from the API
// =============================================================================

// Import translate() for runtime i18n lookups on dynamically rendered strings
import { translate } from "@js/i18n.js";

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
  const lang = localStorage.getItem("cl_lang") || "en";
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
  const lang = localStorage.getItem("cl_lang") || "en";
  return lang !== "uk" && author.displayName
    ? author.displayName
    : author.name || "—";
}

// Show the "post not found" state — hides article, reveals fallback block
function showNotFound() {
  const article = document.querySelector(".post-article");
  const tagsSection = document.getElementById("post-tags-section");
  const notFound = document.getElementById("post-not-found");
  const titleEl = document.getElementById("post-title");
  // Use translated string instead of hardcoded Ukrainian
  if (titleEl) titleEl.textContent = translate("post.not_found");
  if (article) article.setAttribute("hidden", "");
  if (tagsSection) tagsSection.setAttribute("hidden", "");
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
    const lang = localStorage.getItem("cl_lang") || "en";
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

    // Cover image — unhide wrapper when image is present
    if (post.coverImage) {
      const coverWrap = document.getElementById("post-cover-wrap");
      if (coverWrap) {
        coverWrap.innerHTML = `<img class="post-cover__img" src="${escHtml(post.coverImage)}" alt="${escHtml(post.title)}" />`;
        coverWrap.removeAttribute("hidden");
      }
    }

    // Content — backend provides HTML in the `content` field
    const contentEl = document.getElementById("post-content");
    if (contentEl) {
      if (post.content) {
        // Content is trusted HTML from our own backend — safe to inject
        contentEl.innerHTML = post.content;
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
    const lang = localStorage.getItem("cl_lang") || "en";
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

      // Update content area
      const contentEl = document.getElementById("post-content");
      if (contentEl && post.content) contentEl.innerHTML = post.content;
      if (contentEl && post.excerpt && !post.content)
        contentEl.innerHTML = `<p>${escHtml(post.excerpt)}</p>`;
    } catch {
      /* silent — best-effort language reload */
    }
  });
});

// =============================================================================
// Interactions block — favorites, subscribe form, comments
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

  // ── Favorites ────────────────────────────────────────────────────────────
  const favBtn = document.getElementById("post-fav-btn");
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
        await fetch(`${API}/posts/${encodeURIComponent(slug)}/favorites`, {
          method: isActive ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        favBtn.classList.toggle("is-active");
      } catch {
        /* silent */
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
      const existing = list.querySelectorAll(".post-comment");
      existing.forEach((el) => el.remove());
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
        const commentLang = localStorage.getItem("cl_lang") || "en";
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
        const div = document.createElement("div");
        div.className = "post-comment";
        div.innerHTML = `
          <div class="post-comment__avatar" aria-hidden="true">${commentAvatarInner}</div>
          <div class="post-comment__body">
            <div class="post-comment__meta">
              <span class="post-comment__author">${escHtml(authorName)}</span>
              <time class="post-comment__date">${date}</time>
            </div>
            <p class="post-comment__text">${String(c.content || "")
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</p>
          </div>`;
        list.appendChild(div);
      });
    } catch {
      /* silent */
    }
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
      // POST /api/v1/posts/{slug}/comments — requires auth token
      const res = await fetch(
        `${API}/posts/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
