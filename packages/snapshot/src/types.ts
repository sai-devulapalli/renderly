import type { FieldValues } from '@renderly/schema';

export interface SnapshotOptions {
  /**
   * Values to display in the snapshot. Fields with no value show a blank placeholder.
   */
  readonly values: FieldValues;
  /**
   * Text shown when a field has no submitted value. Defaults to "—".
   */
  readonly emptyPlaceholder?: string;
  /**
   * When true, fields that have no submitted value AND are not required are omitted.
   * Defaults to false (show all fields).
   */
  readonly omitEmpty?: boolean;
}
