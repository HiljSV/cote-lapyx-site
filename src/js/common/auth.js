// =============================================================================
// Auth utilities — shared across dashboard.js, admin.js
// =============================================================================

const AUTH_API = "https://api.cote-lapyx.com/api/v1/auth";

/**
 * Fetch with automatic JWT refresh.
 * - Attaches Authorization header from localStorage "cl_access"
 * - On 401: tries POST /auth/refresh with "cl_refresh"
 *   - If refresh succeeds: retries original request with new token
 *   - If refresh fails: clears tokens and redirects to /login.html
 */
export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("cl_access");

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
    signOut();
    return res;
  }

  const rRes = await fetch(`${AUTH_API}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!rRes.ok) {
    signOut();
    return res;
  }

  const { accessToken, refreshToken: newRefresh } = await rRes.json();
  localStorage.setItem("cl_access", accessToken);
  localStorage.setItem("cl_refresh", newRefresh);

  return doFetch(accessToken);
}

/** Remove tokens and redirect to login (no-op if already on login page) */
export function signOut() {
  localStorage.removeItem("cl_access");
  localStorage.removeItem("cl_refresh");
  if (!window.location.pathname.includes("login")) {
    window.location.replace("/login.html");
  }
}

/** True if an access token is present in localStorage (not validated) */
export function isLoggedIn() {
  return Boolean(localStorage.getItem("cl_access"));
}
