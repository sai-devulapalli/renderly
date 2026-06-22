import type { LocaleMap, LocalizeOptions } from './types.js';

/**
 * Resolve a translation key.
 * Returns the translated string or `fallback` if the key is missing from the locale.
 */
export function resolve(
  localeMap: LocaleMap,
  locale: string,
  key: string,
  fallback: string,
  opts?: LocalizeOptions,
): string {
  const messages = localeMap[locale];
  if (messages !== undefined) {
    const v = messages[key];
    if (v !== undefined) return v;
  }

  // Try fallback locale
  if (opts?.fallbackLocale !== undefined && opts.fallbackLocale !== locale) {
    const fallbackMessages = localeMap[opts.fallbackLocale];
    if (fallbackMessages !== undefined) {
      const v = fallbackMessages[key];
      if (v !== undefined) return v;
    }
  }

  return fallback;
}
