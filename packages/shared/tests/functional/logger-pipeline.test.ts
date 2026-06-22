import { describe, it, expect, afterEach } from 'vitest';
import { loadConfig } from '../../src/env/config.js';
import { createLogger } from '../../src/logger/logger.js';
import type { LogEntry } from '../../src/logger/logger.js';

describe('logger + config pipeline', () => {
  const original = process.env['APP_ENV'];

  afterEach(() => {
    if (original === undefined) {
      delete process.env['APP_ENV'];
    } else {
      process.env['APP_ENV'] = original;
    }
  });

  it('a logger built from loadConfig(local) emits debug logs', () => {
    process.env['APP_ENV'] = 'local';
    const config = loadConfig();
    const lines: LogEntry[] = [];
    const logger = createLogger('pipeline.test', config, {
      write: (l) => lines.push(JSON.parse(l) as LogEntry),
    });

    logger.debug('should appear');
    logger.error('also appears');

    expect(lines).toHaveLength(2);
    expect(lines[0]?.env).toBe('local');
    expect(lines[0]?.service).toBe('pipeline.test');
  });

  it('a logger built from loadConfig(production) suppresses debug/info/warn', () => {
    process.env['APP_ENV'] = 'production';
    const config = loadConfig();
    const lines: LogEntry[] = [];
    const logger = createLogger('pipeline.test', config, {
      write: (l) => lines.push(JSON.parse(l) as LogEntry),
    });

    logger.debug('suppressed');
    logger.info('suppressed');
    logger.warn('suppressed');
    logger.error('visible');

    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('error');
    expect(lines[0]?.env).toBe('production');
  });

  it('withTrace propagates trace context through pipeline', () => {
    process.env['APP_ENV'] = 'local';
    const config = loadConfig();
    const lines: LogEntry[] = [];
    const base = createLogger('tracer.test', config, {
      write: (l) => lines.push(JSON.parse(l) as LogEntry),
    });
    const traced = base.withTrace('trace-001', 'span-001');

    traced.info('request received', { path: '/api/render' });

    expect(lines[0]?.traceId).toBe('trace-001');
    expect(lines[0]?.spanId).toBe('span-001');
    expect(lines[0]?.context).toEqual({ path: '/api/render' });
  });
});
