# Task 054 — Frontend: admin logout redirect, session expiry toast, subscriptions fix

## Branch

`fix/054-jwt-duration-logout-ux-subscriptions` (already created from main, frontend repo)

## Project

`/home/hilj/code/active/cote-lapyx_project/cote-lapyx/`
FLS v4, Vite, vanilla JS, BEM/SCSS.

---

## Fix A — Admin logout redirect

**File:** `src/js/admin.js`, ~line 202

**Bug:** `window.location.replace("/login.html")` sends user to login page after logout.
**Fix:** Change to `window.location.replace("/")` — go to main site instead.

One-line change:

```js
// before
window.location.replace("/login.html");
// after
window.location.replace("/");
```

---

## Fix B — Session expiry notification (UX)

**File:** `src/js/common/auth.js`

**Bug:** When session expires (refresh token invalid), `signOut()` silently redirects to `/login.html`
with no message. User sees "empty account" and doesn't know why they got logged out.

**Fix:** Before redirecting in `signOut()`, show a toast notification for 2 seconds, then redirect.

Add a toast function inline in `auth.js` (no external dependency):

```js
function showSessionExpiredToast() {
  // Brief DOM toast — shown only when session expires, not on manual logout
  const toast = document.createElement("div");
  toast.textContent = "Сесія закінчилась. Будь ласка, увійдіть знову.";
  toast.style.cssText = [
    "position:fixed",
    "bottom:24px",
    "left:50%",
    "transform:translateX(-50%)",
    "background:#1a1f3a",
    "color:#00e5ff",
    "border:1px solid #00e5ff",
    "padding:12px 24px",
    "border-radius:8px",
    "font-size:14px",
    "z-index:99999",
    "pointer-events:none",
    "box-shadow:0 0 16px rgba(0,229,255,0.3)",
  ].join(";");
  document.body?.appendChild(toast);
}
```

Update `signOut()`:

```js
export function signOut(showToast = false) {
  localStorage.removeItem("cl_access");
  localStorage.removeItem("cl_refresh");
  if (!window.location.pathname.includes("login")) {
    if (showToast) {
      showSessionExpiredToast();
      setTimeout(() => window.location.replace("/login.html"), 2000);
    } else {
      window.location.replace("/login.html");
    }
  }
}
```

In `fetchWithAuth`, the two `signOut()` calls that happen on 401/refresh-failure should pass `showToast = true`:

```js
// when no refresh token
signOut(true);

// when refresh fails
signOut(true);
```

The admin logout button in `admin.js` calls the logout API then does `window.location.replace("/")` directly (Fix A) — it should NOT use `signOut()` and NOT show the toast (user chose to logout manually).

---

## Fix C — Dashboard "Мої підписки" not working

**File:** `src/js/dashboard.js`

**Bug:** "Мої підписки" section shows "Помилка завантаження" or nothing.

**Investigation required:**

1. Read `loadMySubscriptions()` at line ~1227 and `cancelMySubscription()` at ~1271
2. Check: are `SUB_TYPE_LABEL`, `SUB_STATUS_LABEL`, `SUB_STATUS_CLASS` constants available when `loadMySubscriptions` runs?
   - They are declared at line ~1372. If `loadMySubscriptions` is triggered (by section switch or init) BEFORE line 1372 executes — they'd be in TDZ and throw ReferenceError.
   - Check the init flow: is `my-subscriptions` set as default section on page load? If yes, `loadMySubscriptions` runs before those constants are declared.
3. Check: does the API endpoint `GET /api/v1/users/me/subscriptions` return array `[...]` or object `{ content: [...] }`?
   - Backend `UserController.mySubscriptions` returns `List<SubscriptionResponse>` — so it's a plain array.
   - Frontend does `const subs = await res.json()` then `subs.map(...)` — this is correct for a plain array.
4. Check: are `SUB_STATUS_CLASS` values mapping to real CSS classes? (e.g. `dash-status--draft`, `dash-status--active`)

**Most likely fix:** Move the three constants (`SUB_TYPE_LABEL`, `SUB_STATUS_LABEL`, `SUB_STATUS_CLASS`) to BEFORE the `loadMySubscriptions` function definition, so they're not in TDZ when the function runs.

If the issue is something else, fix the actual root cause — do not patch around it.

Also verify:

- `cancelMySubscription` at ~1271 calls `DELETE /api/v1/subscriptions/{id}` — check this endpoint exists (hint: `SubscriptionController` at `/api/v1/subscriptions`)
- The cancel button `data-action="cancel-my-sub"` event is wired up correctly

---

## Code quality requirements

- Comments before every changed function and logic block
- All innerHTML strings through `escHtml()` (already used in the file)
- No new dependencies — vanilla JS only
- `signOut(showToast?)` signature change: update all call sites in `auth.js` (the 2 in `fetchWithAuth`)
- DO NOT change the call to `signOut()` in dashboard.js header auth check (manual logout = no toast)

## Build

`npm run build` must exit 0.

## Output

Commit on `fix/054-jwt-duration-logout-ux-subscriptions` with message:
`fix(auth,dashboard): session toast on expiry, admin logout to /, subscriptions panel fix`

Report:

- What was changed (file + line ranges)
- Root cause of subscriptions bug (TDZ or API or other)
- Any OUT OF SCOPE findings
