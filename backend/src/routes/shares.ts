import { Router } from "express";

const router = Router();

router.post("/", (_req, res) => {
  res.json({ message: "create share placeholder" });
});

router.post("/:token/resolve", (req, res) => {
  res.json({ message: "resolve share placeholder", token: req.params.token });
});

router.delete("/:id", (req, res) => {
  res.json({ message: "revoke share placeholder", id: req.params.id });
});

export default router;

