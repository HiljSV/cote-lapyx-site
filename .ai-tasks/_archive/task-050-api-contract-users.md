# Task 050 — OpenAPI contract: add missing /users/me/password, /me/email, /me/avatar endpoints

## Meta
- **Date:** 2026-05-20
- **Project:** cote-lapyx
- **Branch:** feature/component-050-api-contract-users
- **Agent:** cote-api-contract
- **STATUS: PLAN APPROVED**

---

## Project Context
- **Path:** /home/hilj/code/active/cote-lapyx_project/cote-lapyx/
- **File to modify:** docs/api-v1.yaml
- **Build command:** none (YAML only)
- **Config files (DO NOT TOUCH):** vite.config.js, package.json

---

## Goal
Add 4 missing endpoint definitions to docs/api-v1.yaml that already exist in the backend (UserController.java) and are already called by the frontend (dashboard.js), but are absent from the contract.

---

## Endpoints to add

Insert all 4 endpoints into the `paths:` section of docs/api-v1.yaml, immediately after the existing `/users/me/favorites:` block.

### 1. POST /users/me/password
Changes the authenticated user's password. Requires current password for identity confirmation.

**Request body schema (inline):**
```
required: [currentPassword, newPassword]
properties:
  currentPassword:
    type: string
    format: password
    description: Current password for identity confirmation
  newPassword:
    type: string
    format: password
    minLength: 8
    maxLength: 100
    description: New password (8–100 chars)
```

**Responses:**
- 204 No Content — password changed; refresh tokens revoked
- 400 → $ref: "#/components/responses/ValidationError"
- 401 → $ref: "#/components/responses/Unauthorized"
- 403 → $ref: "#/components/responses/Forbidden" (wrong current password)

**Security:** bearerAuth, x-roles: [owner, subscriber]
**operationId:** changeMyPassword

---

### 2. PATCH /users/me/email
Changes the authenticated user's email address. Requires current password.

**Request body schema (inline):**
```
required: [currentPassword, newEmail]
properties:
  currentPassword:
    type: string
    format: password
    description: Current password for identity confirmation
  newEmail:
    type: string
    format: email
    description: New email address
```

**Responses:**
- 200 — Updated user profile: `$ref: "#/components/schemas/UserDTO"`
- 400 → $ref: "#/components/responses/ValidationError"
- 401 → $ref: "#/components/responses/Unauthorized"
- 403 → $ref: "#/components/responses/Forbidden" (wrong current password)
- 409 → description: "Email already taken by another account"

**Security:** bearerAuth, x-roles: [owner, subscriber]
**operationId:** changeMyEmail

---

### 3. POST /users/me/avatar
Uploads a new avatar image for the authenticated user (multipart/form-data).

**Request body:** multipart/form-data with field `file` (type: string, format: binary)

**Responses:**
- 200 — Updated user profile: `$ref: "#/components/schemas/UserDTO"`
- 400 → $ref: "#/components/responses/ValidationError" (file too large, wrong type)
- 401 → $ref: "#/components/responses/Unauthorized"

**Security:** bearerAuth, x-roles: [owner, subscriber]
**operationId:** uploadMyAvatar

---

### 4. DELETE /users/me/avatar
Removes the avatar of the authenticated user (resets to default).

**Responses:**
- 204 No Content
- 401 → $ref: "#/components/responses/Unauthorized"

**Security:** bearerAuth, x-roles: [owner, subscriber]
**operationId:** deleteMyAvatar

---

## Rules
- Keep the existing /users/me and /users/me/comments and /users/me/favorites blocks intact
- Use $ref for standard error responses (ValidationError, Unauthorized, Forbidden) — do NOT inline them
- Use the same tags: [Users] as the existing /users/me block
- All 4 endpoints must have security: - bearerAuth: [] and x-roles
- Do NOT add new components/schemas — inline the request bodies for password and email changes (they are simple, 2-field objects)
- YAML indentation: 2 spaces throughout (match existing file style)
- Group POST /me/avatar and DELETE /me/avatar under a single /users/me/avatar: path key

## Output
Modified docs/api-v1.yaml with all 4 endpoints added. Run: `python3 -c "import yaml; yaml.safe_load(open('docs/api-v1.yaml'))" 2>&1` to verify YAML is valid.
