# Task 041 — OpenAPI Contract: Sprint 4 Likes & Comments Endpoints

## Project

API Contract: /home/hilj/code/active/cote-lapyx_project/cote-lapyx/docs/api-v1.yaml
Agent: cote-api-contract

## Context

Sprint 4 (backend task-039) added the following endpoints and DTO changes that are NOT yet in the OpenAPI contract.

## New endpoints to add

### Post Likes (public — no auth required)

```
GET    /api/v1/posts/{slug}/likes    → PostLikeResponse
POST   /api/v1/posts/{slug}/likes    → PostLikeResponse  (201)
DELETE /api/v1/posts/{slug}/likes    → PostLikeResponse  (200) or 204
```

PostLikeResponse schema:

```yaml
PostLikeResponse:
  type: object
  properties:
    total:
      type: integer
      format: int64
    registered:
      type: integer
      format: int64
    anonymous:
      type: integer
      format: int64
    likedByCurrentUser:
      type: boolean
```

### Comment Likes (public — no auth required)

```
GET    /api/v1/comments/{id}/likes   → CommentLikeResponse
POST   /api/v1/comments/{id}/likes   → CommentLikeResponse (201)
DELETE /api/v1/comments/{id}/likes   → CommentLikeResponse (200) or 204
```

CommentLikeResponse schema:

```yaml
CommentLikeResponse:
  type: object
  properties:
    count:
      type: integer
      format: int64
    likedByCurrentUser:
      type: boolean
```

### Comment Edit (auth required — comment author only)

```
PATCH  /api/v1/comments/{id}         → CommentResponse (200)
```

Request body: CommentEditRequest

```yaml
CommentEditRequest:
  type: object
  required: [content]
  properties:
    content:
      type: string
      maxLength: 2000
      minLength: 1
```

### Comment Admin Seen (OWNER role only)

```
PATCH  /api/v1/comments/{id}/seen    → CommentResponse (200)
```

No request body. Sets admin_seen=true on the comment.

## Updated schemas

### BlogPostResponse — add these fields

```yaml
likesCount:
  type: integer
  format: int64
  description: "Total number of likes (registered + anonymous). Present in both list and detail."
registeredLikesCount:
  type: integer
  format: int64
  description: "Likes from registered users. Present in single-post detail only."
anonymousLikesCount:
  type: integer
  format: int64
  description: "Likes from anonymous visitors. Present in single-post detail only."
likedByCurrentUser:
  type: boolean
  description: "True when the requesting authenticated user has liked this post. Present in detail only."
```

### CommentResponse — add these fields

```yaml
likesCount:
  type: integer
  format: int64
  description: "Total likes on this comment."
likedByCurrentUser:
  type: boolean
  description: "True when the requesting authenticated user has liked this comment."
updatedAt:
  type: string
  format: date-time
  nullable: true
  description: "When the comment was last edited by its author."
```

## Security notes

- All likes endpoints (GET/POST/DELETE) are **public** (no auth required). Include both with and without Bearer token scenarios.
- PATCH /comments/{id} requires Bearer token (comment author only — returns 403 if not author)
- PATCH /comments/{id}/seen requires OWNER role

## Git

No git changes needed — just update docs/api-v1.yaml in the cote-lapyx frontend repo.
