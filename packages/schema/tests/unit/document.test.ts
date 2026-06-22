import { describe, it, expect } from 'vitest';
import type { Document, FormErrors } from '../../src/document.js';
import { isDocument, hasFormErrors, fieldErrorsFor } from '../../src/document.js';

const minimalDoc: Document = { version: '1', elements: [] };
const fullDoc: Document = {
  version: '1.0',
  title: 'Patient Intake',
  elements: [{ type: 'heading', level: 1, text: 'Welcome' }],
  errors: {
    form: ['Form submission failed'],
    fields: { name: ['Name is required'], dob: ['Invalid date'] },
  },
};

describe('isDocument', () => {
  it('returns true for a minimal valid document', () => {
    expect(isDocument(minimalDoc)).toBe(true);
  });

  it('returns true for a full document', () => {
    expect(isDocument(fullDoc)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isDocument(null)).toBe(false);
  });

  it('returns false for a non-object', () => {
    expect(isDocument('string')).toBe(false);
  });

  it('returns false when version is missing', () => {
    expect(isDocument({ elements: [] })).toBe(false);
  });

  it('returns false when elements is missing', () => {
    expect(isDocument({ version: '1' })).toBe(false);
  });

  it('returns false when elements is not an array', () => {
    expect(isDocument({ version: '1', elements: 'not-array' })).toBe(false);
  });
});

describe('hasFormErrors', () => {
  it('returns true when errors are present', () => {
    expect(hasFormErrors(fullDoc)).toBe(true);
  });

  it('returns false when errors are absent', () => {
    expect(hasFormErrors(minimalDoc)).toBe(false);
  });
});

describe('fieldErrorsFor', () => {
  const errors: FormErrors = {
    fields: { email: ['Email is required', 'Must be a valid email'] },
  };

  it('returns errors for a known field id', () => {
    expect(fieldErrorsFor(errors, 'email')).toEqual([
      'Email is required',
      'Must be a valid email',
    ]);
  });

  it('returns empty array for an unknown field id', () => {
    expect(fieldErrorsFor(errors, 'phone')).toEqual([]);
  });

  it('returns empty array when fields map is absent', () => {
    expect(fieldErrorsFor({}, 'email')).toEqual([]);
  });
});
