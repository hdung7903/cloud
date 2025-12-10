import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Set env before importing app/config
process.env.JWT_SECRET = "testsecret";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "30d";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.PORT = "3000";
process.env.DATABASE_URL = "mysql://user:pass@localhost:3306/db";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.MINIO_ENDPOINT = "localhost";
process.env.MINIO_PORT = "9000";
process.env.MINIO_ACCESS_KEY = "minio";
process.env.MINIO_SECRET_KEY = "minio";
process.env.MINIO_BUCKET = "bucket";
process.env.OAUTH_GOOGLE_CLIENT_ID = "id";
process.env.OAUTH_GOOGLE_CLIENT_SECRET = "secret";
process.env.OAUTH_REDIRECT_URI = "http://localhost";
process.env.SKIP_ENV_VALIDATION = "true";

vi.mock("../src/lib/prisma.js", () => {
  const user = {
    id: 1n,
    email: "tester@example.com",
    name: "Tester",
  };
  const role = { role: { name: "member" } };
  return {
    prisma: {
      user: {
        upsert: vi.fn().mockResolvedValue(user),
      },
      userRole: {
        findMany: vi.fn().mockResolvedValue([role]),
        upsert: vi.fn().mockResolvedValue(role),
      },
      role: {
        upsert: vi.fn().mockResolvedValue({ id: 2n, name: "member", description: "" }),
      },
    },
  };
});

describe("auth dev-login", () => {
  let app: ReturnType<(typeof import("../src/app.js"))["createApp"]>;

  beforeAll(async () => {
    const mod = await import("../src/app.js");
    app = mod.createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns token and refresh for valid email", async () => {
    const res = await request(app).post("/auth/dev-login").send({ email: "tester@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.refresh).toBeTruthy();
    expect(res.body.user.email).toBe("tester@example.com");
  });

  it("rejects invalid email", async () => {
    const res = await request(app).post("/auth/dev-login").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
  });
});

