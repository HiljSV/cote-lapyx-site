# Task-017: Make project card author avatar/name clickable

## Context

Frontend project: /home/hilj/code/active/cote-lapyx_project/cote-lapyx
Branch to create: feature/task-017-project-author-link

## Problem

In `src/components/pages/index/index.html`, the "Вибрані проекти" section has
project cards with an author block at the bottom:

```html
<div class="project-card__author">
  <img
    class="project-card__author-avatar"
    src="@img/serhii/prince.png"
    alt="Сергій"
    ...
  />
  Сергій
</div>
```

Clicking this has no interaction. Expected: clicking the author navigates to member.html?id={slug}.

## File to change

`src/components/pages/index/index.html`

There are 3 project cards (lines ~576-661):

1. "cote-lapyx.com" → author: Сергій → member.html?id=serhii
2. "JARVIS AI Assistant" → author: Сергій → member.html?id=serhii
3. "Brand Kit cote-lapyx" → author: Андрій → member.html?id=andrii

## Required change

Wrap each `<div class="project-card__author">` with `<a>` element.
Replace `<div class="project-card__author">` with:

```html
<a
  href="member.html?id=serhii"
  class="project-card__author"
  aria-label="Профіль Сергій"
></a>
```

And close with `</a>` instead of `</div>`.

Apply to all 3 cards with correct id (serhii / serhii / andrii).

## Also fix in the same commit

File: `src/data/members.json`
Change `"photo"` field to `null` for all 3 members (Сергій, Андрій, Валерія).
Currently: `"photo": "assets/img/serhii/prince.png"` → these paths are 404 in production
(Vite doesn't hash them because they're plain strings in JSON, not imports).
Setting null triggers the initials placeholder (С/А/В) instead of a broken img element.

## Constraints

- Only change the author div→a conversion and members.json photo fields
- Do NOT change SCSS (the existing .project-card\_\_author styles should apply to <a> the same way)
- Check that <a> inside <article class="project-card"> is semantically valid (it is — footer links are common)
- No new files

## Git

- Branch: feature/task-017-project-author-link
- Commit: feat(index): make project card author clickable; fix members.json broken photo paths
- Do NOT push
