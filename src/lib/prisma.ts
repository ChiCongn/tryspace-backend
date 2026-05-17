import { Prisma, PrismaClient } from "@prisma/client";

import { logger } from "../utils/logger";

type PrismaClientLogOptions = Prisma.PrismaClientOptions & {
  log: [
    { emit: "event"; level: "query" },
    { emit: "event"; level: "warn" },
    { emit: "event"; level: "error" }
  ];
};

const prismaClientOptions: PrismaClientLogOptions = {
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" }
  ]
};
const prismaLogger = logger.child({ context: "prisma" });

function createPrismaClient() {
  return new PrismaClient<PrismaClientLogOptions>(prismaClientOptions);
}

type PrismaClientWithEvents = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientWithEvents;
  prismaLogSubscribersAttached?: boolean;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prismaLogSubscribersAttached) {
  prisma.$on("warn", (event) => {
    prismaLogger.warn(`Prisma warning: ${event.message}`, {
      prismaMessage: event.message,
      target: event.target
    });
  });

  prisma.$on("error", (event) => {
    prismaLogger.error(`Prisma error: ${event.message}`, {
      prismaMessage: event.message,
      target: event.target
    });
  });

  prisma.$on("query", (event) => {
    if (process.env.LOG_PRISMA_QUERIES !== "true") {
      return;
    }

    prismaLogger.debug(`Prisma query completed in ${event.duration}ms`, {
      query: event.query,
      durationMs: event.duration,
      target: event.target
    });
  });

  globalForPrisma.prismaLogSubscribersAttached = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
