import { describe, it, expect, beforeAll } from 'vitest';
import Ajv from 'ajv';
import schema from '../../src/json-schema/document.schema.json' assert { type: 'json' };
import {
  isContainerElement,
  isInputElement,
  isSubmitElement,
  isTextInput,
} from '../../src/elements.js';
import { isDocument, hasFormErrors, fieldErrorsFor } from '../../src/document.js';
import type { Document } from '../../src/document.js';

let validate: ReturnType<Ajv['compile']>;

beforeAll(() => {
  validate = new Ajv({ strict: true }).compile(schema);
});

const patientIntakeRaw = {
  version: '1.0',
  title: 'Patient Intake Form',
  elements: [
    { type: 'heading', level: 1, text: 'Patient Intake Form' },
    { type: 'text', content: 'Please complete all required fields.' },
    {
      type: 'container',
      direction: 'row',
      gap: 'md',
      children: [
        { type: 'input', kind: 'text', id: 'first-name', label: 'First Name', required: true },
        { type: 'input', kind: 'text', id: 'last-name', label: 'Last Name', required: true },
      ],
    },
    { type: 'input', kind: 'date', id: 'dob', label: 'Date of Birth', required: true },
    {
      type: 'input', kind: 'choice', id: 'gender', label: 'Gender',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
        { value: 'prefer-not', label: 'Prefer not to say' },
      ],
    },
    { type: 'input', kind: 'number', id: 'age', label: 'Age', min: 0, max: 150 },
    { type: 'submit', id: 'intake-submit', label: 'Submit Intake', route: '/api/intake/submit' },
  ],
};

describe('full patient intake form', () => {
  it('passes JSON Schema validation', () => {
    expect(validate(patientIntakeRaw)).toBe(true);
  });

  it('is recognised as a Document', () => {
    expect(isDocument(patientIntakeRaw)).toBe(true);
  });

  it('has no errors by default', () => {
    expect(hasFormErrors(patientIntakeRaw as Document)).toBe(false);
  });

  it('elements are correctly typed via guards', () => {
    const doc = patientIntakeRaw as Document;
    const [, , container, , , , sub] = doc.elements;
    expect(isContainerElement(container!)).toBe(true);
    expect(isSubmitElement(sub!)).toBe(true);
  });

  it('nested container children are accessible and typed', () => {
    const doc = patientIntakeRaw as Document;
    const container = doc.elements[2]!;
    if (!isContainerElement(container)) throw new Error('expected container');
    const [firstName] = container.children;
    expect(isInputElement(firstName!)).toBe(true);
    if (!isInputElement(firstName!)) throw new Error('expected input');
    expect(isTextInput(firstName)).toBe(true);
  });
});

describe('document with field errors', () => {
  const docWithErrors: Document = {
    ...(patientIntakeRaw as Document),
    errors: {
      form: ['Please fix the errors below'],
      fields: {
        'first-name': ['First name is required'],
        dob: ['Date of birth is required', 'Must be in the past'],
      },
    },
  };

  it('passes JSON Schema validation with errors', () => {
    expect(validate(docWithErrors)).toBe(true);
  });

  it('hasFormErrors returns true', () => {
    expect(hasFormErrors(docWithErrors)).toBe(true);
  });

  it('fieldErrorsFor returns correct messages', () => {
    expect(fieldErrorsFor(docWithErrors.errors!, 'first-name')).toEqual([
      'First name is required',
    ]);
    expect(fieldErrorsFor(docWithErrors.errors!, 'dob')).toHaveLength(2);
  });

  it('fieldErrorsFor returns empty array for field with no errors', () => {
    expect(fieldErrorsFor(docWithErrors.errors!, 'gender')).toEqual([]);
  });
});
