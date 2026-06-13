# Task 040 — Frontend Sprint 4: Like Button + Comment Improvements + Comment Likes

## Project

Frontend: /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
Stack: HTML/SCSS/JS, Vite, FLS

## IMPORTANT: read these files FIRST before any changes

- src/js/post.js (current like/comment implementation)
- src/js/common/auth.js (fetchWithAuth signature)
- src/js/i18n.js (translate function)
- src/components/pages/post/post.html (like button IDs, comment list structure)
- src/components/pages/post/post.scss (existing styles for post actions, comments)
- src/components/pages/admin/admin.html OR src/admin.html (comment management)
- src/js/admin.js (comment moderation logic)
- src/styles/cyberpunk.scss (design system: mixins, variables)
- src/styles/settings.scss (breakpoints, fonts)

## Context

- `post-like-btn` exists in HTML but has ZERO JS handler — completely unimplemented
- `post-like-count` span shows "0" hardcoded — never updated
- Comments: show only APPROVED. After backend change (task-039), new comments default to APPROVED
- `favorites` (post-fav-btn) = bookmark/save — keep as-is, don't confuse with likes

API that will exist after backend task-039:

- `GET /api/v1/posts/{slug}/likes` → `{total, registered, anonymous, likedByCurrentUser}` (public)
- `POST /api/v1/posts/{slug}/likes` → toggle like ON (public, no auth needed)
- `DELETE /api/v1/posts/{slug}/likes` → toggle like OFF (public)
- `GET /api/v1/comments/{id}/likes` → `{count, likedByCurrentUser}` (public)
- `POST /api/v1/comments/{id}/likes` → comment like ON
- `DELETE /api/v1/comments/{id}/likes` → comment like OFF
- `PATCH /api/v1/comments/{id}` (auth required) → edit own comment
- `PATCH /api/v1/comments/{id}/seen` (OWNER only) → mark as seen in admin

## Fix 1 — Post Like Button (post.js)

In the DOMContentLoaded interactions block (second addEventListener block):

### Load initial like count + user's like state

After loading fav state, add:

```js
// Load post like count + initial state
const likeBtn = document.getElementById("post-like-btn");
const likeCount = document.getElementById("post-like-count");

(async () => {
  try {
    // GET /api/v1/posts/{slug}/likes — public, no auth needed
    const res = await fetch(`${API}/posts/${encodeURIComponent(slug)}/likes`);
    if (res.ok) {
      const data = await res.json();
      if (likeCount) likeCount.textContent = data.total ?? 0;
      // Mark button as active if user already liked
      if (data.likedByCurrentUser && likeBtn)
        likeBtn.classList.add("is-active");
    }
  } catch {
    /* silent */
  }
})();
```

### Like button click handler

```js
if (likeBtn) {
  likeBtn.addEventListener("click", async () => {
    const isActive = likeBtn.classList.contains("is-active");
    try {
      // Like/unlike — public endpoint, use plain fetch (no auth required)
      // But if user is logged in, use fetchWithAuth to include their identity
      const token = getToken();
      let res;
      if (token) {
        res = await fetchWithAuth(
          `${API}/posts/${encodeURIComponent(slug)}/likes`,
          { method: isActive ? "DELETE" : "POST" },
        );
      } else {
        // Anonymous like — no auth header
        res = await fetch(`${API}/posts/${encodeURIComponent(slug)}/likes`, {
          method: isActive ? "DELETE" : "POST",
        });
      }
      if (res && (res.ok || res.status === 204)) {
        likeBtn.classList.toggle("is-active");
        // Update count display
        const data = await res.json().catch(() => null);
        if (data && likeCount) likeCount.textContent = data.total ?? 0;
      }
    } catch {
      /* silent */
    }
  });
}
```

## Fix 2 — Comment Loading: include likes + show all (not just APPROVED)

In `loadComments()` function:

- Comments now auto-approve so all new comments show. Keep existing filter (backend sends only APPROVED to public).
- Modify comment rendering to show like button per comment.

Add comment like button to each comment in `renderComment(c)`:

```js
// Comment like button
<button class="post-comment__like-btn ${c.likedByCurrentUser ? 'is-active' : ''}"
        data-comment-id="${c.id}"
        aria-label="Like comment">
  <svg>...</svg> <!-- heart icon, small 16px -->
  <span class="post-comment__like-count">${c.likesCount ?? 0}</span>
</button>
```

After rendering comments, attach click handlers to all like buttons:

```js
list.querySelectorAll(".post-comment__like-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const commentId = btn.dataset.commentId;
    const isActive = btn.classList.contains("is-active");
    try {
      const token = getToken();
      let res;
      if (token) {
        res = await fetchWithAuth(`${API}/comments/${commentId}/likes`, {
          method: isActive ? "DELETE" : "POST",
        });
      } else {
        res = await fetch(`${API}/comments/${commentId}/likes`, {
          method: isActive ? "DELETE" : "POST",
        });
      }
      if (res && res.ok) {
        btn.classList.toggle("is-active");
        const data = await res.json().catch(() => null);
        if (data) {
          const countEl = btn.querySelector(".post-comment__like-count");
          if (countEl) countEl.textContent = data.count ?? 0;
        }
      }
    } catch {
      /* silent */
    }
  });
});
```

## Fix 3 — Comment Edit/Delete for Author (post.js)

After comment render, show edit and delete buttons if current user is comment author:

- Check if `getToken()` → decode JWT (parse payload) → get email/sub
- Compare with `c.author?.email` (if API returns it) OR `c.authorId` vs current userId

If author: add edit + delete buttons to comment. Keep simple:

```html
<button class="post-comment__edit-btn" data-id="${c.id}">✏️</button>
<button class="post-comment__delete-btn" data-id="${c.id}">🗑</button>
```

Edit: click → replace comment text with `<textarea>` pre-filled + Save/Cancel buttons.
Save: `PATCH /api/v1/comments/${id}` via fetchWithAuth `{content: newText}` → reload comments.
Delete: `DELETE /api/v1/comments/${id}` via fetchWithAuth → reload comments.

## Fix 4 — Admin Panel: comments show immediately, "Seen" button

In `admin.js`:

- Comments in admin panel: show PENDING comments (for bad-words review) + APPROVED with admin_seen=false
- Replace "Approve/Reject" with "Mark Seen" for APPROVED comments
- Keep "Delete" button for all

Update admin comment rendering to:

- Show status badge (PENDING / APPROVED / SEEN)
- "Mark Seen" button → `PATCH /api/v1/comments/${id}/seen` via fetchWithAuth
- "Delete" → existing DELETE endpoint

In admin.html: update comments section header to "Коментарі" (not "Модерація"), show all comments not just PENDING.

## Fix 5 — SCSS for new elements

### post.scss additions:

```scss
// Comment like button
.post-comment {
  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  &__like-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: 1px solid rgba($neon-magenta, 0.3);
    color: $text-muted;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    &.is-active,
    &:hover {
      color: $neon-magenta;
      border-color: $neon-magenta;
    }
  }
  &__like-count {
    font-size: 11px;
  }
  &__edit-btn,
  &__delete-btn {
    background: transparent;
    border: none;
    color: $text-muted;
    cursor: pointer;
    font-size: 14px;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.2s ease;
    &:hover {
      color: $neon-cyan;
    }
  }
  &__delete-btn:hover {
    color: $neon-magenta;
  }
}
```

## i18n keys to add (all 4 files: uk/en/fr/de)

- `post.action.like_post`: "Вподобати" / "Like" / "J'aime" / "Gefällt mir"
- `post.comment.edit`: "Редагувати" / "Edit" / "Modifier" / "Bearbeiten"
- `post.comment.delete`: "Видалити" / "Delete" / "Supprimer" / "Löschen"
- `post.comment.save`: "Зберегти" / "Save" / "Enregistrer" / "Speichern"
- `post.comment.cancel`: "Скасувати" / "Cancel" / "Annuler" / "Abbrechen"
- `post.comment.liked_hint`: "Лайк" / "Like" / "J'aime" / "Gefällt mir"

i18n files: src/i18n/uk.json, en.json, fr.json, de.json

## Git

Branch: feature/component-040-frontend-likes-comments (checkout from main)
Commit: feat(post): add like button + comment likes + comment edit/delete + admin improvements

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

## Expected output

1. `post-like-btn` shows like count, toggles on click (anonymous + auth)
2. Each comment has like button with count
3. Comment author can edit/delete their comments
4. Admin panel shows all comments with "Mark Seen" instead of "Approve/Reject" for auto-approved
5. `npm run build` passes
