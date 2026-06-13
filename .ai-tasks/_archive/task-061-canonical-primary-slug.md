# Task 061 — Canonical URL must use primary post slug (frontend)

## Repo / branch
- Repo: /home/hilj/code/active/cote-lapyx_project/cote-lapyx
- Branch: fix/061-canonical-primary-slug (already checked out)

## Problem
src/js/post.js (~lines 114-124): canonical <link> and og:url are built from the slug
taken from the page URL. Backend resolves a post by ANY translation slug, so the same
post is reachable under several slugs (e.g. /blog/newsforai-digest-11062026 = EN slug
and /blog/newsforai-daydzhest-11062026 = UK primary). Canonical then differs per URL →
Google sees duplicates.

## Fix (scope: tiny)
1. In post.js, after the post is fetched from the API, build canonical and og:url from
   the post's PRIMARY slug returned by the API (post.slug), NOT from location/URL slug.
2. Verify no other places in post.js use the URL slug for canonical/OG (search "canonical",
   "og:url"). Title/content logic untouched.
3. Comment the changed block (project rule).

## Acceptance
- npm run build exits 0.
- git commit on branch fix/061-canonical-primary-slug:
  "fix: canonical/og:url from API primary slug, not URL slug (duplicate canonical)".
