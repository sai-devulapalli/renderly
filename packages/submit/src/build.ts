import { ok, err } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import type { FieldValue, FieldDescriptor, SubmitPayload } from './types.js';
import type { PayloadError, FieldPayloadError } from './errors.js';

function isEmptyValue(value: FieldValue | undefined): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'number') return false;
  return value === '';
}

/**
 * Validates required fields and builds a typed submit payload.
 * Returns err with all missing-required-field failures; never throws.
 */
export function buildPayload(
  fields: readonly FieldDescriptor[],
  values: Readonly<Record<string, FieldValue>>,
  route: string,
  context: Readonly<Record<string, unknown>> = {},
): Result<SubmitPayload, PayloadError> {
  const failures: FieldPayloadError[] = [];

  for (const field of fields) {
    if (field.required && isEmptyValue(values[field.id])) {
      failures.push({
        code: 'MISSING_REQUIRED_FIELD',
        fieldId: field.id,
        message: `Field '${field.id}' is required`,
      });
    }
  }

  if (failures.length > 0) {
    return err<PayloadError>({ code: 'PAYLOAD_ERROR', failures });
  }

  return ok<SubmitPayload>({ route, context, fields: { ...values } });
}
