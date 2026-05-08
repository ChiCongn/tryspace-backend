import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler } from "./middleware/errorHandler";
import apiRouter from "./routes";

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(helmet());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(compression());

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
