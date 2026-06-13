# Task 038 — Frontend: like button + button width + gap fixes + dashboard email change

## Project

Frontend: /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
Stack: HTML/SCSS/JS, Vite, FLS

## Context

Key files to read BEFORE making any changes:

- src/js/i18n.js — translate() function
- src/js/auth.js — fetchWithAuth() function
- src/js/post.js — like/fav button + post page logic
- src/styles/cyberpunk.scss — design system (mixins, variables)
- src/styles/settings.scss — breakpoints ($pc, $tablet, $mobile, $mobileSmall)
- src/components/ui/buttons/buttons.scss — .btn component
- src/components/layout/header/header.scss — lang switcher + nav buttons
- src/components/pages/dashboard/dashboard.html — profile section
- src/components/pages/dashboard/dashboard.scss — dashboard styles
- src/js/dashboard.js — profile form handler

## IMPORTANT: fetchWithAuth rule

ALL API calls that require auth MUST use `fetchWithAuth` from `@js/auth.js`.
NEVER use raw `fetch()` with `Authorization: Bearer ${token}` manually.

## Fix 1 — Like (favourite) button in post.js

### Problem

`post.js` uses raw `fetch()` with manual `Authorization: Bearer ${token}` for the favorites endpoint.
Also: the initial favorite state is never loaded — button always starts as inactive.

### Fix

File: `src/js/post.js`

1. Import `fetchWithAuth` at the top:

   ```js
   import { fetchWithAuth } from "@js/auth.js";
   ```

2. On page load (after slug is resolved and token is present), load initial favorite state:

   ```
   GET /api/v1/users/me/favorites?slug={slug}
   ```

   Wait — actually check if API returns GET /api/v1/posts/{slug}/favorites (check if this exists).
   Simpler approach: GET /api/v1/users/me/favorites (returns list), find if current slug is in list.
   If the user is logged in, call `fetchWithAuth("GET", `${API}/users/me/favorites`)` and check if the post slug appears in results.
   If yes → add `is-active` class to `favBtn`.

3. Replace the `favBtn` click handler to use `fetchWithAuth`:
   ```js
   const res = await fetchWithAuth(
     isActive ? "DELETE" : "POST",
     `${API}/posts/${encodeURIComponent(slug)}/favorites`,
   );
   if (res && (res.ok || res.status === 204 || res.status === 200)) {
     favBtn.classList.toggle("is-active");
   }
   ```
   Remove manual `Authorization` header — `fetchWithAuth` handles it.

## Fix 2 — Button/block width changes on language switch

### Problem

When user switches language (UK→DE), text in buttons and nav links becomes longer/shorter → blocks resize → layout jumps.

### Fix strategy

Add `min-width` to specific elements so they never shrink below the longest translation (German DE is usually longest).

#### File: `src/components/layout/header/header.scss`

In `.header__nav-link` (the nav anchor elements): add `white-space: nowrap` (likely already there — verify).
In `.header__controls-btn` or login button: add `min-width: 110px` to prevent resizing.

#### File: `src/components/ui/buttons/buttons.scss`

In `.btn`: already has `white-space: nowrap` — verify it's there. If not, add it.
For hero CTAs, do NOT set a fixed `min-width` globally — only on specific instances.

#### Files: `src/components/pages/index/index.scss` and hero section

Check if `.hero__actions` buttons have a `min-width`. If not, add `min-width: 160px` to `.hero__actions .btn`.

#### File: `src/components/layout/header/header.scss`

Lang switcher toggle button (`.header__lang-toggle`): add `min-width: 48px` to prevent resize when lang code changes (UK vs DE vs FR).

General rule: any element where text changes via `data-i18n` and has a visible border/background that would visually jump → add `min-width` equal to approximately the longest expected text width.

## Fix 3 — Gap issues

### Problem

Some blocks have missing or very small gaps between elements.

### Fix

Read these files and fix gap/spacing issues:

- `src/components/pages/about/about.scss` — check value cards spacing
- `src/components/pages/services/services.scss` — check service cards gap
- `src/components/pages/index/index.scss` — check hero/stats/team preview sections
- `src/components/layout/header/header.scss` — check nav gap between items

Specifically:

1. Value cards on about.html — ensure `gap: 24px` minimum between cards (check `.about__values-grid` or similar)
2. Services cards — ensure `gap: 24px` between cards
3. Header nav — ensure `gap: 8px` minimum between nav links

Use the existing gap values from cyberpunk.scss design system. Do NOT invent new values — use multiples of 8px (8, 16, 24, 32, 40, 48).

## Fix 4 — Dashboard email change UI

### Problem

- `profile-email` input is editable but backend ignores it in PATCH /users/me
- There is no way for admin to change their email

### Fix

#### File: `src/components/pages/dashboard/dashboard.html`

1. Make `profile-email` input **readonly**:

   ```html
   <input
     ...
     id="profile-email"
     readonly
     aria-readonly="true"
     class="dash-profile-form__input dash-profile-form__input--readonly"
     ...
   />
   ```

2. Add a new section AFTER the password change section (look for `dash-pwd-form` section). Add:

```html
<!-- Change email section -->
<section
  class="dash-section"
  id="dash-email-section"
  aria-labelledby="dash-email-title"
>
  <h2
    class="dash-section__title"
    id="dash-email-title"
    data-i18n="dash.email.title"
  >
    Змінити Email
  </h2>
  <form class="dash-email-form" id="dash-email-form" novalidate>
    <!-- Current password for verification -->
    <div class="dash-email-form__group">
      <label class="dash-email-form__label" for="email-current-pwd">
        <span data-i18n="dash.email.current_pwd">Поточний пароль</span>
      </label>
      <input
        class="dash-email-form__input"
        type="password"
        id="email-current-pwd"
        name="currentPassword"
        autocomplete="current-password"
      />
    </div>
    <!-- New email -->
    <div class="dash-email-form__group">
      <label class="dash-email-form__label" for="email-new">
        <span data-i18n="dash.email.new_email">Новий Email</span>
      </label>
      <input
        class="dash-email-form__input"
        type="email"
        id="email-new"
        name="newEmail"
        autocomplete="email"
      />
    </div>
    <button
      type="submit"
      class="btn btn--magenta"
      id="email-submit"
      data-i18n="dash.email.submit"
    >
      Змінити Email
    </button>
    <div id="email-feedback" hidden></div>
  </form>
</section>
```

#### File: `src/js/dashboard.js`

Add email change form handler after the password form handler. Find the section with `dash-pwd-form` and add BELOW it:

```js
// Email change form — PATCH /api/v1/users/me/email
const emailForm = document.getElementById("dash-email-form");
emailForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("email-submit");
  const feedback = document.getElementById("email-feedback");
  const currentPassword = document.getElementById("email-current-pwd")?.value;
  const newEmail = document.getElementById("email-new")?.value?.trim();
  if (!currentPassword || !newEmail) return;
  submitBtn.disabled = true;
  feedback.hidden = true;
  try {
    const res = await fetchWithAuth("PATCH", `${API}/users/me/email`, {
      currentPassword,
      newEmail,
    });
    const data = await res.json();
    if (res.ok) {
      setFeedback(
        feedback,
        translate("dash.email.success") || "Email успішно змінено",
        "ok",
      );
      emailForm.reset();
      // Update displayed email in profile section
      setVal("profile-email", data.email);
    } else {
      setFeedback(feedback, data.message || translate("error.generic"), "err");
    }
  } catch {
    setFeedback(feedback, translate("error.network"), "err");
  } finally {
    submitBtn.disabled = false;
  }
});
```

Note: `setFeedback` helper — check if it already exists in dashboard.js (similar to `pwdFeedback.innerHTML` pattern). Use the same pattern.

#### File: `src/components/pages/dashboard/dashboard.scss`

Add styles for `.dash-email-form` — copy the structure from `.dash-pwd-form` styles, they should look identical (same **group, **label, \_\_input classes). If they share classes, no extra SCSS needed.

#### i18n keys to add in all 4 JSON files (uk/en/fr/de):

- `dash.email.title` — "Змінити Email" / "Change Email" / "Changer l'Email" / "E-Mail ändern"
- `dash.email.current_pwd` — "Поточний пароль" / "Current password" / "Mot de passe actuel" / "Aktuelles Passwort"
- `dash.email.new_email` — "Новий Email" / "New Email" / "Nouvel Email" / "Neue E-Mail"
- `dash.email.submit` — "Змінити Email" / "Change Email" / "Changer l'Email" / "E-Mail ändern"
- `dash.email.success` — "Email успішно змінено" / "Email changed successfully" / "Email modifié avec succès" / "E-Mail erfolgreich geändert"

i18n files location: `src/i18n/uk.json`, `src/i18n/en.json`, `src/i18n/fr.json`, `src/i18n/de.json`

## Git

Branch: feature/component-038-frontend-like-width-gap-email
Commit message (English): fix(frontend): fix like button fetchWithAuth + min-width for lang switch + email change form

## Expected output

1. Like button loads initial state + uses fetchWithAuth
2. No visual layout jump when switching language
3. Dashboard has working email change form
4. dashboard.html profile email is readonly
5. `npm run build` passes with no errors
