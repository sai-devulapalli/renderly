import { isOk } from '@renderly/shared';
import type { Logger, Result } from '@renderly/shared';
import type { Document } from '@renderly/schema';
import type { InputError, ValidationError } from './errors.js';
import { parseJson } from './parse.js';
import { validateDocument } from './validate.js';

export interface ParseDocumentOptions {
  readonly logger?: Logger;
}

export function parseDocument(
  raw: string,
  opts?: ParseDocumentOptions,
): Result<Document, InputError> {
  const logger = opts?.logger;
  const parseResult = parseJson(raw);
  if (!isOk(parseResult)) {
    logger?.warn('parse:failed', { code: parseResult.error.code });
    return parseResult;
  }
  const result = validateDocument(parseResult.value);
  if (!isOk(result)) {
    // Log paths only — never log field values or raw document content
    logger?.warn('parse:invalid', {
      code: result.error.code,
      failureCount: result.error.failures.length,
      paths: result.error.failures.map((f) => f.path),
    });
  }
  return result;
}

export function parseDocumentObject(
  data: unknown,
  opts?: ParseDocumentOptions,
): Result<Document, ValidationError> {
  const logger = opts?.logger;
  const result = validateDocument(data);
  if (!isOk(result)) {
    logger?.warn('parse:invalid', {
      code: result.error.code,
      failureCount: result.error.failures.length,
      paths: result.error.failures.map((f) => f.path),
    });
  }
  return result;
}
