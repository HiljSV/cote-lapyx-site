[АВТОЗАПУСК 2026-05-31 00:31] Продовжити cote-lapyx Workstream 042 audit.

ПРОЧИТАТИ ПЕРШИМ:

- Plan: /home/hilj/.claude/plans/woolly-munching-scroll.md
- ~/notes/\_claude/outbox.md (3 останні сесійні звіти = стан гілок)
- Memory: project_cote_audit_042
- Frontend: /home/hilj/code/active/cote-lapyx_project/cote-lapyx (гілка integration/042-audit)
- Backend: /home/hilj/code/active/cote-lapyx_project/cote-lapyx-backend (гілка integration/042-audit)

ВИКОНАТИ ПО ПОРЯДКУ:

1. Workstream F (SEC-1): refresh-токен → httpOnly+Secure+SameSite cookie.
   Backend видає cookie; /auth/refresh читає cookie; access короткий у тілі/пам'яті.
   Frontend: прибрати cl_refresh з localStorage; fetchWithAuth credentials:'include'.
   Узгодити CORS/SameSite api.cote-lapyx.com↔cote-lapyx.com.
   Окремі feature-гілки back+front від integration/042-audit. Build/тести зелені.
   ОБОВ'ЯЗКОВО security-agent перевіряє F (auth-критична зміна).
2. dashboard.js JS-i18n консолідація (~44 рядки) + ключі в 4 JSON.
3. Інтеграційний QA: cote-lapyx-qa-reviewer Phase 2 (адаптив 320/768/1280).
4. E2E: playwright-e2e-agent (логін/refresh/logout після cookie-міграції, посилання, мови).

ЖОРСТКИЙ ЗАПОБІЖНИК — НЕ ДЕПЛОЇТИ САМОСТІЙНО:

- НЕ мерджити в main і НЕ деплоїти (merge у main = прод-деплой через CI/CD).
- Дійти до стану «все готово, гейти пройдені» і ЗУПИНИТИСЬ.
- Лишити в ~/notes/\_claude/inbox.md і outbox.md детальний звіт:
  що зроблено, результати security-agent/QA/E2E, і «ГОТОВО ДО ДЕПЛОЮ — чекаю підтвердження власника».
- Якщо будь-який гейт = NEEDS FIX/BLOCKED/UNSAFE → так само зупинитись і описати в inbox.md.
- Дотримуватись пайплайну ~/.claude/CLAUDE.md (fix-escalation, окремі гілки, ніяких прямих комітів у main).
- Якщо середовище зламане після оновлення ПК (npm/mvn/node) — зафіксувати в inbox.md і зупинитись.
