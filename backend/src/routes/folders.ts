import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { authorizeResource } from "../middleware/rbac.js";
import { prisma } from "../lib/prisma.js";
import { toBigInt } from "../utils/id.js";

const router = Router();

router.get("/:id/children", requireAuth, authorizeResource("folder", "read"), async (req, res) => {
  const folderId = toBigInt(req.params.id);
  const folders = await prisma.folder.findMany({ where: { parentId: folderId, deletedAt: null } });
  const files = await prisma.file.findMany({ where: { folderId, deletedAt: null } });
  res.json({
    folders: folders.map((f) => ({ id: f.id.toString(), name: f.name })),
    files: files.map((f) => ({ id: f.id.toString(), name: f.name, sizeBytes: f.sizeBytes.toString() })),
  });
});

router.post("/", requireAuth, async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    parentId: z.coerce.bigint().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const folder = await prisma.folder.create({
    data: {
      name: parsed.data.name,
      parentId: parsed.data.parentId ?? null,
      ownerId: toBigInt(req.user?.id),
    },
  });

  res.json({ id: folder.id.toString(), name: folder.name, parentId: folder.parentId?.toString() });
});

router.patch("/:id", requireAuth, authorizeResource("folder", "move"), async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    parentId: z.coerce.bigint().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const folderId = toBigInt(req.params.id);
  const updated = await prisma.folder.update({
    where: { id: folderId },
    data: {
      name: parsed.data.name ?? undefined,
      parentId: parsed.data.parentId ?? undefined,
    },
  });
  res.json({ id: updated.id.toString(), name: updated.name, parentId: updated.parentId?.toString() });
});

router.delete("/:id", requireAuth, authorizeResource("folder", "delete"), async (req, res) => {
  const folderId = toBigInt(req.params.id);
  await prisma.folder.update({
    where: { id: folderId },
    data: { deletedAt: new Date() },
  });
  res.json({ ok: true });
});

export default router;

