# cote-lapyx.com — Чек-ліст прогресу

> Живий документ. Відмічай що зроблено, що в роботі, що переробити. Синхронізовано з PROJECT.md станом на 2026-04-23.

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

## Етап 1.5 — API Contract ✅ блокер знятий

- [x] Опис REST endpoints у форматі OpenAPI/Swagger — `docs/api-v1.yaml` v1.2.0
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
- [ ] Про нас — `about.html`
- [ ] Послуги — `services.html`
- [ ] Стаття блогу — `blog-post.html` (single post template)
- [ ] Сторінка проекту — `project.html` (single project template)
- [ ] Контакти — `contact.html`

### Авторизація

#### Завдання A1 — `login.html` + `_auth.scss`

- [ ] Centered auth-card на `$bg-dark`
- [ ] Форма: email + password
- [ ] Кнопка "Увійти" (btn--cyan), посилання "Реєстрація"
- [ ] Cyberpunk декор: hex-bg, bracket-кути, neon glow
- [ ] Адаптив mobile-first
- [ ] ⚠️ Security review перед деплоєм

#### Завдання A2 — `register.html`

- [ ] Той самий auth-card патерн (розширює `_auth.scss`)
- [ ] Форма: ім'я + email + password + confirm password
- [ ] Role hint "реєструєшся як Subscriber"
- [ ] Посилання "Вже є акаунт? Увійти"
- [ ] Валідація форм (frontend JS)

#### Завдання A3 — `dashboard.html` shell (layout)

- [ ] Sidebar навігація (owner / subscriber — два варіанти)
- [ ] Header у dashboard-режимі
- [ ] Основна content-зона
- [ ] `_dashboard.scss` — базовий layout
- [ ] Адаптив: sidebar → drawer на mobile

#### Завдання A4 — Dashboard Owner-контент

- [ ] Статистика: кількість постів, проектів, підписників
- [ ] Список останніх постів
- [ ] Сітка останніх проектів
- [ ] Кнопка "Швидко редагувати профіль"

#### Завдання A5 — Dashboard Subscriber-контент

- [ ] Профіль-картка
- [ ] Список "Мої коментарі"
- [ ] Список "Мої підписки"
- [ ] Список "Обране"

### Dashboard підсторінки (Owner)

- [ ] `dashboard/profile.html`
- [ ] `dashboard/posts.html`
- [ ] `dashboard/projects.html`
- [ ] `dashboard/comments.html`
- [ ] `dashboard/subscribers.html`

### Dashboard підсторінки (Subscriber)

- [ ] `dashboard/profile.html`
- [ ] `dashboard/comments.html`
- [ ] `dashboard/subscriptions.html`
- [ ] `dashboard/favorites.html`

### Адмінка (owner-only)

- [ ] `admin.html`
- [ ] `admin/users.html`
- [ ] `admin/posts.html`
- [ ] `admin/projects.html`
- [ ] `admin/categories.html`
- [ ] `admin/tags.html`
- [ ] `admin/messages.html`
- [ ] `admin/settings.html`

### JavaScript

- [x] Theme toggle (день/ніч)
- [x] Hamburger меню
- [x] Smooth scroll
- [x] Filters (проекти, блог)
- [x] Cursor trail
- [ ] Валідація форм
- [ ] i18n runtime switcher (uk/en/fr/de)

### Адаптив

Брейкпоінти: $pc=1200 / $tablet=992 / $mobile=768 / $mobileSmall=480 / $minWidth=320

- [x] Базовий адаптив — index, team, projects, blog, member (2026-04-24)
- [ ] Тест Mobile 375px — index (реальний пристрій / DevTools)
- [ ] Тест Mobile 375px — team
- [ ] Тест Mobile 375px — projects
- [ ] Тест Mobile 375px — blog
- [ ] Тест Mobile 375px — member
- [ ] Тест Tablet 768px — index
- [ ] Тест Tablet 768px — team
- [ ] Тест Tablet 768px — projects
- [ ] Тест Tablet 768px — blog
- [ ] Тест Tablet 768px — member

### Мультиязичність (статичний UI)

- [ ] `/js/i18n/uk.json`
- [ ] `/js/i18n/en.json`
- [ ] `/js/i18n/fr.json`
- [ ] `/js/i18n/de.json`
- [ ] `data-i18n` атрибути в усіх шаблонах
- [ ] Language switcher у header

### SEO & Meta

- [ ] Мета-теги per-page (title, description)
- [ ] OpenGraph на кожній сторінці (og:title, og:image, og:url)
- [ ] JSON-LD (Organization, Person, BlogPosting)
- [ ] `sitemap.xml`
- [ ] `robots.txt`

### Brand assets

- [x] Логотип підключено
- [x] Favicon
- [ ] Реальне фото Валерії (є `valerka.png` — перевірити)
- [ ] Реальне фото Андрія (є `cote-lapyx.png` — перевірити)
- [ ] Реальне фото Сергія — відсутнє, запитати

---

## Етап 4 — Backend (Андрій + Сергій)

### Інфраструктура

- [ ] Spring Boot проект (init)
- [ ] PostgreSQL локально (docker-compose для dev)
- [ ] Flyway / Liquibase міграції

### Схема БД (див. PROJECT.md §База даних)

- [ ] `users`
- [ ] `team_members`
- [ ] `blog_posts`
- [ ] `categories` + `tags` + `post_categories` + `post_tags`
- [ ] `projects`
- [ ] `comments`
- [ ] `subscriptions`
- [ ] `refresh_tokens`
- [ ] `contacts`
- [ ] `contact_messages`
- [ ] `translations`

### REST API (CRUD)

- [ ] `/api/auth` — login, register, refresh, logout
- [ ] `/api/users`
- [ ] `/api/team-members`
- [ ] `/api/posts` (filter: type=general|personal)
- [ ] `/api/projects`
- [ ] `/api/comments`
- [ ] `/api/categories` + `/api/tags`
- [ ] `/api/subscriptions`
- [ ] `/api/contact-messages`
- [ ] `/api/translations`

### Авторизація

- [ ] Spring Security + JWT (access + refresh)
- [ ] Ролі: `owner`, `subscriber`
- [ ] `bcrypt` для паролів
- [ ] Rate limiting на `/api/auth`
- [ ] ⚠️ Security audit перед продом

### Документація та деплой бекенду

- [ ] Swagger / OpenAPI на `/api/docs`
- [ ] Dockerfile
- [ ] `docker-compose.yml` (api + postgres + nginx)

### Міграція з PHP

- [ ] Перенести `src/php/register`, `sendmail`, `telegram` на Spring Boot
- [ ] Відключити PHP коли бекенд стабільний

---

## Етап 5 — Інтеграція Frontend ↔ Backend

- [ ] Клієнт API на фронтенді (fetch wrapper + JWT interceptor)
- [ ] Login / Register форми → API
- [ ] Dashboard Owner — всі CRUD
- [ ] Dashboard Subscriber — підписки, коментарі, обране
- [ ] Адмінка — всі CRUD
- [ ] Коментарі до статей (SSE або polling)
- [ ] Мультиязичність динамічного контенту через `/api/translations`
- [ ] Контактна форма → `/api/contact-messages`

---

## Етап 6 — Тестування

- [ ] Функціональне тестування (вручну, всі юзер-флоу)
- [ ] Адаптив Mobile/Tablet (реальні пристрої + DevTools)
- [ ] Продуктивність: Lighthouse > 90 (Performance, Accessibility, SEO)
- [ ] Cross-browser (Chrome, Firefox, Safari, Edge)
- [ ] Безпека: OWASP Top 10 (security-agent)
- [ ] E2E тести (Playwright / Cypress) — опційно

---

## Етап 7 — Деплой

### Поточний стан

- [x] Сайт на сервері: `/var/www/cote-lapyx.com/html/` (Apache)
- [x] SSL Let's Encrypt
- [x] CI/CD: `.github/workflows/deploy.yml` (push main → rsync)
- [x] SSH відновлено (2026-04-23)
- [x] Deploy key перевірено в `~/.ssh/authorized_keys` (2026-04-24) + workflow зелений

### Цільовий стек (після міграції на Spring Boot)

- [ ] Nginx замість Apache
- [ ] Docker + docker-compose (api + db + nginx)
- [ ] Env-конфіги (dev / staging / prod)
- [ ] Бекапи PostgreSQL (cron + off-site)

---

## Технічний борг / Потрібно виправити 🔧

- [ ] Замінити MySQL → PostgreSQL у CLAUDE.md (рядок "DB: MySQL on server" застарів)
- [ ] Прибрати `src/php/` коли бекенд мігрує на Spring Boot
- [x] Permission-шум у git виправлено (`git config core.fileMode false`, 2026-04-24)
- [ ] Перевірити чи Figma Make URL у PROJECT.md (`Q8XJ7EGnLCrkeP6v9Q5wX1`) ще живий — є другий `B4DeuZMrLBIU3VeG5HYL7o` в memory

---

## Синхронізація з Notion

Основні задачі дзеркально створені в Notion Tasks DB, фільтр `Project = cote-lapyx`:
https://www.notion.so/ae024f5d34f14964b5eeb829f73cf9fb

Якщо задача закрита/додана тут — оновити і в Notion.

---

_Оновлено: 2026-04-24_
