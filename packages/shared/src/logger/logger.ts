import type { Config, LogLevel } from '../env/config.js';

export type LogContext = Record<string, unknown>;

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  env: string;
  traceId?: string;
  spanId?: string;
  message: string;
  context?: LogContext;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  withTrace(traceId: string, spanId: string): Logger;
}

export type WriteFn = (line: string) => void;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function defaultWrite(line: string): void {
  console.log(line);
}

export function createLogger(
  service: string,
  config: Config,
  opts?: { write?: WriteFn; traceId?: string; spanId?: string },
): Logger {
  const write = opts?.write ?? defaultWrite;
  const minLevel = LEVEL_ORDER[config.logLevel];

  function log(level: LogLevel, message: string, context?: LogContext): void {
    if (LEVEL_ORDER[level] < minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      env: config.env,
      message,
    };

    if (opts?.traceId !== undefined) entry.traceId = opts.traceId;
    if (opts?.spanId !== undefined) entry.spanId = opts.spanId;
    if (context !== undefined) entry.context = context;

    write(JSON.stringify(entry));
  }

  return {
    debug: (msg, ctx) => log('debug', msg, ctx),
    info: (msg, ctx) => log('info', msg, ctx),
    warn: (msg, ctx) => log('warn', msg, ctx),
    error: (msg, ctx) => log('error', msg, ctx),
    withTrace: (traceId, spanId) =>
      createLogger(service, config, { write, traceId, spanId }),
  };
}
