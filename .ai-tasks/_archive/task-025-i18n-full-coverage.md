# Task 025 — Full i18n Coverage: All Pages

## Meta

- **Date:** 2026-05-15
- **Project:** cote-lapyx (frontend)
- **Branch:** feature/component-025-i18n-full-coverage
- **Agent:** Codex (executor)
- **Created by:** Claude Code

---

## Project Context

- **Path:** /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
- **Stack:** HTML, SCSS, JS, Vite (FLS template)
- **Build command:** npm run build
- **Config files (DO NOT TOUCH):** vite.config.js, .env, src/styles/

---

## Goal

Add `data-i18n` / `data-i18n-aria` / `data-i18n-placeholder` attributes to ALL static UI text on all public pages, and add the corresponding translation keys to all 4 JSON files (uk/en/fr/de).

---

## Background

The project has an i18n system in `src/js/i18n.js`:

- `data-i18n="key"` → `el.textContent = t[key]`
- `data-i18n-aria="key"` → `el.setAttribute("aria-label", t[key])`
- Translation files: `src/i18n/uk.json`, `en.json`, `fr.json`, `de.json`

`applyTranslations(lang)` in i18n.js does NOT yet handle `data-i18n-placeholder`. It needs to be added.

Existing keys already in uk.json (DO NOT duplicate):

- nav.home, nav.about, nav.team, nav.services, nav.projects, nav.blog, nav.contact
- header.login, header.dashboard, header.open_menu, header.close_menu, header.theme_toggle
- footer.tagline, footer.nav_title, footer.contacts_title, footer.copyright
- btn.view_profile, btn.our_services, btn.projects, btn.connect, btn.all_projects, btn.read_more
- index.about.title, index.team.title, index.team.subtitle, index.services.title, index.services.subtitle, index.projects.title, index.projects.subtitle, index.blog.title

---

## Requirements

### STEP 1 — Extend i18n.js to handle data-i18n-placeholder

File: `src/js/i18n.js`

In the `applyTranslations(lang)` function, after the existing `data-i18n-aria` block, add:

```js
// Apply placeholder text to all elements with data-i18n-placeholder attribute
document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
  const key = el.dataset.i18nPlaceholder;
  if (t[key] !== undefined) {
    el.setAttribute("placeholder", t[key]);
  }
});
```

---

### STEP 2 — Add new keys to ALL 4 JSON files

Add these keys to `src/i18n/uk.json`, `en.json`, `fr.json`, `de.json`.
Keep existing keys untouched. Add new keys at the end of the relevant group or as new groups.

#### uk.json additions:

```json
  "ui.loading": "Завантаження...",
  "ui.load_more": "Завантажити ще",
  "filter.all": "Всі",
  "btn.write_us": "Написати нам",
  "btn.our_projects": "Наші проекти",
  "btn.discuss_project": "Обговорити проект",

  "about.hero.title": "Про нас",
  "about.hero.subtitle": "Від першого пікселя до фінального деплою — одна команда",
  "about.mission.title": "Наша місія",
  "about.mission.body": "Ми — cote-lapyx: команда, яку обʼєднує одне — любов до коду, дизайну і продуктів, що реально працюють. Ми будуємо цифрові продукти повного циклу: від концепції та дизайну до серверної логіки і підтримки. Frontend, backend, UI/UX — три ролі, одна команда, один стандарт якості. Програмуємо, проектуємо і запускаємо — від першого пікселя до фінального деплою.",
  "about.stat.specialists": "Спеціалісти",
  "about.stat.projects": "Проектів",
  "about.stat.founding_year": "Рік ідеї",
  "about.values.title": "Наші цінності",
  "about.value1.title": "Повний цикл — наша зона відповідальності",
  "about.value1.desc": "Ми думаємо про продукт цілісно: від wireframe до production-сервера. Кожна функція, кожен компонент, кожен піксель — результат свідомого рішення.",
  "about.value2.title": "Постійне зростання — не опція, а звичка",
  "about.value2.desc": "Ми вчимось, експериментуємо і впроваджуємо нове — тому що стояти на місці в IT означає відставати.",
  "about.value3.title": "Код — це ремесло",
  "about.value3.desc": "Ми ставимось до кожного рядка коду як до продуманого рішення. Читабельність, тестованість, архітектура — не бонус, а мінімальний стандарт.",
  "about.value4.title": "Команда сильніша за суму її учасників",
  "about.value4.desc": "Frontend, backend і дизайн — єдиний організм, де рішення приймаються разом. Три ролі, одна відповідальність, один результат.",
  "about.team.title": "Команда",
  "about.timeline.title": "Наш шлях",
  "about.timeline.2019.heading": "Ідея",
  "about.timeline.2019.desc": "Перші розмови про власний проект, перші спільні задачі.",
  "about.timeline.2023.heading": "Розробка",
  "about.timeline.2023.desc": "Накопичення досвіду, стек, практика на реальних проектах.",
  "about.timeline.2026.heading": "Заснування",
  "about.timeline.2026.desc": "cote-lapyx офіційно стартує як IT-студія.",

  "blog.hero.title": "Блог",
  "blog.hero.subtitle": "Думки, досвід і технічні нотатки команди cote-lapyx",
  "blog.filter.category_label": "Категорія:",
  "blog.filter.search_placeholder": "Пошук статей...",
  "blog.filter.search_aria": "Пошук статей",

  "projects.hero.title": "Проекти",
  "projects.hero.subtitle": "Що ми побудували — від ідеї до продакшену",
  "projects.filter.stack_label": "Стек:",
  "projects.filter.search_placeholder": "Пошук проектів...",
  "projects.filter.search_aria": "Пошук проектів",

  "services.hero.title": "Наші послуги",
  "services.hero.subtitle": "Повний цикл розробки — від ідеї до готового продукту",
  "services.section.title": "Що ми робимо",
  "services.card1.title": "Веб-розробка",
  "services.card1.desc": "Сайти будь-якої складності: від лендінгу до повноцінного вебзастосунку.",
  "services.card2.title": "Лендінги та промо-сторінки",
  "services.card2.desc": "Конверсійні односторінкові сайти під продукт, подію або бізнес.",
  "services.card3.title": "REST API та бекенд-розробка",
  "services.card3.desc": "Серверна логіка, API, мікросервіси на Spring Boot. Надійно і масштабовано.",
  "services.card4.title": "UI/UX проектування",
  "services.card4.desc": "Дизайн інтерфейсів у Figma: від вайрфрейму до готового макету.",
  "services.card5.title": "Telegram-боти",
  "services.card5.desc": "Боти під будь-яку задачу: підтримка, розсилки, автоматизація.",
  "services.card5.badge": "Автоматизація",
  "services.card6.title": "AI-інтеграції",
  "services.card6.desc": "Підключення ChatGPT, Claude, Gemini та інших LLM до продукту або сайту.",
  "services.card7.title": "Адаптивна верстка",
  "services.card7.desc": "Mobile-First верстка під усі пристрої: від 320px до широких екранів.",
  "services.card8.title": "WordPress-сайти",
  "services.card8.desc": "Розробка та кастомізація сайтів на WordPress зі своїм дизайном.",
  "services.card9.title": "Технічна підтримка",
  "services.card9.desc": "Моніторинг, оновлення, виправлення помилок після запуску.",
  "services.card10.title": "Технічна консультація",
  "services.card10.desc": "Допомога з архітектурою, вибором стеку, аудит коду або продукту.",
  "services.pricing.title": "Ціни",
  "services.pricing.desc": "Вартість залежить від складності і обсягу задачі. Ми не публікуємо прайс-лист — кожен проект унікальний. Напиши нам, розкажи свою задачу — і ми запропонуємо рішення.",
  "services.pricing.btn": "Обговорити проект",
  "services.cta.heading": "Маєш ідею?",
  "services.cta.subtext": "Розкажи нам — знайдемо рішення разом.",

  "team.hero.title": "Наша Команда",
  "team.hero.subtitle": "Три спеціалісти з різними суперсилами — один злагоджений результат",
  "team.skills.title": "Технічні навички",

  "member.skills.title": "Технічні навички",
  "member.projects.title": "Особисті проекти",
  "member.posts.title": "Статті",
  "member.cta.heading": "Хочете співпрацювати?",
  "member.cta.subheading": "Відкрита до нових проектів та фрілансу. Пишіть — обговоримо!",
  "member.cta.btn": "Написати",

  "post.breadcrumb.back": "← Блог",
  "post.action.like_aria": "Подобається",
  "post.action.fav": "Обране",
  "post.action.fav_aria": "Додати в обране",
  "post.action.sub": "Підписатися",
  "post.action.sub_aria": "Підписатися",
  "post.subscribe.btn": "Підписатися",
  "post.comments.title": "Коментарі",
  "post.comments.placeholder": "Напишіть коментар...",
  "post.comments.submit": "Надіслати",
  "post.comments.empty": "Коментарів ще немає. Будьте першим!",
  "post.not_found": "Статтю не знайдено.",
  "post.not_found.back": "← Повернутись до блогу",

  "project.breadcrumb.back": "← Проекти",
  "project.sidebar.tech_title": "Технології",
  "project.not_found": "Проект не знайдено.",
  "project.not_found.back": "← Повернутись до проектів"
```

#### en.json additions:

```json
  "ui.loading": "Loading...",
  "ui.load_more": "Load more",
  "filter.all": "All",
  "btn.write_us": "Write to us",
  "btn.our_projects": "Our Projects",
  "btn.discuss_project": "Discuss project",

  "about.hero.title": "About us",
  "about.hero.subtitle": "From the first pixel to the final deploy — one team",
  "about.mission.title": "Our Mission",
  "about.mission.body": "We are cote-lapyx: a team united by one thing — a love for code, design, and products that actually work. We build full-cycle digital products: from concept and design to server logic and support. Frontend, backend, UI/UX — three roles, one team, one quality standard. We code, design, and launch — from the first pixel to the final deploy.",
  "about.stat.specialists": "Specialists",
  "about.stat.projects": "Projects",
  "about.stat.founding_year": "Year of idea",
  "about.values.title": "Our Values",
  "about.value1.title": "Full cycle — our responsibility",
  "about.value1.desc": "We think about the product holistically: from wireframe to production server. Every feature, every component, every pixel — the result of a conscious decision.",
  "about.value2.title": "Constant growth — not an option, but a habit",
  "about.value2.desc": "We learn, experiment, and implement new things — because standing still in IT means falling behind.",
  "about.value3.title": "Code is a craft",
  "about.value3.desc": "We treat every line of code as a deliberate decision. Readability, testability, architecture — not a bonus, but a minimum standard.",
  "about.value4.title": "The team is stronger than the sum of its parts",
  "about.value4.desc": "Frontend, backend, and design — a single organism where decisions are made together. Three roles, one responsibility, one result.",
  "about.team.title": "Team",
  "about.timeline.title": "Our Journey",
  "about.timeline.2019.heading": "Idea",
  "about.timeline.2019.desc": "First talks about our own project, first shared tasks.",
  "about.timeline.2023.heading": "Development",
  "about.timeline.2023.desc": "Building experience, stack, practice on real projects.",
  "about.timeline.2026.heading": "Founded",
  "about.timeline.2026.desc": "cote-lapyx officially launches as an IT studio.",

  "blog.hero.title": "Blog",
  "blog.hero.subtitle": "Thoughts, experience, and technical notes from the cote-lapyx team",
  "blog.filter.category_label": "Category:",
  "blog.filter.search_placeholder": "Search articles...",
  "blog.filter.search_aria": "Search articles",

  "projects.hero.title": "Projects",
  "projects.hero.subtitle": "What we built — from idea to production",
  "projects.filter.stack_label": "Stack:",
  "projects.filter.search_placeholder": "Search projects...",
  "projects.filter.search_aria": "Search projects",

  "services.hero.title": "Our Services",
  "services.hero.subtitle": "Full development cycle — from idea to finished product",
  "services.section.title": "What we do",
  "services.card1.title": "Web Development",
  "services.card1.desc": "Websites of any complexity: from landing page to full web application.",
  "services.card2.title": "Landing & Promo Pages",
  "services.card2.desc": "High-conversion single-page sites for products, events, or business.",
  "services.card3.title": "REST API & Backend Development",
  "services.card3.desc": "Server logic, APIs, microservices on Spring Boot. Reliable and scalable.",
  "services.card4.title": "UI/UX Design",
  "services.card4.desc": "Interface design in Figma: from wireframe to final mockup.",
  "services.card5.title": "Telegram Bots",
  "services.card5.desc": "Bots for any task: support, newsletters, automation.",
  "services.card5.badge": "Automation",
  "services.card6.title": "AI Integrations",
  "services.card6.desc": "Integration of ChatGPT, Claude, Gemini, and other LLMs into your product or website.",
  "services.card7.title": "Responsive Layout",
  "services.card7.desc": "Mobile-First layout for all devices: from 320px to wide screens.",
  "services.card8.title": "WordPress Sites",
  "services.card8.desc": "Development and customization of WordPress sites with custom design.",
  "services.card9.title": "Technical Support",
  "services.card9.desc": "Monitoring, updates, bug fixes after launch.",
  "services.card10.title": "Technical Consulting",
  "services.card10.desc": "Help with architecture, stack selection, code or product audit.",
  "services.pricing.title": "Pricing",
  "services.pricing.desc": "The cost depends on the complexity and scope of the task. We do not publish a price list — every project is unique. Write to us, tell us your task — and we will propose a solution.",
  "services.pricing.btn": "Discuss project",
  "services.cta.heading": "Have an idea?",
  "services.cta.subtext": "Tell us — we will find a solution together.",

  "team.hero.title": "Our Team",
  "team.hero.subtitle": "Three specialists with different superpowers — one cohesive result",
  "team.skills.title": "Technical Skills",

  "member.skills.title": "Technical Skills",
  "member.projects.title": "Personal Projects",
  "member.posts.title": "Articles",
  "member.cta.heading": "Want to collaborate?",
  "member.cta.subheading": "Open to new projects and freelance work. Write to us — let's discuss!",
  "member.cta.btn": "Write",

  "post.breadcrumb.back": "← Blog",
  "post.action.like_aria": "Like",
  "post.action.fav": "Favorite",
  "post.action.fav_aria": "Add to favorites",
  "post.action.sub": "Subscribe",
  "post.action.sub_aria": "Subscribe",
  "post.subscribe.btn": "Subscribe",
  "post.comments.title": "Comments",
  "post.comments.placeholder": "Write a comment...",
  "post.comments.submit": "Submit",
  "post.comments.empty": "No comments yet. Be the first!",
  "post.not_found": "Article not found.",
  "post.not_found.back": "← Back to blog",

  "project.breadcrumb.back": "← Projects",
  "project.sidebar.tech_title": "Technologies",
  "project.not_found": "Project not found.",
  "project.not_found.back": "← Back to projects"
```

#### fr.json additions:

```json
  "ui.loading": "Chargement...",
  "ui.load_more": "Charger plus",
  "filter.all": "Tous",
  "btn.write_us": "Nous écrire",
  "btn.our_projects": "Nos Projets",
  "btn.discuss_project": "Discuter du projet",

  "about.hero.title": "À propos",
  "about.hero.subtitle": "Du premier pixel au déploiement final — une seule équipe",
  "about.mission.title": "Notre Mission",
  "about.mission.body": "Nous sommes cote-lapyx : une équipe unie par une chose — l'amour du code, du design et des produits qui fonctionnent vraiment. Nous créons des produits numériques complets : de la conception et du design à la logique serveur et au support. Frontend, backend, UI/UX — trois rôles, une équipe, un standard de qualité. Nous codons, concevons et lançons — du premier pixel au déploiement final.",
  "about.stat.specialists": "Spécialistes",
  "about.stat.projects": "Projets",
  "about.stat.founding_year": "Année de l'idée",
  "about.values.title": "Nos Valeurs",
  "about.value1.title": "Cycle complet — notre zone de responsabilité",
  "about.value1.desc": "Nous pensons le produit dans sa globalité : du wireframe au serveur de production. Chaque fonction, chaque composant, chaque pixel — le résultat d'une décision consciente.",
  "about.value2.title": "La croissance constante — pas une option, mais une habitude",
  "about.value2.desc": "Nous apprenons, expérimentons et innovons — parce que s'arrêter en IT signifie prendre du retard.",
  "about.value3.title": "Le code est un artisanat",
  "about.value3.desc": "Nous traitons chaque ligne de code comme une décision réfléchie. Lisibilité, testabilité, architecture — pas un bonus, mais un standard minimum.",
  "about.value4.title": "L'équipe est plus forte que la somme de ses membres",
  "about.value4.desc": "Frontend, backend et design — un seul organisme où les décisions sont prises ensemble. Trois rôles, une responsabilité, un résultat.",
  "about.team.title": "Équipe",
  "about.timeline.title": "Notre Parcours",
  "about.timeline.2019.heading": "Idée",
  "about.timeline.2019.desc": "Premières discussions sur notre propre projet, premières tâches communes.",
  "about.timeline.2023.heading": "Développement",
  "about.timeline.2023.desc": "Accumulation d'expérience, stack, pratique sur de vrais projets.",
  "about.timeline.2026.heading": "Fondation",
  "about.timeline.2026.desc": "cote-lapyx lance officiellement en tant que studio IT.",

  "blog.hero.title": "Blog",
  "blog.hero.subtitle": "Réflexions, expériences et notes techniques de l'équipe cote-lapyx",
  "blog.filter.category_label": "Catégorie :",
  "blog.filter.search_placeholder": "Rechercher des articles...",
  "blog.filter.search_aria": "Rechercher des articles",

  "projects.hero.title": "Projets",
  "projects.hero.subtitle": "Ce que nous avons construit — de l'idée à la production",
  "projects.filter.stack_label": "Stack :",
  "projects.filter.search_placeholder": "Rechercher des projets...",
  "projects.filter.search_aria": "Rechercher des projets",

  "services.hero.title": "Nos Services",
  "services.hero.subtitle": "Cycle de développement complet — de l'idée au produit fini",
  "services.section.title": "Ce que nous faisons",
  "services.card1.title": "Développement Web",
  "services.card1.desc": "Sites web de toute complexité : du landing page à l'application web complète.",
  "services.card2.title": "Landing & Pages Promo",
  "services.card2.desc": "Sites monopages à forte conversion pour produit, événement ou entreprise.",
  "services.card3.title": "REST API & Développement Backend",
  "services.card3.desc": "Logique serveur, APIs, microservices sur Spring Boot. Fiable et évolutif.",
  "services.card4.title": "Design UI/UX",
  "services.card4.desc": "Design d'interfaces dans Figma : du wireframe à la maquette finale.",
  "services.card5.title": "Bots Telegram",
  "services.card5.desc": "Bots pour toute tâche : support, newsletters, automatisation.",
  "services.card5.badge": "Automatisation",
  "services.card6.title": "Intégrations IA",
  "services.card6.desc": "Intégration de ChatGPT, Claude, Gemini et autres LLM dans votre produit ou site.",
  "services.card7.title": "Mise en page Responsive",
  "services.card7.desc": "Mise en page Mobile-First pour tous les appareils : de 320px aux grands écrans.",
  "services.card8.title": "Sites WordPress",
  "services.card8.desc": "Développement et personnalisation de sites WordPress avec design sur mesure.",
  "services.card9.title": "Support Technique",
  "services.card9.desc": "Surveillance, mises à jour, correction de bugs après le lancement.",
  "services.card10.title": "Conseil Technique",
  "services.card10.desc": "Aide à l'architecture, choix du stack, audit de code ou de produit.",
  "services.pricing.title": "Tarifs",
  "services.pricing.desc": "Le coût dépend de la complexité et de l'étendue de la tâche. Nous ne publions pas de grille tarifaire — chaque projet est unique. Écrivez-nous, décrivez votre tâche — et nous proposerons une solution.",
  "services.pricing.btn": "Discuter du projet",
  "services.cta.heading": "Vous avez une idée ?",
  "services.cta.subtext": "Dites-nous — nous trouverons une solution ensemble.",

  "team.hero.title": "Notre Équipe",
  "team.hero.subtitle": "Trois spécialistes avec des super-pouvoirs différents — un résultat cohérent",
  "team.skills.title": "Compétences Techniques",

  "member.skills.title": "Compétences Techniques",
  "member.projects.title": "Projets Personnels",
  "member.posts.title": "Articles",
  "member.cta.heading": "Vous souhaitez collaborer ?",
  "member.cta.subheading": "Ouverte aux nouveaux projets et au freelance. Écrivez-nous — discutons !",
  "member.cta.btn": "Écrire",

  "post.breadcrumb.back": "← Blog",
  "post.action.like_aria": "J'aime",
  "post.action.fav": "Favori",
  "post.action.fav_aria": "Ajouter aux favoris",
  "post.action.sub": "S'abonner",
  "post.action.sub_aria": "S'abonner",
  "post.subscribe.btn": "S'abonner",
  "post.comments.title": "Commentaires",
  "post.comments.placeholder": "Écrivez un commentaire...",
  "post.comments.submit": "Envoyer",
  "post.comments.empty": "Pas encore de commentaires. Soyez le premier !",
  "post.not_found": "Article introuvable.",
  "post.not_found.back": "← Retour au blog",

  "project.breadcrumb.back": "← Projets",
  "project.sidebar.tech_title": "Technologies",
  "project.not_found": "Projet introuvable.",
  "project.not_found.back": "← Retour aux projets"
```

#### de.json additions:

```json
  "ui.loading": "Laden...",
  "ui.load_more": "Mehr laden",
  "filter.all": "Alle",
  "btn.write_us": "Schreib uns",
  "btn.our_projects": "Unsere Projekte",
  "btn.discuss_project": "Projekt besprechen",

  "about.hero.title": "Über uns",
  "about.hero.subtitle": "Vom ersten Pixel bis zum finalen Deploy — ein Team",
  "about.mission.title": "Unsere Mission",
  "about.mission.body": "Wir sind cote-lapyx: ein Team, das durch eine Sache verbunden ist — die Liebe zu Code, Design und Produkten, die wirklich funktionieren. Wir entwickeln vollständige digitale Produkte: von Konzept und Design bis zur Serverlogik und Support. Frontend, Backend, UI/UX — drei Rollen, ein Team, ein Qualitätsstandard. Wir programmieren, gestalten und launchen — vom ersten Pixel bis zum finalen Deploy.",
  "about.stat.specialists": "Spezialisten",
  "about.stat.projects": "Projekte",
  "about.stat.founding_year": "Gründungsjahr",
  "about.values.title": "Unsere Werte",
  "about.value1.title": "Vollständiger Zyklus — unsere Verantwortungszone",
  "about.value1.desc": "Wir denken das Produkt ganzheitlich: vom Wireframe bis zum Produktionsserver. Jede Funktion, jede Komponente, jeder Pixel — das Ergebnis einer bewussten Entscheidung.",
  "about.value2.title": "Ständiges Wachstum — keine Option, sondern eine Gewohnheit",
  "about.value2.desc": "Wir lernen, experimentieren und setzen Neues um — denn Stillstand in der IT bedeutet Rückstand.",
  "about.value3.title": "Code ist ein Handwerk",
  "about.value3.desc": "Wir behandeln jede Codezeile als eine durchdachte Entscheidung. Lesbarkeit, Testbarkeit, Architektur — kein Bonus, sondern ein Mindeststandard.",
  "about.value4.title": "Das Team ist stärker als die Summe seiner Mitglieder",
  "about.value4.desc": "Frontend, Backend und Design — ein einziger Organismus, in dem Entscheidungen gemeinsam getroffen werden. Drei Rollen, eine Verantwortung, ein Ergebnis.",
  "about.team.title": "Team",
  "about.timeline.title": "Unser Weg",
  "about.timeline.2019.heading": "Idee",
  "about.timeline.2019.desc": "Erste Gespräche über das eigene Projekt, erste gemeinsame Aufgaben.",
  "about.timeline.2023.heading": "Entwicklung",
  "about.timeline.2023.desc": "Erfahrungsaufbau, Stack, Praxis an echten Projekten.",
  "about.timeline.2026.heading": "Gründung",
  "about.timeline.2026.desc": "cote-lapyx startet offiziell als IT-Studio.",

  "blog.hero.title": "Blog",
  "blog.hero.subtitle": "Gedanken, Erfahrungen und technische Notizen des cote-lapyx Teams",
  "blog.filter.category_label": "Kategorie:",
  "blog.filter.search_placeholder": "Artikel suchen...",
  "blog.filter.search_aria": "Artikel suchen",

  "projects.hero.title": "Projekte",
  "projects.hero.subtitle": "Was wir gebaut haben — von der Idee bis zur Produktion",
  "projects.filter.stack_label": "Stack:",
  "projects.filter.search_placeholder": "Projekte suchen...",
  "projects.filter.search_aria": "Projekte suchen",

  "services.hero.title": "Unsere Dienstleistungen",
  "services.hero.subtitle": "Vollständiger Entwicklungszyklus — von der Idee zum fertigen Produkt",
  "services.section.title": "Was wir tun",
  "services.card1.title": "Webentwicklung",
  "services.card1.desc": "Websites jeder Komplexität: vom Landing Page bis zur vollständigen Web-Anwendung.",
  "services.card2.title": "Landing & Promo-Seiten",
  "services.card2.desc": "Konversionsstarke einseitige Websites für Produkt, Veranstaltung oder Unternehmen.",
  "services.card3.title": "REST API & Backend-Entwicklung",
  "services.card3.desc": "Serverlogik, APIs, Microservices auf Spring Boot. Zuverlässig und skalierbar.",
  "services.card4.title": "UI/UX Design",
  "services.card4.desc": "Interface-Design in Figma: vom Wireframe bis zum fertigen Mockup.",
  "services.card5.title": "Telegram-Bots",
  "services.card5.desc": "Bots für jede Aufgabe: Support, Newsletter, Automatisierung.",
  "services.card5.badge": "Automatisierung",
  "services.card6.title": "KI-Integrationen",
  "services.card6.desc": "Integration von ChatGPT, Claude, Gemini und anderen LLMs in Ihr Produkt oder Ihre Website.",
  "services.card7.title": "Responsives Layout",
  "services.card7.desc": "Mobile-First Layout für alle Geräte: von 320px bis zu breiten Bildschirmen.",
  "services.card8.title": "WordPress-Websites",
  "services.card8.desc": "Entwicklung und Anpassung von WordPress-Websites mit eigenem Design.",
  "services.card9.title": "Technischer Support",
  "services.card9.desc": "Überwachung, Updates, Fehlerbehebung nach dem Launch.",
  "services.card10.title": "Technische Beratung",
  "services.card10.desc": "Hilfe bei Architektur, Stack-Auswahl, Code- oder Produktaudit.",
  "services.pricing.title": "Preise",
  "services.pricing.desc": "Die Kosten hängen von der Komplexität und dem Umfang der Aufgabe ab. Wir veröffentlichen keine Preisliste — jedes Projekt ist einzigartig. Schreib uns, beschreibe deine Aufgabe — und wir schlagen eine Lösung vor.",
  "services.pricing.btn": "Projekt besprechen",
  "services.cta.heading": "Haben Sie eine Idee?",
  "services.cta.subtext": "Erzählen Sie uns — wir finden gemeinsam eine Lösung.",

  "team.hero.title": "Unser Team",
  "team.hero.subtitle": "Drei Spezialisten mit verschiedenen Superkräften — ein geschlossenes Ergebnis",
  "team.skills.title": "Technische Fähigkeiten",

  "member.skills.title": "Technische Fähigkeiten",
  "member.projects.title": "Persönliche Projekte",
  "member.posts.title": "Artikel",
  "member.cta.heading": "Möchten Sie zusammenarbeiten?",
  "member.cta.subheading": "Offen für neue Projekte und Freelance-Arbeit. Schreiben Sie uns — wir besprechen es!",
  "member.cta.btn": "Schreiben",

  "post.breadcrumb.back": "← Blog",
  "post.action.like_aria": "Gefällt mir",
  "post.action.fav": "Favorit",
  "post.action.fav_aria": "Zu Favoriten hinzufügen",
  "post.action.sub": "Abonnieren",
  "post.action.sub_aria": "Abonnieren",
  "post.subscribe.btn": "Abonnieren",
  "post.comments.title": "Kommentare",
  "post.comments.placeholder": "Kommentar schreiben...",
  "post.comments.submit": "Senden",
  "post.comments.empty": "Noch keine Kommentare. Seien Sie der Erste!",
  "post.not_found": "Artikel nicht gefunden.",
  "post.not_found.back": "← Zurück zum Blog",

  "project.breadcrumb.back": "← Projekte",
  "project.sidebar.tech_title": "Technologien",
  "project.not_found": "Projekt nicht gefunden.",
  "project.not_found.back": "← Zurück zu den Projekten"
```

---

### STEP 3 — Wire data-i18n attributes in HTML files

#### src/components/layout/header/header.html

Add `data-i18n-aria="header.theme_toggle"` to the theme toggle button (remove the hardcoded `aria-label`):

```html
<!-- BEFORE -->
<button
  class="header__theme-toggle"
  id="theme-toggle"
  aria-label="Перемкнути тему"
  aria-pressed="true"
>
  <!-- AFTER -->
  <button
    class="header__theme-toggle"
    id="theme-toggle"
    data-i18n-aria="header.theme_toggle"
    aria-label="Перемкнути тему"
    aria-pressed="true"
  ></button>
</button>
```

Keep the hardcoded `aria-label` as SSR fallback.

#### src/components/pages/about/about.html

- `<h1 class="page-hero__heading">Про нас</h1>` → wrap in span: `<h1 class="page-hero__heading"><span data-i18n="about.hero.title">Про нас</span></h1>`
- `<p class="page-hero__subheading">Від першого пікселя...</p>` → add `data-i18n="about.hero.subtitle"` on the `<p>`
- `<h2 class="section-title" id="mission-title">Наша місія</h2>` → add `data-i18n="about.mission.title"` on `<h2>`
- `<p class="about-mission__body">Ми — cote-lapyx...</p>` → add `data-i18n="about.mission.body"` on `<p>`
- `<span class="about-mission__stat-label">Спеціалісти</span>` → add `data-i18n="about.stat.specialists"`
- `<span class="about-mission__stat-label">Проектів</span>` → add `data-i18n="about.stat.projects"`
- `<span class="about-mission__stat-label">Рік ідеї</span>` → add `data-i18n="about.stat.founding_year"`
- `<h2 class="section-title" id="values-title">Наші цінності</h2>` → add `data-i18n="about.values.title"`
- `<h3 class="value-card__title">Повний цикл — наша зона відповідальності</h3>` → add `data-i18n="about.value1.title"`
- `<p class="value-card__desc">Ми думаємо про продукт цілісно...</p>` (card 1) → add `data-i18n="about.value1.desc"`
- `<h3 class="value-card__title">Постійне зростання...</h3>` → add `data-i18n="about.value2.title"`
- `<p class="value-card__desc">Ми вчимось...</p>` (card 2) → add `data-i18n="about.value2.desc"`
- `<h3 class="value-card__title">Код — це ремесло</h3>` → add `data-i18n="about.value3.title"`
- `<p class="value-card__desc">Ми ставимось до кожного рядка...</p>` (card 3) → add `data-i18n="about.value3.desc"`
- `<h3 class="value-card__title">Команда сильніша за суму її учасників</h3>` → add `data-i18n="about.value4.title"`
- `<p class="value-card__desc">Frontend, backend і дизайн — єдиний організм...</p>` (card 4) → add `data-i18n="about.value4.desc"`
- `<h2 class="section-title" id="team-title">Команда</h2>` → add `data-i18n="about.team.title"`
- All 3 `<a ...>Повний профіль</a>` buttons → wrap text in span: `<span data-i18n="btn.view_profile">Повний профіль</span>`
- `<h2 class="section-title" id="timeline-title">Наш шлях</h2>` → add `data-i18n="about.timeline.title"`
- `<h3 class="about-timeline__heading">Ідея</h3>` → add `data-i18n="about.timeline.2019.heading"`
- `<p class="about-timeline__desc">Перші розмови...</p>` → add `data-i18n="about.timeline.2019.desc"`
- `<h3 class="about-timeline__heading">Розробка</h3>` → add `data-i18n="about.timeline.2023.heading"`
- `<p class="about-timeline__desc">Накопичення досвіду...</p>` → add `data-i18n="about.timeline.2023.desc"`
- `<h3 class="about-timeline__heading">Заснування</h3>` → add `data-i18n="about.timeline.2026.heading"`
- `<p class="about-timeline__desc">cote-lapyx офіційно стартує...</p>` → add `data-i18n="about.timeline.2026.desc"`
- `<a href="services.html" class="btn btn--cyan">Наші послуги</a>` → wrap: `<span data-i18n="btn.our_services">Наші послуги</span>`
- `<a href="contact.html" class="btn btn--magenta">Написати нам</a>` → wrap: `<span data-i18n="btn.write_us">Написати нам</span>`

#### src/components/pages/blog/blog.html

- `<h1 class="page-hero__heading">Блог</h1>` → wrap: `<h1 class="page-hero__heading"><span data-i18n="blog.hero.title">Блог</span></h1>`
- `<p class="page-hero__subheading">Думки, досвід...</p>` → add `data-i18n="blog.hero.subtitle"`
- `<span class="filter-bar__label">Категорія:</span>` → add `data-i18n="blog.filter.category_label"`
- `<button class="filter-bar__btn is-active" data-filter-cat="all">Всі</button>` → wrap: `<span data-i18n="filter.all">Всі</span>`
- `<input ... placeholder="Пошук статей..." aria-label="Пошук статей">` → add `data-i18n-placeholder="blog.filter.search_placeholder"` and `data-i18n-aria="blog.filter.search_aria"` (keep existing aria-label as fallback)
- `<li class="blog-page__loading" ...>Завантаження...</li>` → add `data-i18n="ui.loading"`
- `<button ... id="blog-load-more">Завантажити ще</button>` → wrap: `<span data-i18n="ui.load_more">Завантажити ще</span>`

#### src/components/pages/projects/projects.html

- `<h1 class="page-hero__heading">Проекти</h1>` → wrap: `<span data-i18n="projects.hero.title">Проекти</span>`
- `<p class="page-hero__subheading">Що ми побудували...</p>` → add `data-i18n="projects.hero.subtitle"`
- `<span class="filter-bar__label">Стек:</span>` → add `data-i18n="projects.filter.stack_label"`
- `<button class="filter-bar__btn is-active" data-filter-tech="">Всі</button>` → wrap: `<span data-i18n="filter.all">Всі</span>`
- `<input ... placeholder="Пошук проектів..." aria-label="Пошук проектів">` → add `data-i18n-placeholder="projects.filter.search_placeholder"` and `data-i18n-aria="projects.filter.search_aria"`
- `<li class="projects-page__loading" ...>Завантаження...</li>` → add `data-i18n="ui.loading"`
- `<button ... id="projects-load-more">Завантажити ще</button>` → wrap: `<span data-i18n="ui.load_more">Завантажити ще</span>`

#### src/components/pages/services/services.html

- `<h1 class="page-hero__heading">Наші послуги</h1>` → wrap: `<span data-i18n="services.hero.title">Наші послуги</span>`
- `<p class="page-hero__subheading">Повний цикл...</p>` → add `data-i18n="services.hero.subtitle"`
- `<h2 class="section-title" id="services-title">Що ми робимо</h2>` → add `data-i18n="services.section.title"`
- Cards 1-10: add `data-i18n` to each `<h3 class="service-card__title">` and `<p class="service-card__desc">` using keys services.card1.title through services.card10.title and services.card1.desc through services.card10.desc
- Card 5 badge `<span class="neon-badge ...">Автоматизація</span>` → add `data-i18n="services.card5.badge"`
- `<h2 ... id="pricing-title">Ціни</h2>` → add `data-i18n="services.pricing.title"`
- `<p class="services-pricing__text">Вартість залежить...</p>` → add `data-i18n="services.pricing.desc"`
- `<a href="contact.html" class="btn btn--cyan services-pricing__btn">Обговорити проект</a>` → wrap: `<span data-i18n="services.pricing.btn">Обговорити проект</span>`
- `<h2 class="services-cta__heading">Маєш ідею?</h2>` → add `data-i18n="services.cta.heading"`
- `<p class="services-cta__subtext">Розкажи нам...</p>` → add `data-i18n="services.cta.subtext"`
- `<a href="contact.html" class="btn btn--magenta">Написати нам</a>` → wrap: `<span data-i18n="btn.write_us">Написати нам</span>`
- `<a href="projects.html" class="btn btn--cyan">Наші проекти</a>` → wrap: `<span data-i18n="btn.our_projects">Наші проекти</span>`

#### src/components/pages/team/team.html

- `<h1 class="page-hero__heading">Наша Команда</h1>` → wrap: `<span data-i18n="team.hero.title">Наша Команда</span>`
- `<p class="page-hero__subheading">Три спеціалісти...</p>` → add `data-i18n="team.hero.subtitle"`
- All 3 `<h3>Технічні навички</h3>` inside `.team-page__skills-section` → add `data-i18n="team.skills.title"`
- All 3 `<a ...>Повний профіль</a>` buttons → wrap: `<span data-i18n="btn.view_profile">Повний профіль</span>`

#### src/components/pages/member/member.html

- `<h2 class="section-title" id="skills-heading">Технічні навички</h2>` → add `data-i18n="member.skills.title"`
- `<h2 class="section-title" id="portfolio-heading">Особисті проекти</h2>` → add `data-i18n="member.projects.title"`
- `<h2 class="section-title" id="posts-heading">Статті</h2>` → add `data-i18n="member.posts.title"`
- `<h2 class="cta__heading" id="member-contact-heading">Хочете співпрацювати?</h2>` → add `data-i18n="member.cta.heading"`
- `<p class="cta__subheading">Відкрита до нових проектів...</p>` → add `data-i18n="member.cta.subheading"`
- `<a href="mailto:..." class="btn btn--cyan btn--lg btn--pulse-cyan">Написати</a>` → wrap: `<span data-i18n="member.cta.btn">Написати</span>`

#### src/components/pages/post/post.html

- `<a href="blog.html" class="post-breadcrumb__link">&#8592; Блог</a>` → wrap text: `<span data-i18n="post.breadcrumb.back">← Блог</span>` (keep `&#8592;` or include it in the key value)

  Actually: the key `post.breadcrumb.back` already includes "← " in the value. So replace `&#8592; Блог` entirely with a span: `<a href="blog.html" class="post-breadcrumb__link"><span data-i18n="post.breadcrumb.back">← Блог</span></a>`

- `<h1 ... id="post-title">Завантаження...</h1>` → add `data-i18n="ui.loading"` (JS will overwrite once loaded)
- `<p class="post-article__loading">Завантаження...</p>` → add `data-i18n="ui.loading"`
- `<button ... id="post-like-btn" aria-label="Подобається">` → add `data-i18n-aria="post.action.like_aria"` (keep existing aria-label as fallback)
- `<button ... id="post-fav-btn" aria-label="Додати в обране">` → add `data-i18n-aria="post.action.fav_aria"`
- `<span>Обране</span>` inside fav btn → add `data-i18n="post.action.fav"`
- `<button ... id="post-sub-btn" aria-label="Підписатися">` → add `data-i18n-aria="post.action.sub_aria"`
- `<span>Підписатися</span>` inside sub btn → add `data-i18n="post.action.sub"`
- `<button type="submit" ... id="post-sub-submit">Підписатися</button>` → wrap: `<span data-i18n="post.subscribe.btn">Підписатися</span>`
- `<h2 class="post-comments__title">Коментарі</h2>` → add `data-i18n="post.comments.title"`
- `<textarea ... placeholder="Напишіть коментар...">` → add `data-i18n-placeholder="post.comments.placeholder"` (keep existing placeholder as fallback)
- `<button type="submit" ... id="post-comment-submit">Надіслати</button>` → wrap: `<span data-i18n="post.comments.submit">Надіслати</span>`
- `<p class="post-comments__empty" ...>Коментарів ще немає. Будьте першим!</p>` → add `data-i18n="post.comments.empty"`
- `<p class="post-not-found__msg">Статтю не знайдено.</p>` → add `data-i18n="post.not_found"`
- `<a href="blog.html" class="btn btn--cyan">&#8592; Повернутись до блогу</a>` → wrap: `<span data-i18n="post.not_found.back">← Повернутись до блогу</span>`

#### src/components/pages/project/project.html

- `<a href="projects.html" class="post-breadcrumb__link">&#8592; Проекти</a>` → wrap: `<span data-i18n="project.breadcrumb.back">← Проекти</span>`
- `<h1 ... id="project-title">Завантаження...</h1>` → add `data-i18n="ui.loading"`
- `<p class="post-article__loading">Завантаження...</p>` → add `data-i18n="ui.loading"`
- `<h2 class="project-detail__tech-title">Технології</h2>` → add `data-i18n="project.sidebar.tech_title"`
- `<p class="post-not-found__msg">Проект не знайдено.</p>` → add `data-i18n="project.not_found"`
- `<a href="projects.html" class="btn btn--cyan">&#8592; Повернутись до проектів</a>` → wrap: `<span data-i18n="project.not_found.back">← Повернутись до проектів</span>`

---

## Forbidden

- Do NOT modify: vite.config.js, src/styles/, src/js/auth.js, src/js/blog.js, src/js/post.js, src/js/projects.js, src/js/project.js, src/js/member.js, src/js/dashboard.js, src/js/fetchWithAuth.js
- Do NOT add features beyond this task scope
- Do NOT push to remote
- Do NOT modify any existing key values in JSON files
- Do NOT add data-i18n to dynamic content that comes from API (post titles, project names, team member names/bios)

---

## Acceptance Criteria

- [ ] `src/js/i18n.js` handles `data-i18n-placeholder` in `applyTranslations()`
- [ ] All 4 JSON files have all new keys with correct translations
- [ ] JSON files are valid JSON (no syntax errors)
- [ ] All listed HTML elements have correct data-i18n attributes
- [ ] `npm run build` passes without errors
- [ ] Git commit created

---

## Expected Commit Message

```
feat(i18n): add data-i18n coverage to all public pages

- Extend i18n.js with data-i18n-placeholder support
- Add 75+ translation keys to uk/en/fr/de JSON files
- Wire data-i18n to about, blog, projects, services, team, member, post, project pages
- Wire data-i18n-aria to header theme toggle and post action buttons
```

---

## Notes from Claude

- `btn.our_services`, `btn.view_profile`, `btn.connect`, `btn.all_projects`, `btn.read_more` already exist in JSON — reuse, don't duplicate
- `header.theme_toggle` key already exists in JSON — only add data-i18n-aria to HTML
- Do NOT translate member bio paragraphs (first-person personal texts in about.html team section)
- Do NOT translate team card bio paragraphs in team.html
- Do NOT translate skill bar label texts (JavaScript, HTML, etc.) — those are tech terms
- The &#8592; arrow character in breadcrumb links is included as "←" in the key value — wrap the entire link text including the arrow in the span
- For post.html `post-title` h1 and loading p: setting data-i18n="ui.loading" is correct because JS will replace textContent once data is fetched; the i18n "Завантаження..." is the initial placeholder that gets shown before API responds
