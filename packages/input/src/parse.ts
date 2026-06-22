import { ok, err } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import type { ParseError } from './errors.js';

export function parseJson(raw: string): Result<unknown, ParseError> {
  try {
    return ok(JSON.parse(raw));
  } catch (e) {
    return err<ParseError>({
      code: 'PARSE_ERROR',
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
