Cloud File Manager (Self-Hosted)
================================

Mini “Google Drive” self-hosted stack built with Node.js + Vue, MinIO, MySQL, Redis, Docker. Supports OAuth login, RBAC, expirable share links, workers for cleanup, and object storage offload.

Key features
------------
- Upload/download/preview files via MinIO (S3-compatible).
- Folder CRUD: create, rename, move.
- Expirable share links with optional password and view/download scopes.
- File metadata stored in MySQL; Redis for caching link lookups and presigned URLs.
- Worker to delete expired shares/objects and purge cache.
- OAuth login (provider-agnostic: Google/GitHub/…); JWT sessions.
- RBAC: roles and resource-level ownership; optional org/space support.

Tech decisions
--------------
- Backend: Node.js + Hono/Express (choose one; Hono suggested for simplicity) with @aws-sdk/client-s3 for MinIO, Prisma/Knex for MySQL, Redis client for caching.
- Frontend: Vue 3 + Vite + Tailwind + shadcn-vue for UI kit.
- Storage: MinIO for objects; MySQL for relational metadata; Redis for caching share link resolution and presigned URL throttling.
- Infra: Docker Compose for local dev; separate services for backend API, worker, frontend, DB, Redis, MinIO.

Repo layout (proposed)
----------------------
- `backend/` – API, auth, file, share, RBAC modules.
- `worker/` – background jobs (cleanup expired shares/files, lifecycle).
- `frontend/` – Vue SPA for browsing/uploading/sharing.
- `docs/` – architecture, API, DB schema notes.
- `docker-compose.yml` – local stack (MySQL, Redis, MinIO, API, worker, frontend).

Quick start (after code is added)
---------------------------------
1) Copy `.env.example` → `.env` (fill secrets: DB, Redis, MinIO, OAuth).
2) `docker compose up -d mysql redis minio` then `docker compose up backend worker frontend`.
3) Run DB migrations (e.g., `npm run db:migrate` inside backend).
4) Access frontend at http://localhost:5173, API at http://localhost:3000.

Next steps
----------
- Pick Hono or Express for backend; wire auth (OAuth) and RBAC middleware.
- Implement presigned upload/download with size/type validation and antivirus hook (optional).
- Add tests for RBAC, share expiry, and object cleanup.
- Harden: rate limit auth/share routes, audit logging, S3 bucket policies, CORS.

