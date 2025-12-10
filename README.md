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
- Backend: Node.js + Express + Prisma (MySQL), @aws-sdk/client-s3 for MinIO, Redis client for caching.
- Frontend: Vue 3 + Vite + TypeScript + Pinia + Vue Router (scaffolded via `npm create vue@latest`).
- Storage: MinIO for objects; MySQL for relational metadata; Redis for caching share link resolution and presigned URL throttling.
- Infra: Docker Compose for local dev; services: backend API, worker, frontend, DB, Redis, MinIO.

Repo layout
-----------
- `backend/` – API, auth, file, share, RBAC modules, Prisma schema, seed.
- `frontend/` – Vue SPA (dev login + folder browser wired to backend).
- `docs/` – architecture, API, DB schema notes.
- `docker-compose.yml` – local stack (MySQL, Redis, MinIO, API, worker, frontend).

Quick start (dev)
-----------------
1) Backend env: copy `backend/env.example` → `backend/.env` and adjust secrets (DB/Redis/MinIO/OAuth/JWT). Default compose URLs are prefilled.
2) Start infra: `docker compose up -d mysql redis minio`.
3) Backend deps: `cd backend && npm install`.
4) DB migrate/seed: `npm run prisma:migrate -- --name init` (with DB up) then `npm run seed`.
5) Run backend: `npm run dev` (or `docker compose up backend`).
6) Frontend env: set `VITE_API_BASE_URL` (compose sets http://backend:3000). Locally: `cd frontend && npm install && npm run dev -- --host --port 5173`.
7) Visit http://localhost:5173. Use Dev Login (email) → tokens stored in localStorage → browse/create folders (calls backend).

Next steps / hardening
----------------------
- Finish OAuth providers beyond dev login; add refresh rotation + revoke list.
- Add rate limiting (auth/share), audit logging, AV scan hook on upload, size/mime enforcement.
- Implement worker cleanup (expired shares, orphan objects, soft-delete purge).
- Add tests for RBAC, share expiry, and object lifecycle.

