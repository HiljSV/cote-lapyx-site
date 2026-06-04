// =============================================================================
// Auth utilities — shared across dashboard.js, admin.js
// SEC-1: refresh token is now HttpOnly cookie (cl_refresh).
// JS must NOT read/write cl_refresh — it travels automatically via credentials:'include'.
// Only cl_access (access token) remains in localStorage.
// =============================================================================

// Import translate() for runtime i18n lookups (session-expiry toast)
import { translate } from "@js/i18n.js";

// Base URL for all auth API requests
const AUTH_API = "https://api.cote-lapyx.com/api/v1/auth";

// =============================================================================
// Session expiry toast — shown only on automatic logout (not manual)
// =============================================================================

/**
 * Inject a brief DOM toast notifying the user their session expired.
 * No external dependencies — pure DOM manipulation.
 * The toast is pointer-events:none and auto-removed after redirect fires.
 */
function showSessionExpiredToast() {
  // Create toast element with inline cyberpunk style (no CSS class dependency)
  const toast = document.createElement("div");
  // Translated session-expiry message (was hardcoded Ukrainian)
  toast.textContent = translate("auth.session_expired");
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
  // Guard: body may not exist in SSR/test environments
  document.body?.appendChild(toast);
}

// =============================================================================
// fetchWithAuth — attaches JWT, handles silent token refresh on 401
// =============================================================================

/**
 * Fetch with automatic JWT refresh.
 * - Attaches Authorization header from localStorage "cl_access"
 * - credentials:'include' is always set so the browser sends/receives the
 *   HttpOnly cl_refresh cookie to api.cote-lapyx.com (required for refresh
 *   and logout; harmless for other endpoints).
 * - On 401 OR 403: tries POST /auth/refresh — the cl_refresh HttpOnly cookie is sent
 *   automatically by the browser, no JS read required.
 *   - If refresh succeeds: stores new cl_access and retries original request
 *   - If refresh fails: shows session-expiry toast, then redirects to /login.html
 */
export async function fetchWithAuth(url, options = {}) {
  // Read current access token from localStorage
  const token = localStorage.getItem("cl_access");

  // Inner helper — reuses options spread, only token changes on retry.
  // credentials:'include' ensures the cl_refresh cookie travels with all
  // cross-subdomain requests to api.cote-lapyx.com.
  const doFetch = (t) =>
    fetch(url, {
      ...options,
      credentials: "include",
      headers: { ...options.headers, Authorization: `Bearer ${t}` },
    });

  // Initial request — may return 401 OR 403 when the access token is expired.
  // NOTE: role-protected URL matchers (e.g. /api/v1/admin/**) reject an
  // expired/invalid token with 403 (AccessDenied), not 401 — so we must treat
  // both as "try a silent refresh". (A genuine 403 for a valid-but-unauthorized
  // user simply refreshes once and still returns 403 on retry — harmless.)
  const res = await doFetch(token);
  if (res.status !== 401 && res.status !== 403) return res;

  // Access token expired/rejected — attempt silent refresh via HttpOnly cookie.
  // The cl_refresh cookie is sent automatically by the browser (not read by JS).
  // No guard on localStorage here — always attempt the refresh.
  const rRes = await fetch(`${AUTH_API}/refresh`, {
    method: "POST",
    credentials: "include",
    // No body: the server reads cl_refresh from the HttpOnly cookie
  });

  if (!rRes.ok) {
    // Refresh failed (cookie absent, expired, or revoked) — session is over
    signOut(true);
    return res;
  }

  // Refresh succeeded — server returns only accessToken in JSON body.
  // cl_refresh is rotated server-side and written back as a new HttpOnly cookie.
  const { accessToken } = await rRes.json();
  // Persist the new access token; cl_refresh is managed by the browser/server
  localStorage.setItem("cl_access", accessToken);

  // Retry the original request with the fresh access token
  return doFetch(accessToken);
}

// =============================================================================
// signOut — clears tokens and redirects to login page
// =============================================================================

/**
 * Clear the access token from localStorage and redirect to /login.html.
 * No-op if the user is already on the login page (prevents redirect loops).
 *
 * NOTE (SEC-1): cl_refresh is an HttpOnly cookie — JS cannot clear it.
 * The backend /auth/logout endpoint clears it server-side.
 * Only cl_access is managed here.
 *
 * @param {boolean} [showToast=false] - When true, show session-expiry toast
 *   for 2 seconds before redirecting. Pass true only for automatic expiry;
 *   manual logout should pass false (or omit) to redirect immediately.
 */
export function signOut(showToast = false) {
  // Clear the access token — cl_refresh is HttpOnly, managed by backend only
  localStorage.removeItem("cl_access");

  // No redirect needed if already on login page
  if (!window.location.pathname.includes("login")) {
    if (showToast) {
      // Session expired automatically — notify the user before redirecting
      showSessionExpiredToast();
      setTimeout(() => window.location.replace("/login.html"), 2000);
    } else {
      // Manual logout — redirect immediately, no toast
      window.location.replace("/login.html");
    }
  }
}

// =============================================================================
// isLoggedIn — quick check for access token presence
// =============================================================================

/** True if an access token is present in localStorage (not validated server-side) */
export function isLoggedIn() {
  return Boolean(localStorage.getItem("cl_access"));
}
