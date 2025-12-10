import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string(),
  OAUTH_GOOGLE_CLIENT_ID: z.string(),
  OAUTH_GOOGLE_CLIENT_SECRET: z.string(),
  OAUTH_REDIRECT_URI: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

let envData:
  | z.infer<typeof envSchema>
  | {
      NODE_ENV: string;
      PORT: number;
      DATABASE_URL: string;
      REDIS_URL: string;
      MINIO_ENDPOINT: string;
      MINIO_PORT: number;
      MINIO_ACCESS_KEY: string;
      MINIO_SECRET_KEY: string;
      MINIO_BUCKET: string;
      OAUTH_GOOGLE_CLIENT_ID: string;
      OAUTH_GOOGLE_CLIENT_SECRET: string;
      OAUTH_REDIRECT_URI: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_REFRESH_EXPIRES_IN: string;
      CORS_ORIGIN: string;
    };

if (process.env.SKIP_ENV_VALIDATION === "true") {
  envData = {
    NODE_ENV: process.env.NODE_ENV ?? "test",
    PORT: Number(process.env.PORT ?? 3000),
    DATABASE_URL: process.env.DATABASE_URL ?? "mysql://user:pass@localhost:3306/db",
    REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? "localhost",
    MINIO_PORT: Number(process.env.MINIO_PORT ?? 9000),
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ?? "minio",
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ?? "minio",
    MINIO_BUCKET: process.env.MINIO_BUCKET ?? "bucket",
    OAUTH_GOOGLE_CLIENT_ID: process.env.OAUTH_GOOGLE_CLIENT_ID ?? "id",
    OAUTH_GOOGLE_CLIENT_SECRET: process.env.OAUTH_GOOGLE_CLIENT_SECRET ?? "secret",
    OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI ?? "http://localhost",
    JWT_SECRET: process.env.JWT_SECRET ?? "testsecret",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  };
} else {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  envData = parsed.data;
}

export const env = envData;

