import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/health", async (_req, res) => {
  // Basic DB health check
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, scope: "admin" });
});

router.post("/reindex", (_req, res) => {
  res.json({ message: "reindex placeholder" });
});

export default router;

