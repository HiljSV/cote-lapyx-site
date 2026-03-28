# Cote Lapyx — Проектна документація

---

## Команда

| Учасник | Роль | Стек | Статус | AI-партнер |
|---------|------|------|--------|------------|
| Валерія | Frontend розробка | HTML, CSS, SASS, JS, адаптив, UI | не бере участі на поточному етапі | — |
| Андрій | Backend розробка | Java, Spring Boot, PostgreSQL, API | активний | Claude (Backend Agent) |
| Сергій | Backend розробка | Java, Spring Boot, C#, Python, API | активний | — |

### Робочий процес (поточний етап)
- **Figma макети** — створює Claude (Figma Design Agent) за промтом з PROJECT.md
- **Frontend (верстка)** — підключиться Валерія пізніше
- **Backend (API, DB)** — Андрій + Claude Backend Agent, Сергій

---

## Концепція

**cote-lapyx.com** — командний сайт на 3 учасників із загальною головною сторінкою, спільним блогом та окремими персональними сторінками кожного учасника.

Сайт вирішує 4 задачі:
- Презентує команду як digital/IT-студію
- Показує послуги та кейси
- Веде спільний та особисті блоги
- Має авторизацію для власників та підписників

---

## Brand Kit

### Кольори
```
Primary Navy:    #0f2747
Primary Blue:    #1f4e8c
Accent Orange:   #f36f21
Light Gray:      #f3f4f6
White:           #ffffff

Night mode:
  Background:    #0a1628
  Surface:       #0d1f3c
  Text:          #e8edf5
  Border:        #1f4e8c (30% opacity)
  Accent:        #f36f21 (без змін)
```

### Типографіка
```
Заголовки: Montserrat (700, 600)
Тіло:      Inter (400, 500)
```

### Логотип
Файли в: `sours/infoforsite/img/cote-lapyx-complete-brand-kit/`
- `logo.svg` — основний SVG логотип
- `logo-vector.svg` — векторний варіант
- `logo-animated.svg` — анімований SVG
- `cote-lapyx-logo-clean.png` — PNG прозорий фон
- `favicon.ico` + PNG іконки: 16, 32, 48, 64, 128, 180, 192, 512px
- `cote-lapyx-og-1200x630.png` — OpenGraph зображення
- `logo-hover.css` — CSS анімація hover
- `site.webmanifest` — PWA маніфест

### Фото учасників
```
sours/infoforsite/img/valerii_img/valerka.png
sours/infoforsite/img/serhii_img/
sours/infoforsite/img/andrii_img/cote-lapyx.png
```

---

## Структура сайту

### Публічна частина
```
/                           — Головна
/about                      — Про нас
/team                       — Команда
/services                   — Послуги
/projects                   — Проекти
/projects/[slug]            — Сторінка проекту
/blog                       — Спільний блог
/blog/[slug]                — Стаття спільного блогу
/members/valerii            — Особиста сторінка Валерія
/members/serhii             — Особиста сторінка Сергія
/members/andrii             — Особиста сторінка Андрія
/members/[slug]/blog        — Особистий блог учасника
/members/[slug]/blog/[slug] — Стаття особистого блогу
/contact                    — Контакти
/login                      — Вхід
/register                   — Реєстрація
```

### Особистий кабінет — Owner
```
/dashboard
/dashboard/profile
/dashboard/posts
/dashboard/projects
/dashboard/comments
/dashboard/subscribers
```

### Особистий кабінет — Subscriber
```
/dashboard
/dashboard/profile
/dashboard/comments
/dashboard/subscriptions
/dashboard/favorites
```

### Адмінка (тільки owner)
```
/admin
/admin/users
/admin/posts
/admin/projects
/admin/categories
/admin/tags
/admin/messages        — contact_messages
/admin/settings
```

---

## Сторінки — Блоки контенту

### Головна (/)
1. **Header** — логотип, навігація, мовний перемикач (UA/EN/FR/DE), день/ніч, кнопка Login
2. **Hero** — назва "Cote Lapyx", позиціонування, кнопки: [Послуги] [Проекти] [Блог] [Зв'язатись]
3. **Про нас** — хто ми, чим займаємось
4. **Наша команда** — 3 картки учасників
5. **Послуги** — Web розробка / Backend & API / UI/UX дизайн
6. **Вибрані проекти** — 3 картки проектів
7. **Спільний блог** — 3 останніх статті
8. **Соцмережі та месенджери** — Telegram, Instagram, LinkedIn, GitHub, Email
9. **Footer** — логотип, навігація, копірайт, контакти

### Особиста сторінка (/members/[slug])
1. Hero — фото, ім'я, роль, коротке біо, кнопки соцмереж
2. Навички та технології — badge/теги стеку
3. Особисте портфоліо — сітка проектів
4. Особистий блог — список статей
5. Контакт

### Спільний блог (/blog)
- Фільтр: категорії + теги + пошук
- Сітка карток статей (3 в ряд desktop, 1 mobile)
- Пагінація

### Стаття (/blog/[slug])
- Cover image
- Заголовок, автор, дата, категорія
- Контент статті
- Теги
- Коментарі
- Схожі статті

### Проекти (/projects)
- Фільтр: по учаснику / технології / типу
- Сітка карток проектів

### Авторизація (/login, /register)
- Centered card на темному фоні
- Логотип
- Форма, CTA кнопка
- Розподіл ролей: owner / subscriber

### Dashboard — Owner (/dashboard)
- Sidebar навігація
- Статистика, останні пости, останні проекти
- Швидке редагування профілю

### Dashboard — Subscriber (/dashboard)
- Sidebar навігація
- Профіль користувача
- Мої коментарі
- Мої підписки
- Обране

---

## Технічний стек

### Frontend (Валерія + Claude)
```
HTML5 / CSS3 / SASS / JavaScript (ES6+)
Збірник: FLS Start (Vite)
Розташування: sours/cote-lapyx/
```

### Backend (Андрій + Сергій + Claude)
```
Java Spring Boot
REST API
Spring Security + JWT авторизація
Swagger/OpenAPI документація
```

### База даних
```
PostgreSQL
```

### Деплой
```
Ubuntu VPS
Nginx
Docker + docker-compose
SSL: Let's Encrypt
```

### Мультиязичність
```
Основна мова: Українська (UA)
Додаткові: EN, FR, DE

Архітектура (два рівні):

1. Статичний UI (кнопки, мітки, навігація, заголовки секцій)
   Реалізація: data-i18n атрибути + JSON файли на фронтенді
     /js/i18n/uk.json
     /js/i18n/en.json
     /js/i18n/fr.json
     /js/i18n/de.json

2. Динамічний контент (пости блогу, проекти, профілі, описи)
   Реалізація: таблиця translations в PostgreSQL, отримання через API
   Редагування через адмінку (власниками)
```

---

## База даних — Схема таблиць

```sql
-- Користувачі
users (id, name, email, password_hash, role, avatar, bio, skills, social_links, created_at, updated_at)
  role: 'owner' | 'subscriber'

-- Учасники команди
team_members (id, user_id, slug, profession, short_description, full_description, technologies, portfolio_visible)

-- Блог пости
blog_posts (id, author_id, type, title, slug, excerpt, content, cover_image, status, published_at, created_at, updated_at)
  type: 'general' | 'personal'

-- Категорії та теги
categories (id, name, slug)
tags (id, name, slug)
post_categories (post_id, category_id)
post_tags (post_id, tag_id)

-- Проекти
projects (id, author_id, title, slug, short_description, full_description, cover_image, gallery, technologies, project_url, github_url, status, created_at, updated_at)

-- Коментарі
comments (id, post_id, user_id, content, status, created_at)

-- Підписки
subscriptions (id, user_id, email, type, status, plan, created_at, expires_at)
  type: 'general' | 'personal'
  status: 'active' | 'cancelled' | 'expired'

-- Refresh токени (JWT)
refresh_tokens (id, user_id, token_hash, expires_at, created_at, revoked_at)

-- Контакти команди
contacts (id, type, value, label)

-- Форма зворотного зв'язку
contact_messages (id, name, email, subject, message, status, created_at)
  status: 'new' | 'read' | 'replied'

-- Переклади (динамічний контент: пости, проекти, профілі)
translations (id, entity_type, entity_id, locale, field, value)
  locale: 'uk' | 'en' | 'fr' | 'de'
```

---

## Авторизація та ролі

### Owner (власники — 3 учасники)
- Вхід в адмін-панель
- Створення та редагування: блогів, проектів, профілів, коментарів, контенту

### Subscriber (підписники — гості)
- Реєстрація / вхід
- Підписка на оновлення
- Коментарі до статей
- Обране
- Профіль користувача

---

## Соцмережі

- Telegram
- Instagram
- LinkedIn
- GitHub
- Email
- (опційно) Discord / WhatsApp / Behance

---

## Промт для Figma макету

```
Create a professional Figma UI design system and full website mockup for "Cote Lapyx" —
a team website for 3 IT professionals (web developer, Java/C# backend developer,
UI/UX designer).

BRAND IDENTITY
Colors:
  Primary Navy:    #0f2747
  Primary Blue:    #1f4e8c
  Accent Orange:   #f36f21
  Light Gray:      #f3f4f6
  White:           #ffffff
  Dark (night):    #0a1628
  Surface dark:    #0d1f3c

Typography:
  Headings: Montserrat (700, 600)
  Body:     Inter (400, 500)

Design style:
  - Modern, clean, professional IT/tech aesthetic
  - Geometric subtle background elements (grid, dots, code-like patterns)
  - Smooth gradients from Navy to Blue
  - Orange used only as accent/CTA
  - Cards with subtle shadows and border-radius 12–16px
  - Day / Night mode for ALL screens

DESIGN SYSTEM (create as components):
1. Colors & Typography styles
2. Button variants: Primary, Secondary, Ghost, Icon
3. Navigation: Header (desktop + mobile hamburger)
4. Footer component
5. Team member card (photo, name, role, skills, social links)
6. Blog post card (cover, category, title, excerpt, date, author)
7. Project card (cover, title, tech stack tags, links)
8. Skill badge / tag component
9. Language switcher: UA / EN / FR / DE
10. Day/Night toggle switch
11. Section titles (with decorative orange accent line)
12. Social media icon set (Telegram, Instagram, LinkedIn, GitHub, Email)

PAGES TO DESIGN (Desktop 1440px + Tablet 768px + Mobile 375px):

PAGE 1 — HOME (/)
  Header: logo "COTE LAPYX" left, nav links center,
    language switcher + day/night toggle + Login button right
  Hero: full-width navy-to-blue gradient, large heading "Cote Lapyx",
    subtitle "Команда IT-професіоналів",
    3 CTA buttons: [Наші послуги] [Проекти] [Блог]
    + animated geometric/code background decoration
  About us: 2-column, text left, visual right
  Our Team: 3 cards (Валерія — верстка, Сергій — Java/C#, Андрій — дизайн),
    each with photo, name, role, skill tags, [Особиста сторінка] button
  Services: 3 columns with icon + title + description
  Featured Projects: 3 project cards
  General Blog: 3 recent blog post cards
  Social & Contacts: centered row of social icons
  Footer: logo, nav links, copyright, language, contacts

PAGE 2 — PERSONAL PAGE (/members/valerii) — template for all 3 members
  Hero: photo/avatar left, name + role + bio right, skill badges, social buttons
  Skills & Technologies: visual skill bars or tag cloud
  Personal Portfolio: grid of project cards
  Personal Blog: list of blog posts
  Contact section

PAGE 3 — BLOG (/blog)
  Filter bar: categories + tags + search
  Grid of blog cards (3 per row desktop, 1 per row mobile)
  Pagination

PAGE 4 — SINGLE POST (/blog/[slug])
  Cover image full width
  Title, author, date, category, article content, tags, comments, related posts

PAGE 5 — PROJECTS (/projects)
  Filter: by member / technology / type
  Grid of project cards

PAGE 6 — AUTH (/login, /register)
  Centered card on dark/gradient background
  Logo, form fields, CTA button, role hint

PAGE 7 — DASHBOARD (/dashboard)
  Sidebar navigation
  Content area with stats, recent posts, recent projects
  Profile quick edit

NIGHT MODE — Dark variants for all pages:
  Background: #0a1628, Surface: #0d1f3c, Text: #e8edf5,
  Border: #1f4e8c (30% opacity), Accent: #f36f21

FIGMA FILE STRUCTURE:
  📐 Design System
  🏠 Home — Desktop / Mobile
  👤 Member Page — Desktop / Mobile
  📝 Blog — Desktop / Mobile
  📄 Single Post — Desktop
  🗂 Projects — Desktop
  🔐 Auth (Login / Register)
  📊 Dashboard

Frames: 1440px desktop, 768px tablet, 375px mobile.
Auto Layout everywhere. Figma Variables for colors (day/night modes).
```

---

## Інструменти розробки

### FLS Start (Vite шаблон)
```
Розташування: sours/cote-lapyx/
Запуск dev:   npm run dev
Збірка:       npm run build
Новий компонент: npm run add
Нова сторінка:   npm run new
```

### Структура src/
```
src/
├── index.html
├── assets/          — зображення, svg, шрифти
├── components/      — HTML компоненти
├── styles/          — SCSS файли
├── js/              — JavaScript файли
│   └── i18n/        — файли мов (uk.json, en.json, fr.json, de.json)
├── pug/             — Pug шаблони (опційно)
└── php/             — PHP файли (опційно)
```

---

## Етапи розробки

### Етап 1 — Проектування (поточний)
- [x] Концепція сайту
- [x] Brand Kit (кольори, логотип, шрифти)
- [ ] Figma макет — Desktop + Mobile (Андрій)
- [ ] Карта сайту затверджена

### Етап 1.5 — API Contract (Андрій + Сергій)
- [ ] Андрій описує всі REST ендпоінти у форматі OpenAPI/Swagger
- [ ] Структура запитів і відповідей для: auth, users, posts, projects, comments, subscriptions, translations
- [ ] Затверджений контракт зберігається як `API-v1` в документації
- [ ] Після затвердження: Frontend і Backend можуть працювати паралельно без блокерів

### Етап 2 — Дизайн (Claude Figma Agent)
- [ ] UI Kit в Figma (компоненти)
- [ ] Макети Desktop 1440px
- [ ] Макети Tablet 768px
- [ ] Макети Mobile 375px
- [ ] Day/Night варіанти
- [ ] Затвердження макету Валерієм

### Етап 3 — Frontend верстка (Валерія)
- [ ] Налаштування FLS Start
- [ ] Базові компоненти (header, footer, картки)
- [ ] Головна сторінка
- [ ] Особисті сторінки
- [ ] Блог + стаття
- [ ] Проекти
- [ ] Авторизація
- [ ] Dashboard
- [ ] Мультиязичність (uk/en/fr/de) — статичний UI через JSON
- [ ] День/Ніч режим
- [ ] Адаптив (mobile 375px / tablet 768px / desktop 1440px)
- [ ] SEO: мета-теги per-page, OpenGraph, JSON-LD (команда, блог)
- [ ] sitemap.xml + robots.txt

### Етап 4 — Backend (Сергій)
- [ ] Spring Boot проект
- [ ] PostgreSQL схема БД
- [ ] REST API (CRUD для блогів, проектів, юзерів)
- [ ] JWT авторизація + Spring Security
- [ ] Ролі: owner / subscriber
- [ ] Swagger документація
- [ ] Docker + docker-compose

### Етап 5 — Інтеграція
- [ ] Підключення фронтенду до API
- [ ] Авторизація на фронтенді
- [ ] Dashboard функціонал
- [ ] Мультиязичність через API

### Етап 6 — Тестування
- [ ] Функціональне тестування
- [ ] Адаптивність
- [ ] Продуктивність
- [ ] Безпека

### Етап 7 — Деплой
- [ ] Ubuntu VPS налаштування
- [ ] Nginx конфігурація
- [ ] Docker деплой
- [ ] SSL (Let's Encrypt)
- [ ] Домен cote-lapyx.com

---

## Figma файли

- Поточний файл: https://www.figma.com/design/pcoePj3RiNvVqV6Sv0xEz5/cote
- Попередній варіант: https://www.figma.com/design/DCS7hzwy6cYg4Y1nfJMyzr/Untitled

---

*Документ: PROJECT.md | Проект: cote-lapyx.com | Основна мова: Українська*
