/**
 * Centralized structured logger. Emits single-line JSON so logs are grepable
 * and ingestible by aggregators (Datadog, Loki, CloudWatch). In development it
 * pretty-prints. Swap the sink in `write()` to forward to an external service.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const MIN_LEVEL: Level =
  (process.env.LOG_LEVEL as Level) || (process.env.NODE_ENV === "production" ? "info" : "debug");

type Meta = Record<string, unknown>;

function write(level: Level, event: string, meta?: Meta) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    ...meta,
  };

  const line = JSON.stringify(record);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, meta?: Meta) => write("debug", event, meta),
  info: (event: string, meta?: Meta) => write("info", event, meta),
  warn: (event: string, meta?: Meta) => write("warn", event, meta),
  error: (event: string, meta?: Meta) => write("error", event, meta),
};
