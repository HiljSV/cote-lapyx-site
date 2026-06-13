# Task 065 — Subscription double opt-in frontend UX

# ~/.ai-tasks/task-065-subscribe-confirm-ux.md

## Meta

- **Date:** 2026-06-11
- **Project:** cote-lapyx (frontend)
- **Branch:** fix/065-subscribe-confirm-ux (already created and checked out by Claude)
- **Agent:** Codex (executor)
- **Created by:** Claude Code
- **STATUS: PLAN APPROVED** — proceed directly to implementation

---

## Project Context

- **Path:** /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
- **Stack:** Vite + vanilla JS (FLS template), flat-key i18n JSON in src/i18n/{uk,en,fr,de}.json
- **Build command:** npm run build
- **Config files (DO NOT TOUCH):** vite.config.js, template.config.js, .env, docs/api-v1.yaml

---

## Goal

Backend switched POST /subscriptions to double opt-in: a new subscription is created
as PENDING and the user receives a confirmation email; after clicking the link the
API redirects to `https://cote-lapyx.com/?subscribed=1` (or `?subscribed=0` on
invalid/expired token). The frontend must (1) tell the user to check their inbox
after subscribing, and (2) show feedback on the homepage after the confirm redirect.

---

## Requirements

1. `src/js/post.js` — in the subscribe form submit handler (around line 545), the
   success message must use a NEW i18n key `post.subscribe_check_email` instead of
   `post.subscribe_ok`. Keep 409 → `post.subscribe_already` and error →
   `post.subscribe_err` behavior unchanged. Do NOT remove the old
   `post.subscribe_ok` key from the JSON files (kept for reference/other use).

2. Add the new flat keys to ALL FOUR locale files, next to the existing
   `post.subscribe_ok` key (line ~377). Exact texts (no em-dash «—» anywhere,
   this is a hard project rule):
   - uk.json: `"post.subscribe_check_email": "Майже готово! Перевірте пошту та підтвердіть підписку за посиланням у листі."`
   - en.json: `"post.subscribe_check_email": "Almost done! Check your inbox and confirm your subscription via the link in the email."`
   - fr.json: `"post.subscribe_check_email": "Presque terminé ! Vérifiez votre boîte mail et confirmez votre abonnement via le lien dans le message."`
   - de.json: `"post.subscribe_check_email": "Fast geschafft! Prüfen Sie Ihr Postfach und bestätigen Sie das Abonnement über den Link in der E-Mail."`

3. Homepage confirm feedback. In `src/js/app.js` (entry for index.html, already
   imports `translate` from `@js/i18n.js`): on DOMContentLoaded, read
   `new URLSearchParams(location.search).get("subscribed")`.
   - `"1"` → show a success toast with new key `home.subscribe_confirmed`
   - `"0"` → show an error toast with new key `home.subscribe_confirm_failed`
   - anything else / absent → do nothing.
   After showing the toast, remove the `subscribed` param from the URL via
   `history.replaceState` (keep other params and hash intact).
   Toast: follow the existing inline-styled toast pattern in
   `src/js/common/auth.js` (session-expiry toast, ~line 19-44): fixed position,
   cyberpunk style, pointer-events:none; auto-remove after ~6 seconds. For the
   error variant use a red/amber accent instead of cyan. Implement as a small
   named function with a block comment.

4. New locale keys for homepage feedback (place near other `home.*` keys if a
   `home.` group exists, otherwise append before the last key, keeping valid JSON):
   - uk: `"home.subscribe_confirmed": "Підписку підтверджено! Дякуємо, тепер ви отримуватимете оновлення."`
         `"home.subscribe_confirm_failed": "Посилання підтвердження недійсне або застаріле. Спробуйте підписатися ще раз."`
   - en: `"home.subscribe_confirmed": "Subscription confirmed! Thank you, you will now receive updates."`
         `"home.subscribe_confirm_failed": "The confirmation link is invalid or expired. Please try subscribing again."`
   - fr: `"home.subscribe_confirmed": "Abonnement confirmé ! Merci, vous recevrez désormais les mises à jour."`
         `"home.subscribe_confirm_failed": "Le lien de confirmation est invalide ou expiré. Veuillez réessayer de vous abonner."`
   - de: `"home.subscribe_confirmed": "Abonnement bestätigt! Danke, Sie erhalten ab jetzt Updates."`
         `"home.subscribe_confirm_failed": "Der Bestätigungslink ist ungültig oder abgelaufen. Bitte versuchen Sie erneut, sich anzumelden."`

5. Comments: block-level comment before every new function and logic block
   (project global standard).

6. Run `npm run build` and verify it finishes without errors.

7. Commit on the current branch with message:
   `fix(subscribe): double opt-in UX - check-email message + confirm redirect toast`

---

## Forbidden

- Do NOT modify backend repo or docs/api-v1.yaml
- Do NOT add features beyond this task scope
- Do NOT push to remote
- Do NOT touch vite.config.js, template.config.js
- Do NOT use raw fetch with Bearer tokens (not needed here; the subscribe POST is public and already correct)
- Do NOT merge adjacent IIFEs (Prettier hook pitfall); use plain function declarations / if blocks

---

## Files to Create / Modify

- `src/js/post.js` — success message key swap (1 line)
- `src/js/app.js` — subscribed query-param toast handler (new block)
- `src/i18n/uk.json`, `src/i18n/en.json`, `src/i18n/fr.json`, `src/i18n/de.json` — 3 new keys each

---

## Expected Output

Branch fix/065-subscribe-confirm-ux with ONE commit containing the changes above,
`npm run build` green.
