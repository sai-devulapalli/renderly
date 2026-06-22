import type { FieldValues } from '@renderly/schema';
import type { ValuesDiff, FieldDiff } from './types.js';
import { fieldValuesEqual, allKeys } from './compare.js';

/**
 * Compare two FieldValues snapshots and return a structured diff.
 *
 * Fields whose values are undefined in both snapshots are not reported.
 */
export function diffValues(before: FieldValues, after: FieldValues): ValuesDiff {
  const changed: FieldDiff[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];

  for (const field of allKeys(before, after)) {
    const prev = before[field];
    const next = after[field];

    if (prev === undefined && next !== undefined) {
      added.push(field);
    } else if (prev !== undefined && next === undefined) {
      removed.push(field);
    } else if (prev !== undefined && next !== undefined) {
      if (fieldValuesEqual(prev, next)) {
        unchanged.push(field);
      } else {
        changed.push({ field, from: prev, to: next });
      }
    }
  }

  return { changed, added, removed, unchanged };
}
