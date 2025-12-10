import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, scope: "admin" });
});

router.post("/reindex", (_req, res) => {
  res.json({ message: "reindex placeholder" });
});

export default router;

