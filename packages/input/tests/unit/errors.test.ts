import { describe, it, expect } from 'vitest';
import type { InputError } from '../../src/errors.js';
import { isParseError, isValidationError } from '../../src/errors.js';

const parseErr: InputError = { code: 'PARSE_ERROR', message: 'Unexpected token' };
const validationErr: InputError = {
  code: 'VALIDATION_ERROR',
  failures: [{ path: '/', message: 'must have required property version' }],
};

describe('isParseError', () => {
  it('returns true for a PARSE_ERROR', () => expect(isParseError(parseErr)).toBe(true));
  it('returns false for a VALIDATION_ERROR', () => expect(isParseError(validationErr)).toBe(false));
});

describe('isValidationError', () => {
  it('returns true for a VALIDATION_ERROR', () => expect(isValidationError(validationErr)).toBe(true));
  it('returns false for a PARSE_ERROR', () => expect(isValidationError(parseErr)).toBe(false));
});
