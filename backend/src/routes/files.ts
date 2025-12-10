import { Router } from "express";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth.js";
import { authorizeResource } from "../middleware/rbac.js";
import { s3Client } from "../lib/minio.js";
import { env } from "../config.js";
import { prisma } from "../lib/prisma.js";
import { toBigInt } from "../utils/id.js";

const router = Router();

const presignUploadSchema = z.object({
  folderId: z.coerce.bigint(),
  name: z.string().min(1),
  size: z.coerce.bigint().positive(),
  mimeType: z.string().min(1),
  checksum: z.string().min(1),
});

router.post("/presign-upload", requireAuth, async (req, res) => {
  const parsed = presignUploadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { folderId, name, size, mimeType, checksum } = parsed.data;
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder || folder.deletedAt) return res.status(404).json({ error: "folder_not_found" });
  const userId = toBigInt(req.user?.id);
  const storageKey = `users/${userId}/folders/${folderId}/${uuidv4()}-${name}`;

  const command = new PutObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: Number(size),
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

  res.json({ uploadUrl, storageKey, expiresIn: 600, size, mimeType, checksum });
});

const completeSchema = z.object({
  folderId: z.coerce.bigint(),
  name: z.string().min(1),
  size: z.coerce.bigint().positive(),
  mimeType: z.string().min(1),
  checksum: z.string().min(1),
  storageKey: z.string().min(1),
});

router.post("/complete", requireAuth, async (req, res) => {
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { folderId, name, size, mimeType, checksum, storageKey } = parsed.data;
  const userId = toBigInt(req.user?.id);

  const file = await prisma.file.create({
    data: {
      folderId,
      ownerId: userId,
      name,
      mimeType,
      sizeBytes: size,
      checksum,
      storageKey,
    },
  });

  res.json({ id: file.id.toString(), name: file.name });
});

router.post("/:id/presign-download", requireAuth, authorizeResource("file", "read"), async (req, res) => {
  const fileId = toBigInt(req.params.id);
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return res.status(404).json({ error: "not_found" });

  const command = new GetObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: file.storageKey,
  });
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  res.json({ downloadUrl, expiresIn: 300, name: file.name, mimeType: file.mimeType });
});

router.delete("/:id", requireAuth, authorizeResource("file", "delete"), async (req, res) => {
  const fileId = toBigInt(req.params.id);
  await prisma.file.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  });
  res.json({ ok: true });
});

router.patch("/:id", requireAuth, authorizeResource("file", "move"), async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    folderId: z.coerce.bigint().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const fileId = toBigInt(req.params.id);
  const updated = await prisma.file.update({
    where: { id: fileId },
    data: {
      name: parsed.data.name ?? undefined,
      folderId: parsed.data.folderId ?? undefined,
    },
  });
  res.json({ id: updated.id.toString(), name: updated.name, folderId: updated.folderId.toString() });
});

export default router;

