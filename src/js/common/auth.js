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
// Token expiry + silent refresh helpers
// =============================================================================

/**
 * Returns true if the JWT is missing, unparseable, or expired (within a small
 * clock-skew buffer). Client-side READ of the `exp` claim only — NOT signature
 * verification (the server still validates). A malformed token is treated as
 * expired so we proactively refresh rather than send a doomed request.
 *
 * @param {string|null} token - the raw JWT access token
 * @param {number} [skewSeconds=15] - refresh this many seconds BEFORE real expiry
 */
export function isTokenExpired(token, skewSeconds = 15) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false; // no exp claim → treat as non-expiring
    return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true; // malformed → force a refresh
  }
}

// In-flight refresh promise — de-dupes concurrent refreshes so a burst of
// parallel requests triggers ONE /auth/refresh, not N (which would rotate the
// HttpOnly cl_refresh cookie N times and could race).
let _refreshInFlight = null;

/**
 * Silently refresh the access token via POST /auth/refresh. The HttpOnly
 * cl_refresh cookie travels automatically (credentials:'include'); the server
 * rotates it and returns a new accessToken in the JSON body, which we persist.
 * Concurrent callers share a single in-flight request.
 *
 * @returns {Promise<string|null>} the new access token, or null on failure
 */
export async function refreshAccessToken() {
  if (_refreshInFlight) return _refreshInFlight;
  _refreshInFlight = (async () => {
    try {
      const rRes = await fetch(`${AUTH_API}/refresh`, {
        method: "POST",
        credentials: "include", // sends the HttpOnly cl_refresh cookie
      });
      if (!rRes.ok) return null;
      const { accessToken } = await rRes.json();
      if (accessToken) localStorage.setItem("cl_access", accessToken);
      return accessToken || null;
    } catch {
      return null; // network error — caller decides what to do
    } finally {
      _refreshInFlight = null;
    }
  })();
  return _refreshInFlight;
}

/**
 * Guarantees a usable session for protected-page guards. If the access token is
 * present and not expired → ok. Otherwise silently refresh via the HttpOnly
 * cookie BEFORE the caller decides to redirect to /login. Lets a session
 * survive an expired/cleared access token for as long as the 30-day refresh
 * cookie is valid — i.e. the user is not kicked out mid-session.
 *
 * @returns {Promise<boolean>} true if a session exists (token valid or refreshed)
 */
export async function ensureSession() {
  const token = localStorage.getItem("cl_access");
  if (token && !isTokenExpired(token)) return true;
  return Boolean(await refreshAccessToken());
}

// =============================================================================
// fetchWithAuth — attaches JWT, auto-refreshes the token before it expires
// =============================================================================

/**
 * Fetch with automatic JWT refresh — the token is renewed transparently so the
 * user is never kicked out while their 30-day refresh cookie is valid.
 * - Attaches Authorization from localStorage "cl_access".
 * - credentials:'include' always set so the HttpOnly cl_refresh cookie travels.
 * - PROACTIVE: if the access token is missing or (about to be) expired, refresh
 *   BEFORE sending the request — no failed call, no UI flash.
 * - REACTIVE fallback: if the request still returns 401 OR 403 (token revoked,
 *   clock skew, or a role-protected URL that answers 403 for a bad token),
 *   refresh once and retry. A genuine 403 (valid token, missing role) refreshes
 *   once and still returns 403 — harmless, no loop.
 * - If refresh fails (cookie absent/expired/revoked) → session-expiry toast +
 *   redirect to /login.html.
 */
export async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("cl_access");

  const doFetch = (t) =>
    fetch(url, {
      ...options,
      credentials: "include",
      headers: { ...options.headers, Authorization: `Bearer ${t}` },
    });

  // PROACTIVE: refresh up-front when the token is missing/expired.
  if (isTokenExpired(token)) {
    const fresh = await refreshAccessToken();
    if (fresh) token = fresh;
    // If refresh failed here, still try the request — the reactive branch below
    // will sign out on the resulting 401/403 (keeps a single sign-out path).
  }

  const res = await doFetch(token);
  if (res.status !== 401 && res.status !== 403) return res;

  // REACTIVE fallback — refresh once more and retry the original request.
  const fresh = await refreshAccessToken();
  if (!fresh) {
    signOut(true); // refresh genuinely failed — session is over
    return res;
  }
  return doFetch(fresh);
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
