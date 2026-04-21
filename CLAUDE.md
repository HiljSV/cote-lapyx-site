# cote-lapyx.com — Main Website

## Stack

- HTML/PUG, SCSS, JS (FLS template, Vite)
- PHP backend (src/php/)
- Deploy: Apache on cote-lapyx.com server

## Structure

- `src/` — main sources
- `src/php/` — backend (index.php, sendmail, telegram)
- `src/components/` — reusable components
- `src/styles/` — SCSS
- `src/js/` — JavaScript
- `src/pug/` — PUG templates
- `template_modules/` — FLS modules

## Agents

- `Frontend-Dev-Agent-HTML-SCSS-JS` — layout, SCSS, PUG
- `backend-dotnet-core` — PHP API, registration, auth
- `devops-agent` — deploy to server, Apache config
- `security-agent` — before any auth/registration deploy

## Registration Feature (in progress)

- PHP backend endpoint: POST /register
- Fields: email, password (bcrypt), username
- DB: MySQL on server
- Validate on frontend + backend

## Rules

- SCSS → BEM methodology
- Mobile-first responsive
- Security review required before any auth code goes live
- Test locally (vite dev) before deploying

## Never Search

- SCSS/HTML/PUG syntax, BEM naming, Vite config
- PHP mail(), password_hash() basics
