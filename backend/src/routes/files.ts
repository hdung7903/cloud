import { Router } from "express";

const router = Router();

router.post("/presign-upload", (_req, res) => {
  res.json({ message: "presign upload placeholder" });
});

router.post("/complete", (_req, res) => {
  res.json({ message: "complete upload placeholder" });
});

router.post("/:id/presign-download", (req, res) => {
  res.json({ message: "presign download placeholder", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.json({ message: "delete file placeholder", id: req.params.id });
});

router.patch("/:id", (req, res) => {
  res.json({ message: "update file placeholder", id: req.params.id });
});

export default router;

