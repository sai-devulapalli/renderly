import { describe, it, expect } from 'vitest';
import type { Document, FormErrors } from '@renderly/schema';
import { applyErrors } from '../../src/apply.js';

const BASE_DOC: Document = {
  version: '1',
  elements: [{ type: 'input', kind: 'text', id: 'name', label: 'Name' }],
};

describe('applyErrors', () => {
  it('returns a new document object (does not mutate)', () => {
    const errors: FormErrors = { form: ['Something went wrong'] };
    const result = applyErrors(BASE_DOC, errors);
    expect(result).not.toBe(BASE_DOC);
  });

  it('merges form-level errors onto the document', () => {
    const errors: FormErrors = { form: ['Server error'] };
    const result = applyErrors(BASE_DOC, errors);
    expect(result.errors).toEqual(errors);
  });

  it('merges field-level errors onto the document', () => {
    const errors: FormErrors = { fields: { name: ['Name is required'] } };
    const result = applyErrors(BASE_DOC, errors);
    expect(result.errors?.fields?.['name']).toEqual(['Name is required']);
  });

  it('merges both form and field errors at once', () => {
    const errors: FormErrors = {
      form: ['Submission failed'],
      fields: { email: ['Invalid email'] },
    };
    const result = applyErrors(BASE_DOC, errors);
    expect(result.errors?.form).toEqual(['Submission failed']);
    expect(result.errors?.fields?.['email']).toEqual(['Invalid email']);
  });

  it('preserves all other document properties', () => {
    const doc: Document = { ...BASE_DOC, title: 'My Form', version: '2' };
    const errors: FormErrors = { form: ['Oops'] };
    const result = applyErrors(doc, errors);
    expect(result.version).toBe('2');
    expect(result.title).toBe('My Form');
    expect(result.elements).toBe(doc.elements);
  });

  it('overwrites existing errors on a document that already has errors', () => {
    const docWithErrors: Document = {
      ...BASE_DOC,
      errors: { form: ['Old error'] },
    };
    const newErrors: FormErrors = { form: ['New error'] };
    const result = applyErrors(docWithErrors, newErrors);
    expect(result.errors?.form).toEqual(['New error']);
  });

  it('applies an empty FormErrors object without removing other fields', () => {
    const errors: FormErrors = {};
    const result = applyErrors(BASE_DOC, errors);
    expect(result.errors).toEqual({});
    expect(result.elements).toBe(BASE_DOC.elements);
  });

  it('accepts errors for a fieldId that does not exist in the document', () => {
    // Server may return validation errors for removed or renamed fields.
    // applyErrors must store them faithfully — walk() is responsible for ignoring unknowns.
    const errors: FormErrors = { fields: { ghost_field: ['This field was removed from the form'] } };
    const result = applyErrors(BASE_DOC, errors);
    expect(result.errors?.fields?.['ghost_field']).toEqual(['This field was removed from the form']);
    expect(result.elements).toBe(BASE_DOC.elements);
  });

  it('stores mixed known and unknown fieldId errors', () => {
    const errors: FormErrors = {
      fields: {
        name: ['Required'],
        removed_field: ['Field no longer exists'],
      },
    };
    const result = applyErrors(BASE_DOC, errors);
    expect(result.errors?.fields?.['name']).toEqual(['Required']);
    expect(result.errors?.fields?.['removed_field']).toEqual(['Field no longer exists']);
  });
});
