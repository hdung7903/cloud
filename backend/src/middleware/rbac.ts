import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AuthUser } from "../types.js";
import { toBigInt } from "../utils/id.js";

type Action = "read" | "write" | "delete" | "share" | "move";

const roleHierarchy = ["admin", "manager", "member", "viewer"];

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: "unauthorized" });
    if (user.roles.some((r) => roles.includes(r))) return next();
    return res.status(403).json({ error: "forbidden" });
  };
}

export function authorizeResource(resource: "file" | "folder", action: Action) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUser | undefined;
    if (!user) return res.status(401).json({ error: "unauthorized" });
    // Admin bypass
    if (user.roles.includes("admin")) return next();
    const id = toBigInt(req.params.id);

    if (resource === "file") {
      const file = await prisma.file.findUnique({ where: { id } });
      if (!file || file.deletedAt) return res.status(404).json({ error: "not_found" });
      if (file.ownerId === BigInt(user.id)) return next();
    } else {
      const folder = await prisma.folder.findUnique({ where: { id } });
      if (!folder || folder.deletedAt) return res.status(404).json({ error: "not_found" });
      if (folder.ownerId === BigInt(user.id)) return next();
    }

    // Simple role check: manager can write/share/move/delete; member can read/write; viewer read.
    const requiredRole = action === "read" ? "viewer" : action === "write" || action === "move" ? "member" : action === "share" ? "manager" : "manager";
    const ok = user.roles.some((r) => roleHierarchy.indexOf(r) <= roleHierarchy.indexOf(requiredRole));
    if (!ok) return res.status(403).json({ error: "forbidden" });
    return next();
  };
}

