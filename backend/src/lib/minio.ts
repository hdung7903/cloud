import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../config.js";

export const s3Client = new S3Client({
  forcePathStyle: true,
  region: "us-east-1",
  endpoint: `http://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
});

