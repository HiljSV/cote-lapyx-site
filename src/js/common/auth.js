// =============================================================================
// Auth utilities — shared across dashboard.js, admin.js
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
 * - On 401: tries POST /auth/refresh with "cl_refresh"
 *   - If refresh succeeds: retries original request with new token
 *   - If refresh fails: shows session-expiry toast, then redirects to /login.html
 */
export async function fetchWithAuth(url, options = {}) {
  // Attach current access token to request
  const token = localStorage.getItem("cl_access");

  // Inner helper — reuses options spread, only token changes on retry
  const doFetch = (t) =>
    fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${t}` },
    });

  const res = await doFetch(token);
  if (res.status !== 401) return res;

  // Access token expired — try silent refresh
  const refreshToken = localStorage.getItem("cl_refresh");
  if (!refreshToken) {
    // No refresh token — session truly expired; show toast before redirect
    signOut(true);
    return res;
  }

  // Attempt token refresh
  const rRes = await fetch(`${AUTH_API}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!rRes.ok) {
    // Refresh failed (revoked/expired) — session expired; show toast before redirect
    signOut(true);
    return res;
  }

  // Refresh succeeded — persist new tokens and retry original request
  const { accessToken, refreshToken: newRefresh } = await rRes.json();
  localStorage.setItem("cl_access", accessToken);
  localStorage.setItem("cl_refresh", newRefresh);

  return doFetch(accessToken);
}

// =============================================================================
// signOut — clears tokens and redirects to login page
// =============================================================================

/**
 * Remove tokens from localStorage and redirect to /login.html.
 * No-op if the user is already on the login page (prevents redirect loops).
 *
 * @param {boolean} [showToast=false] - When true, show session-expiry toast
 *   for 2 seconds before redirecting. Pass true only for automatic expiry;
 *   manual logout should pass false (or omit) to redirect immediately.
 */
export function signOut(showToast = false) {
  // Clear both tokens regardless of redirect
  localStorage.removeItem("cl_access");
  localStorage.removeItem("cl_refresh");

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
