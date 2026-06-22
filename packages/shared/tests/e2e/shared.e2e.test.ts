import { describe, it, expect, afterEach } from 'vitest';
import { loadConfig } from '../../src/env/config.js';
import { createLogger } from '../../src/logger/logger.js';
import { initI18n, t, resetI18n } from '../../src/i18n/i18n.js';
import { ok, err, isOk, isErr, unwrapOr } from '../../src/result/result.js';
import type { LogEntry } from '../../src/logger/logger.js';

describe('shared infrastructure — full integration (no mocks)', () => {
  const originalEnv = process.env['APP_ENV'];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env['APP_ENV'];
    } else {
      process.env['APP_ENV'] = originalEnv;
    }
    resetI18n();
  });

  it('golden path: init i18n, load config, create logger, log a translated message', async () => {
    process.env['APP_ENV'] = 'local';

    const i18nResult = await initI18n();
    expect(isOk(i18nResult)).toBe(true);

    const config = loadConfig();
    expect(config.env).toBe('local');

    const lines: LogEntry[] = [];
    const logger = createLogger('e2e.shared', config, {
      write: (line) => lines.push(JSON.parse(line) as LogEntry),
    });

    const message = t('errors.validation.required', { field: 'email' });
    logger.info(message);

    expect(lines).toHaveLength(1);
    const entry = lines[0]!;
    expect(entry.message).toBe("Field 'email' is required");
    expect(entry.service).toBe('e2e.shared');
    expect(entry.env).toBe('local');
    expect(entry.level).toBe('info');
    expect(typeof entry.timestamp).toBe('string');
  });

  it('golden path: Result type flows through config-driven logic without throwing', () => {
    process.env['APP_ENV'] = 'production';
    const config = loadConfig();

    const success = ok({ env: config.env });
    const failure = err({ code: 'LOAD_FAILED' as const });

    expect(isOk(success)).toBe(true);
    expect(isErr(failure)).toBe(true);
    expect(unwrapOr(failure, { env: 'local' })).toEqual({ env: 'local' });
  });

  it('golden path: production logger emits only error level', async () => {
    process.env['APP_ENV'] = 'production';

    await initI18n();
    const config = loadConfig();
    const lines: LogEntry[] = [];
    const logger = createLogger('e2e.prod', config, {
      write: (line) => lines.push(JSON.parse(line) as LogEntry),
    });

    logger.debug('suppressed');
    logger.info('suppressed');
    logger.warn('suppressed');
    logger.error(t('errors.parse.invalidJson'));

    expect(lines).toHaveLength(1);
    expect(lines[0]?.level).toBe('error');
    expect(lines[0]?.message).toBe('Input is not valid JSON');
  });
});
