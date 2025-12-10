Architecture Overview
=====================

Services
--------
- Backend API (Node.js + Express): auth, RBAC, file/folder CRUD, share links, presigned URLs, webhooks.
- Worker (Node.js): scheduled cleanup (expired shares/files), async tasks (virus scan hook optional), cache invalidation.
- Frontend (Vue 3 + Vite + Tailwind + shadcn-vue): SPA for browsing, upload, sharing.
- MinIO: S3-compatible object storage for file blobs and thumbnails.
- MySQL: relational metadata (users, roles, folders, files, shares, permissions).
- Redis: cache for share link resolution, presigned URL cache, rate limiting.

High-level flows
----------------
- Upload: client requests presigned PUT -> backend validates RBAC, size/type, emits presigned URL -> client uploads to MinIO -> client notifies backend to finalize metadata (etag/size/mime/hash).
- Download/preview: backend validates share/user permissions -> presigned GET with short TTL; optionally stream through backend for auditing.
- Folder ops: metadata-only mutations in MySQL; object keys use folder paths (`folderId` → key prefix).
- Sharing: create share token with scopes (view/download), optional password, expiration; lookups cached in Redis with TTL; worker clears expired rows and optionally deletes orphaned objects.
- Auth: OAuth login (e.g., Google). Backend issues JWT access + refresh (or session cookie). RBAC enforced via middleware checking role + ownership.
- RBAC: roles (admin, manager, member, viewer) with resource ownership on folders/files; policy allows owner, share token with scope, or role with grants.

Core modules (backend)
----------------------
- `auth`: OAuth handlers, JWT issuance/rotation, refresh endpoint, middleware.
- `rbac`: policy engine with role→action mapping and ownership checks; caches user roles in Redis.
- `files`: presigned upload/download, metadata persistence, checksum/size validation, versioning hook.
- `folders`: CRUD, move/rename, path recalculation.
- `shares`: create/revoke share links, enforce expiry/password, download/view scopes.
- `audit/log`: structured logging; optional audit trail table.
- `jobs`: cron-like tasks for expired shares/files and cache pruning.

Security/ops notes
------------------
- Rate limit auth/share routes; CSRF protection for cookie mode.
- Validate mimetype/extension and size before presign; optional AV scanner hook.
- Store only metadata in DB; never store access tokens for OAuth beyond refresh for re-auth (if needed).
- Enable HTTPS and signed cookies in production; configure CORS for frontend origin.
- MinIO bucket policy: private by default; all access via presigned URLs.

Open decisions
--------------
- Pick Prisma vs Knex. (Default: Prisma.)
- Session strategy: JWT (access+refresh) vs server sessions in Redis.
- Versioning support: keep latest only or maintain versions per file.

