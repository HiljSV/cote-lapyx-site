# cote-lapyx.com — Чек-ліст прогресу

> Живий документ. Оновлено: 2026-05-16

## Легенда

- [x] ✅ Зроблено
- [ ] ⏳ Заплановано / не починали
- [ ] 🚧 В роботі
- [ ] 🔧 Потребує переробки / доробки
- [ ] ⚠️ Блокер

---

## Етап 1 — Проектування

- [x] Концепція сайту (команда з 3 учасників, спільний + особисті блоги)
- [x] Brand Kit — Cyberpunk палітра (#00e5ff / #e040fb / #39ff14 / #0a0e1a)
- [x] Шрифти: Geologica (заголовки) + Nunito (тіло) — варіант C
- [x] Логотип (SVG, PNG, favicon 16-512px, OG 1200x630, site.webmanifest)
- [x] Figma файл створено
- [x] Карта сайту затверджена

---

## Етап 1.5 — API Contract ✅

- [x] Опис REST endpoints у форматі OpenAPI/Swagger — `docs/api-v1.yaml` v1.5.0
- [x] Структура запитів/відповідей: auth (JWT access 15хв + refresh 30д)
- [x] Структура запитів/відповідей: users
- [x] Структура запитів/відповідей: posts (general + personal)
- [x] Структура запитів/відповідей: projects
- [x] Структура запитів/відповідей: comments (soft-delete + audit log)
- [x] Структура запитів/відповідей: subscriptions
- [x] Структура запитів/відповідей: translations (bulk upsert, 207 partial)
- [x] Структура запитів/відповідей: contacts (GET public + admin CRUD)
- [x] Затвердити контракт як `API-v1` в документації
- [x] Автомодерація коментарів (422 + CommentRejectedProblem)
- [x] RFC 9457 ProblemDetail для всіх помилок

---

## Етап 2 — Дизайн

- [x] Cyberpunk стиль затверджено командою
- [x] HTML/CSS прототип Desktop — 5 сторінок
- [ ] Макети Tablet 768px
- [ ] Макети Mobile 375px
- [ ] Figma UI Kit (компоненти) — опційно

---

## Етап 3 — Frontend верстка 🚧 (поточний)

### Налаштування

- [x] FLS Start + Vite
- [x] SCSS дизайн-система (cyberpunk.scss, BEM, mobile-first)
- [x] Базові компоненти (header, footer, картки)

### Сторінки Desktop

- [x] Головна — `index.html`
- [x] Команда — `team.html`
- [x] Проекти — `projects.html`
- [x] Блог — `blog.html`
- [x] Сторінка учасника — `member.html`
- [x] Стаття блогу — `post.html` (з лайками, вибраним, коментарями, підпискою)
- [x] Сторінка проекту — `project.html`
- [x] Про нас — `about.html`
- [x] Послуги — `services.html`
- [x] Контакти — `contact.html`

### Авторизація

- [x] `login.html` + `_auth.scss` — форма, cyberpunk декор, адаптив
- [x] `register.html` — форма реєстрації, валідація, автологін після реєстрації
- [x] Header: "Увійти" ↔ "Кабінет" залежно від JWT токена

### Dashboard (Owner)

- [x] `dashboard.html` — повний single-page dashboard з sidebar і табами
- [x] Огляд — статистика (пости, проекти, підписники), останні публікації + проекти з thumbnail
- [x] Пости — список з Edit/Delete, фільтр статусу, пагінація
- [x] Проекти — список з Edit/Delete, фільтр статусу, пагінація
- [x] Коментарі — список з модерацією (approve/delete)
- [x] Підписники — список, фільтр типу, видалення, CSV-експорт
- [x] Профіль — редагування даних, зміна пароля
- [x] Аналітика — Umami панель
- [x] Завантаження обкладинки (upload + preview) для постів і проектів
- [x] Sidebar прихований для не-адмінів (admin tab)

### Адмінка

- [x] `admin.html` — guard (тільки isAdmin), базові панелі
- [ ] Окремі сторінки admin/users, admin/categories, admin/tags — не потрібні (all in dashboard)

### JavaScript

- [x] Theme toggle (день/ніч)
- [x] Hamburger меню
- [x] Smooth scroll
- [x] Filters (проекти, блог)
- [x] Cursor trail
- [x] Hex-grid canvas анімація
- [x] fetchWithAuth (JWT interceptor + silent refresh)
- [x] DOM guards (bundle mode — крос-сторінкова ізоляція)
- [ ] Валідація форм (contact, login, register — частково є)
- [ ] i18n runtime switcher (uk/en/fr/de)

### Адаптив

- [x] Базовий адаптив — index, team, projects, blog, member
- [x] Dashboard — sidebar → drawer на mobile, CSS Grid dash-list
- [ ] Тест Mobile 375px — всі сторінки (реальний пристрій / DevTools)
- [ ] Тест Tablet 768px — всі сторінки

### Мультиязичність (статичний UI)

- [x] `/js/i18n/uk.json`
- [x] `/js/i18n/en.json`
- [x] `/js/i18n/fr.json`
- [x] `/js/i18n/de.json`
- [x] `data-i18n` атрибути в усіх шаблонах
- [x] Language switcher у header

### SEO & Meta

- [ ] Мета-теги per-page (title, description)
- [ ] OpenGraph на кожній сторінці (og:title, og:image, og:url)
- [ ] JSON-LD (Organization, Person, BlogPosting)
- [x] `sitemap.xml`
- [x] `robots.txt`

### Brand assets

- [x] Логотип підключено
- [x] Favicon
- [ ] Реальне фото Валерії (є `valerka.png` — перевірити)
- [ ] Реальне фото Андрія (є `cote-lapyx.png` — перевірити)
- [ ] Реальне фото Сергія — відсутнє, запитати

---

## Етап 4 — Backend ✅ (задеплоєний)

### Інфраструктура

- [x] Spring Boot 3.3 + Java 21 (scaffold + пакетна структура)
- [x] PostgreSQL 15 на сервері
- [x] Flyway міграції (V1 — схема, V2 — seed OWNER accounts)
- [ ] docker-compose для локальної розробки — опційно

### Схема БД

- [x] `users`
- [x] `team_members`
- [x] `blog_posts` + `post_categories` + `post_tags`
- [x] `categories` + `tags`
- [x] `projects` + `project_technologies` + `project_gallery`
- [x] `comments`
- [x] `favorites`
- [x] `subscriptions`
- [x] `refresh_tokens`
- [x] `contacts` + `contact_messages`
- [x] `translations`

### REST API (всі ендпоінти задеплоєні)

- [x] `/api/v1/auth` — register, login, refresh, logout
- [x] `/api/v1/users` — профіль, зміна пароля
- [x] `/api/v1/team-members`
- [x] `/api/v1/posts` — CRUD, фільтри, slug
- [x] `/api/v1/projects` — CRUD, фільтри, slug
- [x] `/api/v1/comments` — create, delete, approve
- [x] `/api/v1/categories` + `/api/v1/tags`
- [x] `/api/v1/subscriptions`
- [x] `/api/v1/contact` — публічна форма
- [x] `/api/v1/translations`
- [x] `/api/v1/upload` — завантаження файлів (10MB)
- [x] `/api/v1/admin/**` — ROLE_OWNER: users, posts, projects, comments, dashboard, analytics
- [x] `/api/v1/analytics/**` — Umami proxy

### Авторизація

- [x] Spring Security + JWT (access 15хв + refresh 30д)
- [x] Ролі: `OWNER`, `SUBSCRIBER`
- [x] bcrypt паролі
- [x] isAdmin flag (Сергій + Андрій)
- [ ] Rate limiting на `/api/auth` — не реалізовано
- [ ] ⚠️ Security audit перед прод-релізом

### Документація та деплой

- [x] Swagger / OpenAPI — `https://api.cote-lapyx.com/swagger-ui/index.html`
- [x] GitHub Actions CI/CD deploy workflow
- [x] systemd unit `cote-lapyx-backend.service`
- [x] README з посиланням на frontend repo
- [ ] Dockerfile / docker-compose — опційно

---

## Етап 5 — Інтеграція Frontend ↔ Backend ✅

- [x] fetchWithAuth — JWT interceptor + silent refresh
- [x] Login / Register форми → API
- [x] Dashboard Owner — пости, проекти, коментарі, підписники, профіль
- [x] Адмінка — users, guard isAdmin
- [x] Коментарі до статей (polling)
- [x] Лайки, вибране, підписка на пості
- [x] Upload обкладинки (пости + проекти)
- [ ] Dashboard Subscriber — підписки, коментарі, обране (не реалізовано для subscriber-ролі)
- [ ] Мультиязичність через `/api/translations`
- [x] Контактна форма → `/api/contact-messages`

---

## Етап 6 — Тестування

- [ ] Функціональне тестування (вручну, всі юзер-флоу)
- [ ] Адаптив Mobile/Tablet (реальні пристрої + DevTools)
- [ ] Продуктивність: Lighthouse > 90
- [ ] Cross-browser (Chrome, Firefox, Safari, Edge)
- [ ] Безпека: OWASP Top 10 (security-agent)
- [ ] E2E тести (Playwright / Cypress) — опційно

---

## Етап 7 — Деплой

### Поточний стан

- [x] Frontend: `/var/www/cote-lapyx.com/html/` (Apache)
- [x] Backend: `/opt/cote-lapyx-backend/app.jar` (systemd, порт 8082)
- [x] Apache reverse proxy: `api.cote-lapyx.com` → Spring Boot
- [x] Apache Alias: `/uploads/` → `/opt/cote-lapyx-backend/uploads/`
- [x] SSL Let's Encrypt (frontend + api субдомен)
- [x] CI/CD frontend: `.github/workflows/deploy.yml` (push main → rsync)
- [x] CI/CD backend: GitHub Actions (push main → scp + systemctl restart)

### Цільовий стек (після міграції — опційно)

- [ ] Nginx замість Apache
- [ ] Docker + docker-compose (api + db + nginx)
- [ ] Бекапи PostgreSQL (cron + off-site)

---

## Технічний борг 🔧

- [ ] Замінити MySQL → PostgreSQL у CLAUDE.md (рядок "DB: MySQL on server" застарів)
- [x] Прибрати `src/php/` — бекенд вже на Spring Boot (директорію `src/php` видалено)
- [ ] Dashboard Subscriber (підписки, коментарі, обране) — не реалізовано
- [ ] Rate limiting на `/api/auth`
- [x] Контактна форма → API (підключено до POST /api/v1/contact)
- [x] Сторінки: `about.html`, `services.html`, `contact.html`
- [ ] SEO / OpenGraph / JSON-LD
- [x] i18n (мультиязичність UI)
- [x] Permission-шум у git виправлено (`git config core.fileMode false`)
- [x] Cross-repo посилання (frontend ↔ backend README/PROJECT.md)

---

## Синхронізація з Notion

https://www.notion.so/ae024f5d34f14964b5eeb829f73cf9fb

---

_Оновлено: 2026-05-16_
