# Task 002 — cote-lapyx: Technical Analysis & Implementation Proposals

## Context

Project: cote-lapyx.com — team IT-studio website.
Stack: Spring Boot 3.3 backend (Java 21, JPA, PostgreSQL, JWT), HTML/SCSS/JS frontend (Vite/FLS).
Goal: Analyze user requirements from input file and produce detailed technical proposals.

## Input file to study

Read and analyze: /home/hilj/Desktop/cote-lapyx-input.md

## Existing code to study

Frontend:

- /home/hilj/code/active/cote-lapyx_project/cote-lapyx/src/team.html
- /home/hilj/code/active/cote-lapyx_project/cote-lapyx/src/member.html
- /home/hilj/code/active/cote-lapyx_project/cote-lapyx/src/js/dashboard.js (avatar/profile section)
- /home/hilj/code/active/cote-lapyx_project/cote-lapyx/src/js/auth.js (registration form)

Backend:

- /home/hilj/code/active/cote-lapyx_project/cote-lapyx-backend/src/main/java/com/cotelapyx/backend/service/UploadService.java
- /home/hilj/code/active/cote-lapyx_project/cote-lapyx-backend/src/main/java/com/cotelapyx/backend/controller/UploadController.java
- /home/hilj/code/active/cote-lapyx_project/cote-lapyx-backend/src/main/java/com/cotelapyx/backend/domain/entity/User.java
- /home/hilj/code/active/cote-lapyx_project/cote-lapyx-backend/src/main/java/com/cotelapyx/backend/service/UserService.java
- /home/hilj/code/active/cote-lapyx_project/cote-lapyx-backend/src/main/java/com/cotelapyx/backend/service/BlogPostService.java

## Output

Write your analysis to: /tmp/codex-cote-analysis.md

The document must cover these 5 topics with concrete technical proposals:

### 1. Avatar system

How to implement: upload → auto-process (webp, resize 400x400) → store per user account → auto-display on team.html, member.html, post author.
Analyze: what currently exists in UploadService and User entity. What needs to change in the backend (new field? existing upload endpoint reuse?). What JS changes in frontend to load avatar from API instead of static file. Propose Flyway migration SQL if needed.

### 2. i18n auto-translation workflow

User requirement: IP-based language detection, Claude API translates posts to uk/en/fr/de, agent validates quality + moderation, auto-publishes if ok, notifies author+admin if not.
Analyze: existing translations table and Translation entity in the backend. How to extend BlogPostService to trigger translation pipeline. What data model changes are needed. What the review workflow looks like technically. Where Claude API calls would be made (backend service? separate microservice?).

### 3. Contact form — 3 field variants

Propose 3 variants for the contact form with different field sets and UX reasoning:

- Variant A: minimal (Name, Email, Message)
- Variant B: medium (Name, Email, Service type dropdown, Message)
- Variant C: full (Name, Email, Phone, Company, Service type, Budget range, Message)
  For each: state who this works best for and what backend ContactMessageCreateRequest DTO would look like.

### 4. Dashboard Subscriber — industry features

What features do subscription-based platforms (Substack, Medium, Ghost) give subscribers in their dashboard? List 8-10 features. Mark which ones are already partially supported by the existing backend (favorites, subscriptions, comments endpoints exist). Mark which need new endpoints.

### 5. Backup storage sizing

Estimate: current DB is small (posts, users, comments). At 50 posts + 10 projects + 500 comments per year, what is the pg_dump size in MB per year? Compare storage options: local only (current), Hetzner Object Storage (price/TB), Backblaze B2 (price/TB), Cloudflare R2 (price/TB). Give a recommendation for the next 3 years.

## Rules

- Read every file before making claims about it
- Be specific: reference actual class names, field names, method signatures from the code
- Propose actual SQL migrations, API endpoint signatures, JS code snippets where useful
- Do NOT write any code to the project files — output to /tmp/codex-cote-analysis.md only
