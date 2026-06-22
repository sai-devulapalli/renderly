import type { FieldValue, FieldValues } from '@renderly/schema';

export type { FieldValue, FieldValues };

export interface FieldDiff {
  readonly field: string;
  readonly from: FieldValue;
  readonly to: FieldValue;
}

export interface ValuesDiff {
  /** Fields present in both snapshots whose values changed. */
  readonly changed: readonly FieldDiff[];
  /** Fields present in `after` but not in `before`. */
  readonly added: readonly string[];
  /** Fields present in `before` but not in `after`. */
  readonly removed: readonly string[];
  /** Fields present in both snapshots whose values are equal. */
  readonly unchanged: readonly string[];
}

export function isEmptyDiff(diff: ValuesDiff): boolean {
  return diff.changed.length === 0 && diff.added.length === 0 && diff.removed.length === 0;
}
