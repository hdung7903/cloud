import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { env } from "../config.js";
import { z } from "zod";
import { randomBytes } from "crypto";

const router = Router();

const tokenPayload = (user: { id: bigint; email: string }, roles: string[]) => ({
  id: user.id.toString(),
  email: user.email,
  roles,
});

const signTokens = (payload: { id: string; email: string; roles: string[] }) => {
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
  const refresh = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
  return { token, refresh };
};

// Dev-only login: issues JWT for an email, creates user if not exists.
router.post("/dev-login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, name } = parsed.data;
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: name ?? undefined },
    create: { email, name: name ?? email.split("@")[0] },
  });

  const roles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  });

  const payload = tokenPayload(user, roles.map((r) => r.role.name));
  const { token, refresh } = signTokens(payload);

  res.json({ token, refresh, user: payload });
});

router.post("/refresh", (req, res) => {
  const schema = z.object({ refresh: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const payload = jwt.verify(parsed.data.refresh, env.JWT_SECRET) as { id: string; email: string; roles: string[] };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
    res.json({ token });
  } catch {
    res.status(401).json({ error: "invalid_refresh" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

// Google OAuth redirect
router.get("/oauth/google", (req, res) => {
  const state = randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, { httpOnly: true, sameSite: "lax" });
  const params = new URLSearchParams({
    client_id: env.OAUTH_GOOGLE_CLIENT_ID,
    redirect_uri: env.OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// Google OAuth callback
router.get("/oauth/google/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code || typeof code !== "string") return res.status(400).send("Missing code");
  const cookieState = req.cookies?.oauth_state;
  if (!cookieState || cookieState !== state) return res.status(400).send("Invalid state");

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.OAUTH_GOOGLE_CLIENT_ID,
      client_secret: env.OAUTH_GOOGLE_CLIENT_SECRET,
      redirect_uri: env.OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResp.ok) return res.status(400).send("Failed to exchange code");
  const tokenJson = (await tokenResp.json()) as { access_token: string };

  const profileResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!profileResp.ok) return res.status(400).send("Failed to fetch profile");
  const profile = (await profileResp.json()) as { email: string; name?: string; picture?: string };
  if (!profile.email) return res.status(400).send("Email required");

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: { name: profile.name ?? undefined, avatarUrl: profile.picture ?? undefined },
    create: { email: profile.email, name: profile.name ?? profile.email.split("@")[0], avatarUrl: profile.picture },
  });
  // Ensure at least member role
  const memberRole = await prisma.role.upsert({
    where: { name: "member" },
    update: {},
    create: { name: "member", description: "Default member" },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: memberRole.id } },
    update: {},
    create: { userId: user.id, roleId: memberRole.id },
  });
  const roles = await prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } });
  const payload = tokenPayload(user, roles.map((r) => r.role.name));
  const { token, refresh } = signTokens(payload);

  res.json({ token, refresh, user: payload });
});

export default router;

