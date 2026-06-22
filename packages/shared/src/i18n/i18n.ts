import i18next from 'i18next';
import type { Result } from '../result/result.js';
import { ok, err } from '../result/result.js';
import en from './locales/en.json' assert { type: 'json' };

export interface I18nError {
  code: 'I18N_INIT_FAILED';
  message: string;
}

let initialised = false;

export async function initI18n(): Promise<Result<void, I18nError>> {
  if (initialised) return ok(undefined);

  try {
    await i18next.init({
      lng: 'en',
      fallbackLng: 'en',
      resources: { en: { translation: en } },
      interpolation: { escapeValue: false },
    });
    initialised = true;
    return ok(undefined);
  } catch (e) {
    return err({
      code: 'I18N_INIT_FAILED',
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18next.t(key, options);
}

export function resetI18n(): void {
  initialised = false;
}
