import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import i18next from 'i18next';
import { initI18n, t, resetI18n } from '../../src/i18n/i18n.js';

describe('initI18n', () => {
  beforeEach(() => {
    resetI18n();
  });

  it('returns ok on first call', async () => {
    const result = await initI18n();
    expect(result.ok).toBe(true);
  });

  it('is idempotent — second call returns ok without reinitialising', async () => {
    await initI18n();
    const result = await initI18n();
    expect(result.ok).toBe(true);
  });
});

describe('initI18n — error paths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetI18n();
  });

  it('returns err when i18next.init throws an Error', async () => {
    resetI18n();
    vi.spyOn(i18next, 'init').mockRejectedValueOnce(new Error('init failed'));
    const result = await initI18n();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('I18N_INIT_FAILED');
      expect(result.error.message).toBe('init failed');
    }
  });

  it('returns err when i18next.init throws a non-Error value', async () => {
    resetI18n();
    vi.spyOn(i18next, 'init').mockRejectedValueOnce('string failure');
    const result = await initI18n();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('I18N_INIT_FAILED');
      expect(result.error.message).toBe('string failure');
    }
  });
});

describe('t', () => {
  beforeEach(async () => {
    resetI18n();
    await initI18n();
  });

  it('translates a known key', () => {
    expect(t('document.submitLabel')).toBe('Submit');
  });

  it('interpolates variables', () => {
    const msg = t('errors.validation.required', { field: 'email' });
    expect(msg).toBe("Field 'email' is required");
  });

  it('interpolates multiple variables', () => {
    const msg = t('errors.validation.invalidType', {
      field: 'age',
      expected: 'number',
    });
    expect(msg).toBe("Field 'age' has an invalid type, expected 'number'");
  });

  it('returns the key for an unknown key', () => {
    const key = 'does.not.exist';
    expect(t(key)).toBe(key);
  });
});
