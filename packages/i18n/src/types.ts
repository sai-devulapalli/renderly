/**
 * A flat map of translation keys to translated strings for a single locale.
 *
 * Key conventions:
 *   {field_id}.label          — the visible label text for an input
 *   {field_id}.placeholder    — placeholder text
 *   {field_id}.option.{value} — label for a choice option
 *   form.title                — document-level title
 *   submit.{id}.label         — submit button label
 *   heading.{id}.text         — heading text
 *   text.{id}.content         — text block content
 */
export type LocaleMessages = Readonly<Record<string, string>>;

/**
 * A map from locale code (e.g. "en", "es", "fr") to its messages.
 */
export type LocaleMap = Readonly<Record<string, LocaleMessages>>;

export interface LocalizeOptions {
  /**
   * When a key is missing from the active locale, fall back to this locale.
   * Defaults to the input value (no substitution).
   */
  readonly fallbackLocale?: string;
}
