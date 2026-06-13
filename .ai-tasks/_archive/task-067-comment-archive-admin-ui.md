# Task 067 — Comment Lifecycle V2 admin UI (Архів / Block / Restore / Export)

# ~/.ai-tasks/task-067-comment-archive-admin-ui.md

## Meta

- **Date:** 2026-06-11
- **Project:** cote-lapyx (frontend)
- **Branch:** feature/component-067-comment-archive-ui (already created and checked out by Claude)
- **Agent:** Codex (executor)
- **Created by:** Claude Code
- **STATUS: PLAN APPROVED** — proceed directly to implementation

---

## Project Context

- **Path:** /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
- **Stack:** Vite + vanilla JS (FLS), i18n flat JSON src/i18n/{uk,en,fr,de}.json
- **Build command:** npm run build (npm may be unavailable in your sandbox — Claude will build after you)
- **Admin page source:** src/components/pages/admin/admin.html (FLS component source). Check whether src/admin.html is generated from it or separate; edit the component source, and if src/admin.html is an independent copy, mirror the change there too.
- **Admin JS:** src/js/admin.js (comments panel ~lines 1160-1345)
- **ALL API calls via fetchWithAuth** (never raw fetch with Bearer). ADMIN_API base already defined in admin.js.

---

## Goal

Admin comments section gets an "Архів" view (DELETED + BLOCKED comments), a Block-with-reason
action, a Restore action, an Export button, and the stats card shows live vs archived counts
per the new backend semantics.

---

## Backend API (already implemented on backend branch, deploy pending — code against this contract)

- `GET /api/v1/admin/comments?archive=false|true&page=&size=&sort=` — archive=false (default): PENDING/APPROVED/REJECTED only; archive=true: DELETED+BLOCKED only. Existing `status` filter param still works for live view.
- `PATCH /api/v1/admin/comments/{id}/block` body `{"reason":"..."}` (required, ≤500 chars) → sets BLOCKED
- `PATCH /api/v1/admin/comments/{id}/restore` → archived (BLOCKED/DELETED) comment back to PENDING
- `GET /api/v1/admin/comments/archive/export` → JSON file download (Content-Disposition attachment)
- CommentResponse now has nullable `blockedAt`, `blockReason`
- GET /admin/stats `DashboardStatsResponse`: `commentsTotal` is now LIVE only (PENDING+APPROVED), new field `commentsArchived` (DELETED+BLOCKED)

## Requirements

1. **Filter tab «Архів»** in src/components/pages/admin/admin.html comments section: add one more
   `admin-filter-tab` button after REJECTED with `data-comment-filter="ARCHIVE"` and
   `data-i18n="admin.filter.archive"`. Keep markup style identical to siblings, with block comment.

2. **admin.js — archive mode** (~line 1194 `loadAdminComments`):
   - When the active filter is `ARCHIVE`, request `?archive=true` (no `status` param); otherwise keep
     current behavior (`archive` omitted/false + existing status param).
   - `COMMENT_STATUS_LABEL`/`COMMENT_STATUS_CLASS`: add `BLOCKED` (label key `admin.comment_status.blocked`,
     css class `archived`).
   - In archive rows, render the block evidence when present: `blockReason` (title attr or small muted line
     under the comment text) and `blockedAt` date.

3. **Row actions**:
   - Live view (PENDING/APPROVED/REJECTED rows): add button «Заблокувати» (`admin.comments.btn_block`).
     On click: `prompt()` with translated text `admin.comments.block_reason_prompt`; if empty/cancelled — abort;
     else `PATCH /admin/comments/{id}/block` with `{reason}` via fetchWithAuth, then reload current page.
   - Archive view rows: single action button «Відновити» (`admin.comments.btn_restore`) →
     `PATCH /admin/comments/{id}/restore`, reload. Keep the existing force-delete button OUT of archive view
     (archived DELETED rows purge automatically; BLOCKED must never be deletable from UI).

4. **Export button**: in the comments section header (next to the filter tabs), a button
   «Експорт архіву» (`admin.comments.btn_export`), visible always. On click: fetchWithAuth GET
   `/admin/comments/archive/export`, take `res.blob()`, trigger download via temporary `<a download>`
   with filename `comments-archive-<YYYYMMDD>.json`. Handle non-OK with the existing error toast/console pattern.

5. **Stats**: in loadAdminStats (~line 723) keep `admin-stat-comments` = `stats.commentsPending`
   BUT add the archived counter: in admin.html the comments stat card (around line 352) add a small
   secondary line `<p class="dash-stat-card__sub" id="admin-stat-comments-archived"></p>`; in JS set it to
   translated `admin.stats.archived_fmt` text with the number, e.g. "Архів: 3" (simple string concat of
   translated label + ": " + value). If `.dash-stat-card__sub` has no styles, add a minimal SCSS rule in
   the admin page SCSS (find where dash-stat-card styles live) — small font, muted color.

6. **i18n** — add to ALL FOUR locales (uk/en/fr/de), flat keys, NO em-dash «—» in texts:
   - `admin.filter.archive`: uk "Архів" / en "Archive" / fr "Archives" / de "Archiv"
   - `admin.comment_status.blocked`: uk "Заблоковано" / en "Blocked" / fr "Bloqué" / de "Blockiert"
   - `admin.comments.btn_block`: uk "Заблокувати" / en "Block" / fr "Bloquer" / de "Blockieren"
   - `admin.comments.btn_restore`: uk "Відновити" / en "Restore" / fr "Restaurer" / de "Wiederherstellen"
   - `admin.comments.btn_export`: uk "Експорт архіву" / en "Export archive" / fr "Exporter les archives" / de "Archiv exportieren"
   - `admin.comments.block_reason_prompt`: uk "Вкажіть причину блокування (збережеться як доказ):" / en "Enter the block reason (kept as evidence):" / fr "Indiquez la raison du blocage (conservée comme preuve) :" / de "Geben Sie den Sperrgrund an (wird als Nachweis gespeichert):"
   - `admin.comments.blocked_reason_label`: uk "Причина" / en "Reason" / fr "Raison" / de "Grund"
   - `admin.stats.archived_fmt`: uk "Архів" / en "Archive" / fr "Archives" / de "Archiv"

7. Block-level comments on every new function/logic block. Do not merge adjacent IIFEs.

8. Git: do NOT commit (sandbox .git is read-only) — Claude will review, build and commit.

---

## Forbidden

- Do NOT touch backend repo, docs/api-v1.yaml, vite.config.js, template.config.js
- Do NOT add features beyond this scope
- Do NOT use raw fetch with Bearer token — fetchWithAuth only
- Do NOT remove or rename existing filter tabs, status keys, or the force-delete logic for live view

---

## Files to Create / Modify

- src/components/pages/admin/admin.html (and src/admin.html if it is an independent copy) — archive tab, export button, stats sub-line
- src/js/admin.js — archive mode, BLOCKED status, block/restore/export handlers, stats sub-line
- src/i18n/{uk,en,fr,de}.json — 8 new keys each
- admin page SCSS — `.dash-stat-card__sub` rule if missing

---

## Expected Output

Working tree changes (uncommitted) implementing all of the above.
