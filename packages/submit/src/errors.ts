export type PayloadErrorCode = 'MISSING_REQUIRED_FIELD';

export interface FieldPayloadError {
  readonly code: PayloadErrorCode;
  readonly fieldId: string;
  readonly message: string;
}

export interface PayloadError {
  readonly code: 'PAYLOAD_ERROR';
  readonly failures: readonly FieldPayloadError[];
}

export const SUBMIT_ERROR_CODES = {
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  PAYLOAD_ERROR: 'PAYLOAD_ERROR',
} as const;
