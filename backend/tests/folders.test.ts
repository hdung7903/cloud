import request from "supertest";
import jwt from "jsonwebtoken";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// minimal env for config
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

const foldersData = [{ id: 10n, name: "Sub" }];
const filesData = [{ id: 20n, name: "doc.txt", sizeBytes: 1234n }];

vi.mock("../src/lib/prisma.js", () => {
  return {
    prisma: {
      folder: {
        findMany: vi.fn().mockResolvedValue(foldersData),
        findUnique: vi.fn().mockResolvedValue({ id: 1n, ownerId: 1n, name: "Root", deletedAt: null }),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...data, id: 11n })),
        update: vi.fn(),
      },
      file: {
        findMany: vi.fn().mockResolvedValue(filesData),
      },
    },
  };
});

describe("folders routes", () => {
  let app: ReturnType<(typeof import("../src/app.js"))["createApp"]>;
  const token = jwt.sign({ id: "1", email: "tester@example.com", roles: ["member"] }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

  beforeAll(async () => {
    const mod = await import("../src/app.js");
    app = mod.createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires auth on children", async () => {
    const res = await request(app).get("/folders/1/children");
    expect(res.status).toBe(401);
  });

  it("lists children when authorized", async () => {
    const res = await request(app).get("/folders/1/children").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.folders[0].name).toBe("Sub");
    expect(res.body.files[0].name).toBe("doc.txt");
  });

  it("creates folder", async () => {
    const res = await request(app)
      .post("/folders")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Folder", parentId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Folder");
  });
});

