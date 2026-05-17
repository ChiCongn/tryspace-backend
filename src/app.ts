import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";

import { errorHandler } from "./middleware/errorHandler";
import { defaultLimiter } from "./middleware/rateLimiter";
import { requestLogger } from "./middleware/requestLogger";
import apiRouter from "./routes";

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const publicAssetsDir = path.join(process.cwd(), "public", "assets");

app.use(requestLogger);
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use("/assets", express.static(publicAssetsDir, { immutable: true, maxAge: "1d" }));
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(defaultLimiter);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
    env: process.env.NODE_ENV
  });
});

app.use("/api/v1", apiRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

app.use(errorHandler);

export default app;
