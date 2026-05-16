# cote-lapyx — Frontend

Multilingual team IT website. HTML/SCSS/JS (Vite + FLS template).

**Backend repo:** https://github.com/HiljSV/cote-lapyx-backend  
**Live site:** https://cote-lapyx.com

## Stack

- Vite + FLS 4.0 (build toolchain)
- SCSS (BEM, mobile-first), vanilla JS
- 4 languages: uk / en / fr / de (JSON bundles + auto-detect)
- Spring Boot REST API at `https://api.cote-lapyx.com`

## Dev

```bash
npm install
npm run dev        # Vite dev server (localhost:3000)
npm run build      # production build → dist/
npm run i18n:check # validate i18n JSON + HTML/JS refs
```

## Deploy

```bash
npm run deploy     # rsync dist/ → server (SSH key required)
```

CI/CD: GitHub Actions → rsync on push to `main`.

## Structure

```
src/
├── components/     # reusable HTML includes (header, footer, etc.)
├── i18n/           # JSON translation bundles (uk/en/fr/de) + README
├── js/             # vanilla JS (auth, fetchWithAuth, blog, projects…)
├── styles/         # SCSS (cyberpunk design system)
├── assets/         # images, fonts, icons
├── data/           # static JSON (members.json)
└── files/          # copied as-is to dist (sitemap.xml, robots.txt)
```

## Auth

- JWT access token (15 min) + refresh token (30 days), stored in `localStorage`
- All authenticated calls via `fetchWithAuth()` — never raw `fetch` with Bearer
- Public pages: index, team, projects, blog, post, project, member
- Protected pages: dashboard (OWNER), admin

## i18n

Detection order: `localStorage` → `navigator.languages[]` → geo-IP → `"en"`  
Validation: `npm run i18n:check` — run before every commit.  
See `src/i18n/README.md` for full documentation.

## Design system

Cyberpunk/neon: Cyan `#00e5ff` · Magenta `#e040fb` · Green `#39ff14` · BG `#0a0e1a`  
Fonts: Geologica (headings) + Nunito (body)  
Breakpoints: 1200 / 991 / 767 / 479 px
