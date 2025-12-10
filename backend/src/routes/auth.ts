import { Router } from "express";

const router = Router();

// TODO: Implement OAuth redirect and callback; issue JWT or session cookie.
router.get("/oauth/:provider", (req, res) => {
  res.json({ message: "OAuth redirect placeholder", provider: req.params.provider });
});

router.get("/oauth/:provider/callback", (req, res) => {
  res.json({ message: "OAuth callback placeholder", provider: req.params.provider, code: req.query.code });
});

router.post("/refresh", (_req, res) => {
  res.json({ message: "Refresh token placeholder" });
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logout placeholder" });
});

export default router;

