export type A11yViolationCode =
  | 'HEADING_SKIP'
  | 'DUPLICATE_ID'
  | 'EMPTY_SUBMIT_LABEL'
  | 'EMPTY_CHOICE_OPTIONS'
  | 'MISSING_FIELD_LABEL'
  | 'EMPTY_FORM';

export type A11ySeverity = 'error' | 'warning';

export interface A11yViolation {
  readonly code: A11yViolationCode;
  readonly nodeType: string;
  readonly id?: string;
  readonly message: string;
  readonly severity: A11ySeverity;
}

export const A11Y_VIOLATION_CODES = {
  HEADING_SKIP:          'HEADING_SKIP',
  DUPLICATE_ID:          'DUPLICATE_ID',
  EMPTY_SUBMIT_LABEL:    'EMPTY_SUBMIT_LABEL',
  EMPTY_CHOICE_OPTIONS:  'EMPTY_CHOICE_OPTIONS',
  MISSING_FIELD_LABEL:   'MISSING_FIELD_LABEL',
  EMPTY_FORM:            'EMPTY_FORM',
} as const satisfies Record<A11yViolationCode, A11yViolationCode>;
