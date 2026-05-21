# cote-lapyx — Project Profile

## Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | HTML, SCSS (BEM), vanilla JS, FLS/Vite          |
| Backend  | Spring Boot 3.3, Java 21, PostgreSQL            |
| Auth     | JWT (access 15min / refresh 30d), localStorage  |
| Deploy   | Apache, GitHub Actions → rsync                  |
| Design   | Cyberpunk/neon, Geologica + Nunito              |
| i18n     | uk / en / fr / de (LibreTranslate, self-hosted) |

## Key commands

```bash
# Frontend dev
cd ~/code/active/cote-lapyx_project/cote-lapyx
npm run dev          # dev server
npm run build        # production build → dist/

# Backend dev
cd ~/code/active/cote-lapyx_project/cote-lapyx-backend
./gradlew bootRun    # local run
./gradlew test       # run tests

# Get JWT token (credentials in memory: credentials_cote_lapyx.md)
curl -s -X POST https://api.cote-lapyx.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hilj@cote-lapyx.com","password":"<from memory>"}' \
  | grep -o '"accessToken":"[^"]*"'
```

## Architecture

```
cote-lapyx_project/
├── cote-lapyx/           # Frontend (HTML/SCSS/JS + Vite)
│   ├── src/
│   │   ├── components/   # sections, layout, ui
│   │   ├── styles/       # cyberpunk.scss, settings.scss, style.scss
│   │   ├── js/           # auth.js, fetchWithAuth.js, dashboard.js, post.js
│   │   ├── assets/       # images, fonts, icons
│   │   └── data/         # members.json
│   └── docs/
│       └── api-v1.yaml   # OpenAPI 3.1 contract
└── cote-lapyx-backend/   # Spring Boot backend
    └── src/main/java/
        └── com/cote/
```

## API

- Base: `https://api.cote-lapyx.com/api/v1`
- Swagger: `https://api.cote-lapyx.com/swagger-ui/index.html`
- All auth requests → `fetchWithAuth()`, never raw fetch with Bearer

## Design tokens

```scss
// Colors
$cyan: #00e5ff;
$magenta: #e040fb;
$green: #39ff14;
$bg: #0a0e1a;

// Breakpoints
$pc: 1200px;
$tablet: 991.98px;
$mobile: 767.98px;
$mobileSmall: 479.98px;
```

## Security rules

- `fetchWithAuth()` for all API calls — never raw fetch with Authorization header
- `escHtml(value)` for all innerHTML assignments
- Security agent review required before any auth code changes go live
- No adjacent IIFEs in JS (Prettier merges them into broken syntax)

## Pages

| Page        | Access  | Notes          |
| ----------- | ------- | -------------- |
| index       | public  | landing        |
| team        | public  | members grid   |
| projects    | public  | portfolio      |
| blog        | public  | posts list     |
| post/:id    | public  | single post    |
| project/:id | public  | single project |
| member/:id  | public  | member profile |
| login       | public  | auth           |
| register    | public  | auth           |
| dashboard   | OWNER   | admin          |
| admin       | isAdmin | admin          |
