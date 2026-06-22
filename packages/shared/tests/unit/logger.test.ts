import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLogger } from '../../src/logger/logger.js';
import type { LogEntry } from '../../src/logger/logger.js';
import type { Config } from '../../src/env/config.js';

function collectLines(config: Config, traceId?: string, spanId?: string): {
  lines: LogEntry[];
  logger: ReturnType<typeof createLogger>;
} {
  const lines: LogEntry[] = [];
  const write = (line: string) => lines.push(JSON.parse(line) as LogEntry);
  const logger = createLogger('test.service', config, {
    write,
    ...(traceId ? { traceId } : {}),
    ...(spanId ? { spanId } : {}),
  });
  return { lines, logger };
}

const localConfig: Config = { env: 'local', logLevel: 'debug' };
const prodConfig: Config = { env: 'production', logLevel: 'error' };
const stagingConfig: Config = { env: 'staging', logLevel: 'warn' };

describe('createLogger — log level filtering', () => {
  it('emits debug and above on local', () => {
    const { lines, logger } = collectLines(localConfig);
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(lines.map((l) => l.level)).toEqual(['debug', 'info', 'warn', 'error']);
  });

  it('suppresses debug and info on staging', () => {
    const { lines, logger } = collectLines(stagingConfig);
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(lines.map((l) => l.level)).toEqual(['warn', 'error']);
  });

  it('emits only error on production', () => {
    const { lines, logger } = collectLines(prodConfig);
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    expect(lines.map((l) => l.level)).toEqual(['error']);
  });
});

describe('createLogger — log entry shape', () => {
  it('includes required fields on every entry', () => {
    const { lines, logger } = collectLines(localConfig);
    logger.info('hello');
    const entry = lines[0];
    expect(entry).toMatchObject({
      level: 'info',
      service: 'test.service',
      env: 'local',
      message: 'hello',
    });
    expect(typeof entry?.timestamp).toBe('string');
  });

  it('includes context when provided', () => {
    const { lines, logger } = collectLines(localConfig);
    logger.warn('ctx test', { key: 'value' });
    expect(lines[0]?.context).toEqual({ key: 'value' });
  });

  it('omits context when not provided', () => {
    const { lines, logger } = collectLines(localConfig);
    logger.info('no ctx');
    expect(lines[0]).not.toHaveProperty('context');
  });
});

describe('createLogger — trace IDs', () => {
  it('omits traceId and spanId when not provided', () => {
    const { lines, logger } = collectLines(localConfig);
    logger.error('no trace');
    expect(lines[0]).not.toHaveProperty('traceId');
    expect(lines[0]).not.toHaveProperty('spanId');
  });

  it('includes traceId and spanId when provided at construction', () => {
    const { lines, logger } = collectLines(localConfig, 'tid-1', 'sid-1');
    logger.error('traced');
    expect(lines[0]?.traceId).toBe('tid-1');
    expect(lines[0]?.spanId).toBe('sid-1');
  });
});

describe('createLogger — withTrace', () => {
  it('returns a new logger bound to the given trace/span IDs', () => {
    const { lines, logger } = collectLines(localConfig);
    const traced = logger.withTrace('trace-abc', 'span-xyz');
    traced.error('traced message');
    expect(lines[0]?.traceId).toBe('trace-abc');
    expect(lines[0]?.spanId).toBe('span-xyz');
  });

  it('original logger is unaffected by withTrace', () => {
    const { lines, logger } = collectLines(localConfig);
    logger.withTrace('t', 's').error('traced');
    logger.error('untraced');
    expect(lines[0]?.traceId).toBe('t');
    expect(lines[1]).not.toHaveProperty('traceId');
  });
});

describe('createLogger — default console writer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('writes to console.log when no write option is given', () => {
    const written: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg: string) => {
      written.push(msg);
    });
    const logger = createLogger('console.test', localConfig);
    logger.error('to console');
    expect(written).toHaveLength(1);
    const entry = JSON.parse(written[0]!) as LogEntry;
    expect(entry.message).toBe('to console');
    expect(entry.service).toBe('console.test');
  });
});

describe('createLogger — output is valid JSON', () => {
  it('each log line is parseable JSON', () => {
    const raw: string[] = [];
    const logger = createLogger('svc', localConfig, { write: (l) => raw.push(l) });
    logger.debug('json check');
    expect(() => JSON.parse(raw[0] ?? '')).not.toThrow();
  });
});
