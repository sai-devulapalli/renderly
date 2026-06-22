export type InputErrorCode = 'PARSE_ERROR' | 'VALIDATION_ERROR';

export interface ParseError {
  readonly code: 'PARSE_ERROR';
  readonly message: string;
}

export interface ValidationFailure {
  readonly path: string;
  readonly message: string;
}

export interface ValidationError {
  readonly code: 'VALIDATION_ERROR';
  readonly failures: readonly ValidationFailure[];
}

export type InputError = ParseError | ValidationError;

export const INPUT_ERROR_CODES = {
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const satisfies Record<InputErrorCode, InputErrorCode>;

export function isParseError(e: InputError): e is ParseError {
  return e.code === 'PARSE_ERROR';
}

export function isValidationError(e: InputError): e is ValidationError {
  return e.code === 'VALIDATION_ERROR';
}
