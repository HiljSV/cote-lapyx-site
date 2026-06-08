# Maintenance Banner

Persistent fixed banner shown on all public pages when the site is in maintenance mode.

## Files

- `maintenance-banner.scss` — styles
- `../../../js/common/maintenance-banner.js` — behavior (fetch + inject + animate)

## How it works

On every public page, `app.js` imports and calls `initMaintenanceBanner()`.
The function fetches `GET /api/v1/site-settings/public` (public, no auth).
If `maintenanceMode === true`, it creates a fixed amber banner below the header.
If `maintenanceUntil` is set, the banner appends a localized ETA string.
All errors are caught and silently ignored (progressive enhancement).

## Visual

- Position: `fixed`, `top: 70px` (below the 70px header)
- Color: amber `#ffab00` — warning accent, distinct from the site's cyan/magenta/green
- Animation: slides in from top with opacity fade (double-rAF technique)
- Skipped on: `admin.html`, `dashboard.html`

## i18n keys

| Key                        | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `maintenance.banner_text`  | Main message (e.g. "Site under maintenance") |
| `maintenance.until_prefix` | ETA prefix (e.g. "estimated until")          |

## Notes

- The `is-visible` class triggers `display: block`; `is-animated` triggers the CSS transition.
  A double-rAF ensures the browser paints the display change before transition starts.
- `datetime-local` input in admin uses local browser time; conversions to/from ISO 8601 UTC
  are handled by `isoToDatetimeLocal()` and `datetimeLocalToIso()` in `admin.js`.
