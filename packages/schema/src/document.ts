import type { Element } from './elements.js';

export interface FormErrors {
  readonly form?: readonly string[];
  readonly fields?: Readonly<Record<string, readonly string[]>>;
}

export interface Document {
  readonly version: string;
  readonly title?: string;
  readonly elements: readonly Element[];
  readonly errors?: FormErrors;
}

export function isDocument(value: unknown): value is Document {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['version'] === 'string' && Array.isArray(v['elements']);
}

export function hasFormErrors(doc: Document): doc is Document & { errors: FormErrors } {
  return doc.errors !== undefined;
}

export function fieldErrorsFor(errors: FormErrors, fieldId: string): readonly string[] {
  return errors.fields?.[fieldId] ?? [];
}
