Database Schema (MySQL)
=======================

Conventions
-----------
- `id` as BIGINT AUTO_INCREMENT (or ULID/UUID if preferred).
- `created_at/updated_at` TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3).
- Soft delete via `deleted_at` where useful (files/folders).

Tables
------
- `users`: id, email (uniq), name, avatar_url, status, created_at.
- `oauth_accounts`: id, user_id FK, provider, provider_account_id (uniq per provider), access_token (optional), refresh_token (optional), expires_at.
- `roles`: id, name (admin/manager/member/viewer), description.
- `user_roles`: user_id FK, role_id FK (global role assignment).
- `folders`: id, name, parent_id FK nullable, owner_id FK (user), path_cache (e.g., `/root/a/b`), created_at, updated_at, deleted_at.
- `files`: id, folder_id FK, owner_id FK, name, mime_type, size_bytes, checksum (sha256), storage_key (MinIO object key), version INT DEFAULT 1, created_at, updated_at, deleted_at.
- `shares`: id, resource_type ENUM('file','folder'), resource_id FK, token (uniq), password_hash nullable, expires_at, allow_download BOOL, allow_preview BOOL, created_by FK, created_at, revoked_at.
- `share_access_logs` (optional): id, share_id FK, accessor_ip, user_agent, action ENUM('preview','download'), created_at.
- `permissions` (optional fine-grain): id, subject_type ENUM('user','role'), subject_id FK, resource_type ENUM('file','folder'), resource_id FK, actions SET('read','write','delete','share','move'), created_at.
- `sessions` (if using server sessions): id, user_id FK, refresh_token_hash, user_agent, ip, expires_at, created_at.

Indexes
-------
- `users.email` unique.
- `oauth_accounts(provider, provider_account_id)` unique.
- `folders(parent_id, name)` unique to prevent duplicates in same folder.
- `files(folder_id, name, deleted_at)` unique for active names.
- `shares(token)` unique; index `expires_at`.
- `permissions(subject_type, subject_id)` for quick lookup.

Storage layout (MinIO keys)
---------------------------
- Keys: `users/{userId}/folders/{folderId}/{uuid}-{filename}`.
- Keep `storage_key` immutable; on rename/move, update metadata only if using virtual paths; if physical move needed, copy + delete source (careful with versioning).
- Buckets: single bucket `cloud-files` (dev/prod separated by prefix).

Caching (Redis)
---------------
- `share:{token}` → share metadata (TTL = min(expiry, 10m) and invalidated on revoke).
- `user_roles:{userId}` → role list (TTL short, e.g., 5m).
- `presign:download:{fileId}:{userId}` → presigned URL (TTL 2-5m).
- Rate limit keys: `rl:auth:{ip}`, `rl:share:{token}`.

