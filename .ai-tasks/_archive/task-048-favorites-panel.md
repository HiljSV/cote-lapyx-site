# Task 048 — Dashboard Favorites Panel (Frontend)

## Context
cote-lapyx.com — HTML/SCSS/JS project (FLS + Vite).
Branch: feature/component-048-favorites-panel
Project: /home/hilj/code/active/cote-lapyx_project/cote-lapyx

## API endpoints already exist (backend is done)
- GET  /api/v1/users/me/favorites → paginated list of favorited posts (requires auth)
- POST /api/v1/posts/{slug}/favorites → add to favorites (requires auth)
- DELETE /api/v1/posts/{slug}/favorites → remove from favorites (requires auth)

Response item (FavoriteResponse):
{ postSlug: string, postTitle: string, favoritedAt: ISO date }

## Task: Add Favorites panel to dashboard

### 1. dashboard.html — file: src/components/pages/dashboard/dashboard.html

Add nav item in the sidebar. Look for the existing nav items (pattern: `<a class="dash-sidebar__nav-link" data-section="...">`). Insert AFTER "my-subscriptions" nav item:

```html
<!-- Nav: Favorites -->
<a
  href="#favorites"
  class="dash-sidebar__nav-link"
  data-section="favorites"
  role="menuitem"
>
  <span class="dash-sidebar__nav-icon" aria-hidden="true">★</span>
  <span data-i18n="dash.nav.favorites">Вибране</span>
</a>
```

Add panel AFTER the my-subscriptions panel (look for `data-panel="my-subscriptions"`):

```html
<!-- Favorites panel — saved posts for the current user -->
<div class="dash-section-panel" data-panel="favorites" hidden>
  <div class="dash-section-panel__header">
    <h2 class="dash-section-panel__title" data-i18n="dash.favorites.title">Вибране</h2>
  </div>
  <!-- Favorites list -->
  <div class="dash-list">
    <!-- Column headers -->
    <div class="dash-list__header">
      <span data-i18n="dash.favorites.col.title">Публікація</span>
      <span data-i18n="dash.favorites.col.date">Додано</span>
      <span data-i18n="dash.favorites.col.actions">Дії</span>
    </div>
    <!-- Populated by loadFavorites() -->
    <div id="favorites-list-body"></div>
  </div>
  <!-- Pagination -->
  <div id="favorites-pagination" class="dash-pagination"></div>
</div>
```

### 2. dashboard.js — file: src/js/dashboard.js

Add after the loadMySubscriptions block (search for "loadMySubscriptions" function), INSERT a new section "Favorites panel":

```js
// ---------------------------------------------------------------------------
// Favorites panel — saved posts for the current user
// ---------------------------------------------------------------------------

let favoritesPage = 0;

function favoriteRowHtml(fav) {
  // Render one row for a favorited post
  return `<div class="dash-list__row">
    <div class="dash-list__title" data-label="Публікація">
      <a href="/post.html?slug=${escHtml(fav.postSlug)}" class="dash-list__link" target="_blank">
        ${escHtml(fav.postTitle)}
      </a>
    </div>
    <div class="dash-list__date" data-label="Додано">${fmtDate(fav.favoritedAt)}</div>
    <div class="dash-list__actions" data-label="Дії">
      <button type="button" class="btn btn--magenta btn--sm"
        data-action="remove-favorite" data-slug="${escHtml(fav.postSlug)}">
        Видалити
      </button>
    </div>
  </div>`;
}

async function loadFavorites(page = 0) {
  favoritesPage = page;
  const listBody = document.getElementById("favorites-list-body");
  const pagination = document.getElementById("favorites-pagination");
  if (!listBody) return;

  listBody.innerHTML = '<div class="dash-list__empty">Завантаження...</div>';
  if (pagination) pagination.innerHTML = "";

  try {
    const res = await fetchWithAuth(`${API}/users/me/favorites?size=20&sort=favoritedAt,desc&page=${page}`);
    if (!res.ok) {
      listBody.innerHTML = '<div class="dash-list__empty">Помилка завантаження</div>';
      return;
    }
    const data = await res.json();
    const rows = (data.content || []).map(favoriteRowHtml).join("");
    listBody.innerHTML = rows || '<div class="dash-list__empty">У вас ще немає збережених публікацій</div>';

    // Render pagination when more than one page
    if (pagination && data.page && data.page.totalPages > 1) {
      const { number, totalPages } = data.page;
      pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
        const active = i === number ? " is-active" : "";
        return `<button type="button" class="dash-pagination__btn${active}" data-page="${i}">${i + 1}</button>`;
      }).join("");
    }
  } catch (err) {
    console.error("Favorites load error:", err);
    listBody.innerHTML = '<div class="dash-list__empty">Помилка завантаження</div>';
  }
}

async function removeFavorite(slug) {
  // Remove post from favorites and reload the list
  try {
    const res = await fetchWithAuth(`${API}/posts/${encodeURIComponent(slug)}/favorites`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 204) {
      loadFavorites(favoritesPage);
    } else {
      alert("Помилка видалення. Спробуйте ще раз.");
    }
  } catch {
    alert("Помилка зʼєднання.");
  }
}
```

Also wire the navigation: find the nav click handler (section `if (section === "my-subscriptions")`) and add:
```js
if (section === "favorites") {
  loadFavorites(0);
}
```

Wire event delegation: after the my-subscriptions cancel handler, add:
```js
// Favorites — remove button
document.getElementById("favorites-list-body")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "remove-favorite") removeFavorite(btn.dataset.slug);
});

document.getElementById("favorites-pagination")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-page]");
  if (!btn) return;
  loadFavorites(Number(btn.dataset.page));
});
```

### 3. i18n files — add keys

In all 4 files: src/i18n/uk.json, en.json, fr.json, de.json

uk.json — add:
```json
"dash.nav.favorites": "Вибране",
"dash.favorites.title": "Вибране",
"dash.favorites.col.title": "Публікація",
"dash.favorites.col.date": "Додано",
"dash.favorites.col.actions": "Дії"
```

en.json — add:
```json
"dash.nav.favorites": "Favorites",
"dash.favorites.title": "Favorites",
"dash.favorites.col.title": "Post",
"dash.favorites.col.date": "Added",
"dash.favorites.col.actions": "Actions"
```

fr.json — add:
```json
"dash.nav.favorites": "Favoris",
"dash.favorites.title": "Favoris",
"dash.favorites.col.title": "Publication",
"dash.favorites.col.date": "Ajouté",
"dash.favorites.col.actions": "Actions"
```

de.json — add:
```json
"dash.nav.favorites": "Favoriten",
"dash.favorites.title": "Favoriten",
"dash.favorites.col.title": "Beitrag",
"dash.favorites.col.date": "Hinzugefügt",
"dash.favorites.col.actions": "Aktionen"
```

## Rules
- Use fetchWithAuth for all API calls (NEVER raw fetch with Bearer)
- Use escHtml() for all user-controlled strings in innerHTML
- All text that users see must use data-i18n keys
- Comments on every block of code
- npm run build MUST pass at the end
- Commit all changes at the end with message: "feat(dashboard): add Favorites panel with load/remove and pagination"

## Git
Working directory: /home/hilj/code/active/cote-lapyx_project/cote-lapyx
Branch already created: feature/component-048-favorites-panel
