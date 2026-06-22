import Ajv from 'ajv';
import type { ValidateFunction } from 'ajv';
import type { Document } from '@renderly/schema';
import { DOCUMENT_SCHEMA } from '@renderly/schema';
import { ok, err } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import type { ValidationError, ValidationFailure } from './errors.js';

const ajv = new Ajv({ strict: true, allErrors: true });
const compiledValidate = ajv.compile(DOCUMENT_SCHEMA);

export function validateDocument(
  data: unknown,
  validate: ValidateFunction = compiledValidate,
): Result<Document, ValidationError> {
  const valid = validate(data);

  // Snapshot immediately — validate.errors is a mutable property on the shared
  // ValidateFunction instance. In concurrent SSR environments a second call can
  // overwrite it before we read it. The spread copies the array out of the shared
  // object so callers always see the errors for their own call.
  const rawErrors = [...(validate.errors ?? [])];

  if (!valid) {
    const failures: ValidationFailure[] = rawErrors.map((e) => ({
      path: e.instancePath !== '' ? e.instancePath : '/',
      message: e.message ?? 'Validation failed',
    }));
    return err<ValidationError>({ code: 'VALIDATION_ERROR', failures });
  }

  return ok(data as Document);
}
