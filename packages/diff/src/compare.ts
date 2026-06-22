import type { FieldValue, FieldValues } from '@renderly/schema';

/** Structural equality for FieldValue (handles string[], number, string). */
export function fieldValuesEqual(a: FieldValue, b: FieldValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  return a === b;
}

/** Stringify a FieldValue for display purposes. */
export function formatFieldValue(value: FieldValue): string {
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/** Return all keys present in at least one of the two maps. */
export function allKeys(before: FieldValues, after: FieldValues): string[] {
  return Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
}
