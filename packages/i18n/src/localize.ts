import type { Document, Element, FormErrors } from '@renderly/schema';
import type { LocaleMap, LocalizeOptions } from './types.js';
import { resolve } from './resolver.js';

function localizeElement(
  el: Element,
  localeMap: LocaleMap,
  locale: string,
  opts?: LocalizeOptions,
): Element {
  const r = (key: string, fallback: string) => resolve(localeMap, locale, key, fallback, opts);

  switch (el.type) {
    case 'heading': {
      const id = el.id ?? '';
      return {
        ...el,
        text: id ? r(`heading.${id}.text`, el.text) : el.text,
      };
    }

    case 'text': {
      const id = el.id ?? '';
      return {
        ...el,
        content: id ? r(`text.${id}.content`, el.content) : el.content,
      };
    }

    case 'input': {
      if (el.kind === 'text' || el.kind === 'number' || el.kind === 'date') {
        const base = {
          ...el,
          label: r(`${el.id}.label`, el.label),
        };
        if ('placeholder' in base && base.placeholder !== undefined) {
          return { ...base, placeholder: r(`${el.id}.placeholder`, base.placeholder) } as Element;
        }
        return base as Element;
      }

      if (el.kind === 'choice') {
        return {
          ...el,
          label: r(`${el.id}.label`, el.label),
          options: el.options.map((opt) => ({
            ...opt,
            label: r(`${el.id}.option.${opt.value}`, opt.label),
          })),
        } as Element;
      }

      return el;
    }

    case 'submit':
      return {
        ...el,
        label: r(`submit.${el.id}.label`, el.label),
      };

    case 'container':
      return {
        ...el,
        children: el.children.map((child) => localizeElement(child, localeMap, locale, opts)),
      };

    default:
      return el;
  }
}

/**
 * Return a new Document with all user-visible strings replaced by their
 * localized equivalents from `localeMap[locale]`.
 *
 * Keys follow the convention documented in `LocaleMessages`.
 * Unknown keys fall back to the original string — the document is always
 * returned in a valid, renderable state regardless of translation coverage.
 */
export function localizeDocument(
  doc: Document,
  localeMap: LocaleMap,
  locale: string,
  opts?: LocalizeOptions,
): Document {
  const r = (key: string, fallback: string) => resolve(localeMap, locale, key, fallback, opts);
  return {
    ...doc,
    title: doc.title !== undefined ? r('form.title', doc.title) : undefined,
    elements: doc.elements.map((el) => localizeElement(el, localeMap, locale, opts)),
  };
}

/**
 * Return a new FormErrors object with all error messages localized.
 * Error keys follow `error.form.{message}` and `error.field.{fieldId}.{message}`.
 * Falls back to the original message if the key is absent.
 */
export function localizeErrors(
  errors: FormErrors,
  localeMap: LocaleMap,
  locale: string,
  opts?: LocalizeOptions,
): FormErrors {
  const r = (key: string, fallback: string) => resolve(localeMap, locale, key, fallback, opts);
  return {
    form: errors.form?.map((msg) => r(`error.form.${msg}`, msg)),
    fields: errors.fields !== undefined
      ? Object.fromEntries(
          Object.entries(errors.fields).map(([fieldId, msgs]) => [
            fieldId,
            msgs.map((msg) => r(`error.field.${fieldId}.${msg}`, msg)),
          ]),
        )
      : undefined,
  };
}
