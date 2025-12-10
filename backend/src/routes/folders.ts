import { Router } from "express";

const router = Router();

router.get("/:id/children", (req, res) => {
  res.json({ message: "list children placeholder", id: req.params.id });
});

router.post("/", (_req, res) => {
  res.json({ message: "create folder placeholder" });
});

router.patch("/:id", (req, res) => {
  res.json({ message: "update folder placeholder", id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.json({ message: "delete folder placeholder", id: req.params.id });
});

export default router;

