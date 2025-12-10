import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import authRouter from "./routes/auth.js";
import fileRouter from "./routes/files.js";
import folderRouter from "./routes/folders.js";
import shareRouter from "./routes/shares.js";
import adminRouter from "./routes/admin.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((x) => x.trim()) || "*";

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use("/auth", authRouter);
app.use("/files", fileRouter);
app.use("/folders", folderRouter);
app.use("/shares", shareRouter);
app.use("/admin", adminRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

app.listen(port, () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});

