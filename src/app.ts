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

const nodeEnv = process.env.NODE_ENV ?? "development";
const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URLS,
  process.env.CORS_ORIGINS
]
  .filter(Boolean)
  .flatMap((origin) => origin!.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins.length ? configuredOrigins : ["http://localhost:5173"]);
const allowPrivateNetworkOrigins =
  process.env.ALLOW_PRIVATE_NETWORK_ORIGINS?.toLowerCase() === "true" ||
  (process.env.ALLOW_PRIVATE_NETWORK_ORIGINS === undefined && nodeEnv !== "production");
const publicAssetsDir = path.join(process.cwd(), "public", "assets");

function isPrivateNetworkOrigin(origin: string): boolean {
  if (!allowPrivateNetworkOrigins) {
    return false;
  }

  try {
    const { hostname, protocol } = new URL(origin);

    if (protocol !== "http:" && protocol !== "https:") {
      return false;
    }

    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
}

app.use(requestLogger);
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isPrivateNetworkOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    }
  })
);
app.use("/assets", express.static(publicAssetsDir, { immutable: true, maxAge: "1d" }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
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
