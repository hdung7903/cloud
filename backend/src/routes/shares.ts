import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { v4 as uuidv4 } from "uuid";
import { toBigInt } from "../utils/id.js";
import bcrypt from "bcryptjs";

const router = Router();

const createSchema = z.object({
  resourceType: z.enum(["file", "folder"]),
  resourceId: z.coerce.bigint(),
  expiresAt: z.coerce.date().optional(),
  allowDownload: z.boolean().optional().default(true),
  allowPreview: z.boolean().optional().default(true),
  password: z.string().min(4).max(64).optional(),
});

router.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { resourceType, resourceId, expiresAt, allowDownload, allowPreview, password } = parsed.data;
  const exists =
    resourceType === "file"
      ? await prisma.file.findUnique({ where: { id: resourceId } })
      : await prisma.folder.findUnique({ where: { id: resourceId } });
  if (!exists) return res.status(404).json({ error: "resource_not_found" });
  const token = uuidv4().replace(/-/g, "");
  const share = await prisma.share.create({
    data: {
      resourceType,
      fileId: resourceType === "file" ? resourceId : null,
      folderId: resourceType === "folder" ? resourceId : null,
      token,
      expiresAt: expiresAt ?? null,
      allowDownload,
      allowPreview,
      createdById: toBigInt(req.user?.id),
      passwordHash: password ? await bcrypt.hash(password, 10) : null,
    },
  });

  res.json({ id: share.id.toString(), token: share.token, expiresAt: share.expiresAt });
});

router.post("/:token/resolve", async (req, res) => {
  const token = req.params.token;
  const share = await prisma.share.findUnique({
    where: { token },
    include: { file: true, folder: true },
  });
  if (!share || (share.expiresAt && share.expiresAt < new Date()) || share.revokedAt) {
    return res.status(404).json({ error: "not_found" });
  }
  if (share.passwordHash) {
    const schema = z.object({ password: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "password_required" });
    const ok = await bcrypt.compare(parsed.data.password, share.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid_password" });
  }
  res.json({
    resourceType: share.resourceType,
    allowDownload: share.allowDownload,
    allowPreview: share.allowPreview,
    file: share.file
      ? { id: share.file.id.toString(), name: share.file.name, mimeType: share.file.mimeType }
      : undefined,
    folder: share.folder ? { id: share.folder.id.toString(), name: share.folder.name } : undefined,
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const shareId = toBigInt(req.params.id);
  await prisma.share.update({
    where: { id: shareId },
    data: { revokedAt: new Date() },
  });
  res.json({ ok: true });
});

export default router;

