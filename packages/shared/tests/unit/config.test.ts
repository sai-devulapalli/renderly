import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, isValidAppEnv } from '../../src/env/config.js';

describe('loadConfig', () => {
  const original = process.env['APP_ENV'];

  afterEach(() => {
    if (original === undefined) {
      delete process.env['APP_ENV'];
    } else {
      process.env['APP_ENV'] = original;
    }
  });

  it('defaults to local when APP_ENV is not set', () => {
    delete process.env['APP_ENV'];
    const config = loadConfig();
    expect(config.env).toBe('local');
    expect(config.logLevel).toBe('debug');
  });

  it('returns local config when APP_ENV=local', () => {
    process.env['APP_ENV'] = 'local';
    const config = loadConfig();
    expect(config.env).toBe('local');
    expect(config.logLevel).toBe('debug');
  });

  it('returns staging config when APP_ENV=staging', () => {
    process.env['APP_ENV'] = 'staging';
    const config = loadConfig();
    expect(config.env).toBe('staging');
    expect(config.logLevel).toBe('warn');
  });

  it('returns production config when APP_ENV=production', () => {
    process.env['APP_ENV'] = 'production';
    const config = loadConfig();
    expect(config.env).toBe('production');
    expect(config.logLevel).toBe('error');
  });

  it('falls back to local for an unrecognised APP_ENV value', () => {
    process.env['APP_ENV'] = 'unknown-env';
    const config = loadConfig();
    expect(config.env).toBe('local');
    expect(config.logLevel).toBe('debug');
  });
});

describe('isValidAppEnv', () => {
  it('returns true for local', () => {
    expect(isValidAppEnv('local')).toBe(true);
  });

  it('returns true for staging', () => {
    expect(isValidAppEnv('staging')).toBe(true);
  });

  it('returns true for production', () => {
    expect(isValidAppEnv('production')).toBe(true);
  });

  it('returns false for an invalid value', () => {
    expect(isValidAppEnv('dev')).toBe(false);
  });
});
