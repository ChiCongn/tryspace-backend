type LogLevel = "debug" | "info" | "warn" | "error";
type ConfiguredLogLevel = LogLevel | "silent";
type LogFormat = "json" | "pretty";

export type LogContext = { context?: string } & Record<string, unknown>;

const LEVEL_PRIORITY: Record<ConfiguredLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Number.POSITIVE_INFINITY
};

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY_PARTS = ["password", "token", "secret", "authorization", "cookie", "apikey", "api_key"];
const DEFAULT_PRETTY_CONTEXT = "app";

function configuredLevel(): ConfiguredLogLevel {
  const rawLevel = process.env.LOG_LEVEL?.toLowerCase();

  if (rawLevel === "debug" || rawLevel === "info" || rawLevel === "warn" || rawLevel === "error" || rawLevel === "silent") {
    return rawLevel;
  }

  return process.env.NODE_ENV === "test" ? "warn" : "info";
}

function configuredFormat(): LogFormat {
  const rawFormat = process.env.LOG_FORMAT?.toLowerCase();

  if (rawFormat === "json" || rawFormat === "pretty") {
    return rawFormat;
  }

  return process.env.NODE_ENV === "production" ? "json" : "pretty";
}

function isSensitiveKey(key: string): boolean {
  const normalizedKey = key.replace(/[-_\s]/g, "").toLowerCase();

  return SENSITIVE_KEY_PARTS.some((part) => normalizedKey.includes(part.replace(/[-_\s]/g, "")));
}

function normalizeError(error: Error, seen: WeakSet<object>): LogContext {
  const errorWithCause = error as Error & { cause?: unknown };

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(errorWithCause.cause === undefined ? {} : { cause: normalizeValue(errorWithCause.cause, seen) })
  };
}

function normalizeValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value instanceof Error) {
    return normalizeError(value, seen);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, seen));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, isSensitiveKey(key) ? REDACTED : normalizeValue(item, seen)])
  );
}

function normalizeContext(context: LogContext): LogContext {
  const seen = new WeakSet<object>();

  return Object.fromEntries(
    Object.entries(context)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, isSensitiveKey(key) ? REDACTED : normalizeValue(value, seen)])
  );
}

function formatPrettyContext(context: LogContext): string {
  const prettyContext = context.context;

  if (typeof prettyContext === "string" && prettyContext.trim()) {
    return prettyContext.trim();
  }

  return DEFAULT_PRETTY_CONTEXT;
}

function formatPrettyAction(action: string): string {
  const trimmedAction = action.trim();

  if (!trimmedAction || /[.!?]$/.test(trimmedAction)) {
    return trimmedAction;
  }

  return `${trimmedAction}.`;
}

function writeToConsole(level: LogLevel, message: string): void {
  if (level === "error") {
    console.error(message);
    return;
  }

  if (level === "warn") {
    console.warn(message);
    return;
  }

  console.log(message);
}

export class Logger {
  constructor(private readonly context: LogContext = {}) {}

  child(context: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...context
    });
  }

  log(level: LogLevel, message: string, context: LogContext = {}): void {
    const minimumLevel = configuredLevel();

    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minimumLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const normalizedContext = normalizeContext({
      ...this.context,
      ...context
    });
    const record = {
      timestamp,
      level,
      service: process.env.SERVICE_NAME ?? "tryspace-backend",
      environment: process.env.NODE_ENV ?? "development",
      ...normalizedContext,
      message
    };

    if (configuredFormat() === "json") {
      writeToConsole(level, JSON.stringify(record));
      return;
    }

    writeToConsole(
      level,
      `[${record.level.toUpperCase()}]: [${formatPrettyContext(normalizedContext)}] - ${formatPrettyAction(record.message)}`
    );
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }
}

export const logger = new Logger();
