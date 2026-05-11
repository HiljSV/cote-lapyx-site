// =============================================================================
// Post detail page — fetches a single post by slug from the API
// =============================================================================

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

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function authorInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function showNotFound() {
  const main = document.getElementById("post-main");
  const article = document.querySelector(".post-article");
  const tagsSection = document.getElementById("post-tags-section");
  const notFound = document.getElementById("post-not-found");
  const titleEl = document.getElementById("post-title");
  if (titleEl) titleEl.textContent = "Статтю не знайдено";
  if (article) article.setAttribute("hidden", "");
  if (tagsSection) tagsSection.setAttribute("hidden", "");
  if (notFound) notFound.removeAttribute("hidden");
}

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
    const res = await fetch(`${API}/posts/${encodeURIComponent(slug)}`);
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

    const catEl = document.getElementById("post-category");
    const catName =
      post.categories?.length > 0 ? post.categories[0].name : "Загальне";
    if (catEl) catEl.textContent = catName;

    // Author
    const authorEl = document.getElementById("post-author-block");
    if (authorEl && post.author?.name) {
      const initials = authorInitials(post.author.name);
      // Render avatar img if available, otherwise show initials
      const avatarInner = post.author.avatar
        ? `<img src="${escHtml(post.author.avatar)}" alt="" aria-hidden="true" />`
        : escHtml(initials);
      authorEl.innerHTML = `
        <div class="post-hero__author-avatar" aria-hidden="true">${avatarInner}</div>
        <span class="post-hero__author-name">${escHtml(post.author.name)}</span>`;
    }

    // Cover image
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
        contentEl.innerHTML =
          '<p class="post-article__loading">Зміст відсутній.</p>';
      }
    }

    // Tags
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
});

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("post-main")) return;
  // interactions init — runs after main block (slug already in URL)
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) return;

  const API = "https://api.cote-lapyx.com/api/v1";

  function getToken() {
    return localStorage.getItem("cl_access");
  }

  // ── Favorites ────────────────────────────────────────────────────────────
  const favBtn = document.getElementById("post-fav-btn");
  if (favBtn) {
    favBtn.addEventListener("click", async () => {
      const token = getToken();
      if (!token) {
        alert("Увійдіть, щоб додати в обране.");
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

  // ── Subscribe ─────────────────────────────────────────────────────────────
  const subBtn = document.getElementById("post-sub-btn");
  const subForm = document.getElementById("post-subscribe-form");
  const subFormEl = document.getElementById("post-sub-form");
  const subMsg = document.getElementById("post-sub-msg");

  subBtn?.addEventListener("click", () => {
    const hidden = subForm?.hasAttribute("hidden");
    if (hidden) {
      subForm?.removeAttribute("hidden");
    } else {
      subForm?.setAttribute("hidden", "");
    }
  });

  subFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("post-sub-email")?.value.trim();
    if (!email) return;
    const submitBtn = document.getElementById("post-sub-submit");
    submitBtn.disabled = true;
    try {
      const res = await fetch(`${API}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "GENERAL" }),
      });
      if (subMsg) {
        subMsg.textContent = res.ok
          ? "Дякуємо! Ви підписані на оновлення."
          : "Помилка підписки. Спробуйте ще раз.";
        subMsg.className = `post-subscribe-form__msg ${res.ok ? "post-subscribe-form__msg--ok" : "post-subscribe-form__msg--err"}`;
        subMsg.removeAttribute("hidden");
      }
      if (res.ok) subFormEl.reset();
    } catch {
      if (subMsg) {
        subMsg.textContent = "Помилка з'єднання.";
        subMsg.className =
          "post-subscribe-form__msg post-subscribe-form__msg--err";
        subMsg.removeAttribute("hidden");
      }
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ── Comments ─────────────────────────────────────────────────────────────
  async function loadComments() {
    const list = document.getElementById("post-comments-list");
    const emptyEl = document.getElementById("post-comments-empty");
    if (!list) return;
    try {
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
        const date = c.createdAt
          ? new Date(c.createdAt).toLocaleDateString("uk-UA", {
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

  commentText?.addEventListener("input", () => {
    if (commentChars) commentChars.textContent = commentText.value.length;
  });

  commentForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      if (commentMsg) {
        commentMsg.textContent = "Увійдіть, щоб залишити коментар.";
        commentMsg.removeAttribute("hidden");
      }
      return;
    }
    const text = commentText?.value.trim();
    if (!text) return;
    const submitBtn = document.getElementById("post-comment-submit");
    submitBtn.disabled = true;
    try {
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
          commentMsg.textContent =
            err.detail || err.message || "Помилка надсилання.";
          commentMsg.removeAttribute("hidden");
        }
      }
    } catch {
      if (commentMsg) {
        commentMsg.textContent = "Помилка з'єднання.";
        commentMsg.removeAttribute("hidden");
      }
    } finally {
      submitBtn.disabled = false;
    }
  });
});
