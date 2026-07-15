import { describe, it, expect } from 'vitest';
import { A11Y_VIOLATION_CODES } from '../../src/types.js';

describe('A11Y_VIOLATION_CODES', () => {
  it('maps each violation code to itself', () => {
    expect(A11Y_VIOLATION_CODES.HEADING_SKIP).toBe('HEADING_SKIP');
    expect(A11Y_VIOLATION_CODES.DUPLICATE_ID).toBe('DUPLICATE_ID');
    expect(A11Y_VIOLATION_CODES.EMPTY_SUBMIT_LABEL).toBe('EMPTY_SUBMIT_LABEL');
    expect(A11Y_VIOLATION_CODES.EMPTY_CHOICE_OPTIONS).toBe('EMPTY_CHOICE_OPTIONS');
    expect(A11Y_VIOLATION_CODES.MISSING_FIELD_LABEL).toBe('MISSING_FIELD_LABEL');
    expect(A11Y_VIOLATION_CODES.EMPTY_FORM).toBe('EMPTY_FORM');
  });
});
