API Sketch
==========

Auth
----
- `GET /auth/oauth/:provider` → redirect to provider.
- `GET /auth/oauth/:provider/callback` → issue JWT (access+refresh) or session cookie.
- `POST /auth/refresh` → rotate tokens.
- `POST /auth/logout` → revoke refresh/session.
- `POST /auth/dev-login` → dev-only email login (creates user if missing, issues JWT/refresh).

Folders
-------
- `GET /folders/:id/children` → list folders/files.
- `POST /folders` body { name, parentId? } → create.
- `PATCH /folders/:id` body { name?, parentId? } → rename/move.
- `DELETE /folders/:id` → soft delete (optional recursive).

Files
-----
- `POST /files/presign-upload` body { folderId, name, size, mimeType, checksum } → { uploadUrl, headers, storageKey }.
- `POST /files/complete` body { folderId, name, size, mimeType, checksum, storageKey, etag } → finalize metadata.
- `POST /files/:id/presign-download` → { downloadUrl, headers } (RBAC/share check).
- `DELETE /files/:id` → soft delete + enqueue object deletion.
- `PATCH /files/:id` body { name?, folderId? } → rename/move metadata.

Sharing
-------
- `POST /shares` body { resourceType: "file"|"folder", resourceId, expiresAt, allowDownload?, allowPreview?, password? } → { token, url }.
- `POST /shares/:token/resolve` body { password? } → returns lightweight metadata and new presigned download/preview URLs.
- `DELETE /shares/:id` → revoke share.

RBAC & permissions
------------------
- Middleware checks:
  - Authenticated user roles (admin/manager/member/viewer) and ownership on resource.
  - Share token scope (`allowDownload`/`allowPreview`) bypasses user auth but still enforces expiry/password.
- Optional endpoint: `POST /permissions` to set per-resource grants.

Admin/maintenance
-----------------
- `GET /health` → DB, Redis, MinIO checks.
- `POST /admin/reindex` → recompute folder paths/checksums (optional).

Worker jobs
-----------
- `cron:expire-shares` → delete/revoke expired shares; purge Redis keys.
- `cron:purge-orphans` → remove objects without metadata (after grace).
- `cron:soft-delete-cleaner` → delete objects for files with `deleted_at` past retention.

