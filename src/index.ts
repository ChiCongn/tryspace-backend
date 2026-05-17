import "dotenv/config";

import app from "./app";
import { logger } from "./utils/logger";

const port = Number(process.env.PORT) || 3000;
const serverLogger = logger.child({ context: "server" });
const nodeEnv = process.env.NODE_ENV ?? "development";

function errorSummary(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

const server = app.listen(port, () => {
  serverLogger.info(`API server started on port ${port} (${nodeEnv})`, {
    port,
    nodeEnv
  });
});

server.on("error", (error) => {
  serverLogger.error(`API server failed to start on port ${port}: ${errorSummary(error)}`, {
    port,
    error
  });
  process.exit(1);
});

function shutdown(signal: NodeJS.Signals): void {
  serverLogger.info(`Shutdown started after ${signal}`, { signal });

  server.close((error) => {
    if (error) {
      serverLogger.error(`Shutdown failed after ${signal}: ${errorSummary(error)}`, {
        signal,
        error
      });
      process.exit(1);
    }

    serverLogger.info(`Shutdown completed after ${signal}`, { signal });
    process.exit(0);
  });

  setTimeout(() => {
    serverLogger.error(`Shutdown forced after ${signal}`, { signal });
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("unhandledRejection", (reason) => {
  serverLogger.error(`Unhandled rejection: ${errorSummary(reason)}`, {
    error: reason
  });
});
process.on("uncaughtException", (error) => {
  serverLogger.error(`Uncaught exception: ${errorSummary(error)}`, {
    error
  });
  process.exit(1);
});
