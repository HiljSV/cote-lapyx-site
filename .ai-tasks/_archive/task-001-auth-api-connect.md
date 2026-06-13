# Task 001 — Connect auth.js, dashboard.js, admin.js to Spring Boot API

## Meta

- **Date:** 2026-05-02
- **Project:** cote-lapyx (frontend)
- **Agent:** Codex (executor)

## Project Context

- **Path:** /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
- **Stack:** HTML, SCSS, vanilla JS (FLS/Gulp build)
- **Build command:** npm run build
- **API base:** https://api.cote-lapyx.com
- **LocalStorage keys:** `cl_access` (JWT access token), `cl_refresh` (refresh token UUID)

## Goal

Replace PHP stub calls with real Spring Boot API calls, add token guard to protected pages, implement real logout.

## File 1: src/js/auth.js — two changes only

### Change A — initLoginForm() fetch

Find this block (lines ~176-199) and replace ONLY the fetch URL and success check:

**OLD:**

```js
const res = await fetch("/php/auth.php?action=login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const data = await res.json();

if (res.ok && data.success) {
  window.location.href = "/dashboard.html";
} else {
  showServerError(
    serverError,
    data.message ?? "Помилка входу. Спробуйте ще раз.",
  );
}
```

**NEW:**

```js
const res = await fetch("https://api.cote-lapyx.com/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const data = await res.json();

if (res.ok && data.accessToken) {
  // Store JWT tokens
  localStorage.setItem("cl_access", data.accessToken);
  localStorage.setItem("cl_refresh", data.refreshToken);
  window.location.href = "/dashboard.html";
} else {
  showServerError(
    serverError,
    data.detail ?? data.message ?? "Помилка входу. Спробуйте ще раз.",
  );
}
```

### Change B — initRegisterForm() fetch

Find this block (lines ~291-314) and replace ONLY the fetch URL and success check:

**OLD:**

```js
const res = await fetch("/php/auth.php?action=register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, password, role }),
});

const data = await res.json();

if (res.ok && data.success) {
  window.location.href = "/login.html?registered=1";
} else {
  showServerError(
    serverError,
    data.message ?? "Помилка реєстрації. Спробуйте ще раз.",
  );
}
```

**NEW:**

```js
const res = await fetch("https://api.cote-lapyx.com/api/v1/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, password }),
});

const data = await res.json();

if (res.ok && data.accessToken) {
  window.location.href = "/login.html?registered=1";
} else {
  showServerError(
    serverError,
    data.detail ?? data.message ?? "Помилка реєстрації. Спробуйте ще раз.",
  );
}
```

Note: removed `role` from body — backend sets SUBSCRIBER by default for /register.

## File 2: src/js/dashboard.js — token guard + real logout

### Change A — add token guard at very top of DOMContentLoaded callback

After the line `document.addEventListener("DOMContentLoaded", () => {`, add as FIRST lines:

```js
// Token guard — redirect to login if not authenticated
if (!localStorage.getItem("cl_access")) {
  window.location.replace("/login.html");
  return;
}
```

### Change B — replace logout handler (lines ~130-134)

**OLD:**

```js
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    window.location.href = "login.html";
  });
}
```

**NEW:**

```js
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
```

## File 3: src/js/admin.js — token guard + real logout

### Change A — add token guard

After `if (!sidebar) return;` line, add:

```js
// Token guard — redirect to login if not authenticated
if (!localStorage.getItem("cl_access")) {
  window.location.replace("/login.html");
  return;
}
```

### Change B — replace logout handler

**OLD:**

```js
logoutBtn?.addEventListener("click", () => {
  window.location.href = "login.html";
});
```

**NEW:**

```js
logoutBtn?.addEventListener("click", async () => {
  const refreshToken = localStorage.getItem("cl_refresh");
  if (refreshToken) {
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
```

## Requirements

1. Make ONLY the changes described above — do not modify any other logic
2. Always add comments in JS where the WHY is non-obvious
3. Run `npm run build` after all changes and verify it exits with code 0
4. `git add` only the 3 changed files
5. Commit: `feat(auth): connect login/dashboard/admin to Spring Boot JWT API`
6. Do NOT push to remote

## Forbidden

- Do NOT modify: app.js, any SCSS files, any HTML files, any other JS files
- Do NOT add features beyond this task scope
- Do NOT modify .env files

## Acceptance Criteria

- [ ] auth.js: login form calls https://api.cote-lapyx.com/api/v1/auth/login
- [ ] auth.js: register form calls https://api.cote-lapyx.com/api/v1/auth/register
- [ ] auth.js: on login success, tokens stored in localStorage as cl_access and cl_refresh
- [ ] dashboard.js: redirects to /login.html if cl_access not in localStorage
- [ ] dashboard.js: logout clears localStorage and calls API
- [ ] admin.js: same token guard and logout as dashboard.js
- [ ] npm run build exits 0
- [ ] git commit created with correct message
