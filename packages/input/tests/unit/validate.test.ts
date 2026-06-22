import { describe, it, expect } from 'vitest';
import type { ValidateFunction } from 'ajv';
import { validateDocument } from '../../src/validate.js';
import { isOk, isErr } from '@renderly/shared';

const minimalValid = { version: '1', elements: [] };

describe('validateDocument — valid documents', () => {
  it('accepts a minimal document', () => {
    const result = validateDocument(minimalValid);
    expect(isOk(result)).toBe(true);
  });

  it('accepts a full document with all element types', () => {
    const result = validateDocument({
      version: '1.0',
      title: 'Test',
      elements: [
        { type: 'heading', level: 1, text: 'H' },
        { type: 'text', content: 'T' },
        { type: 'container', children: [{ type: 'text', content: 'child' }] },
        { type: 'input', kind: 'text', id: 'f1', label: 'L' },
        { type: 'input', kind: 'number', id: 'f2', label: 'N' },
        { type: 'input', kind: 'date', id: 'f3', label: 'D' },
        { type: 'input', kind: 'choice', id: 'f4', label: 'C', options: [{ value: 'a', label: 'A' }] },
        { type: 'input', kind: 'file', id: 'f5', label: 'Upload' },
        { type: 'signature', id: 'sig1', label: 'Sign' },
        { type: 'custom', kind: 'rating', id: 'c1' },
        {
          type: 'repeat', id: 'meds', label: 'Medications',
          template: [{ type: 'input', kind: 'text', id: 'med-name', label: 'Name' }],
        },
        { type: 'submit', id: 's1', label: 'Go', route: '/api' },
      ],
    });
    expect(isOk(result)).toBe(true);
  });

  it('accepts a document with form errors', () => {
    const result = validateDocument({
      ...minimalValid,
      errors: { form: ['Oops'], fields: { f1: ['Required'] } },
    });
    expect(isOk(result)).toBe(true);
  });
});

describe('validateDocument — invalid documents', () => {
  it('returns VALIDATION_ERROR for null', () => {
    const result = validateDocument(null);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns VALIDATION_ERROR for non-object', () => {
    const result = validateDocument('a string');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns failures array with at least one entry', () => {
    const result = validateDocument({ elements: [] });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.failures.length).toBeGreaterThan(0);
  });

  it('uses "/" path for root-level failures (empty instancePath)', () => {
    // null is not an object — Ajv fires the root-type error with instancePath ''
    const result = validateDocument(42);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      const rootFailure = result.error.failures.find((f) => f.path === '/');
      expect(rootFailure).toBeDefined();
    }
  });

  it('includes the instancePath for nested failures', () => {
    const result = validateDocument({
      version: '1',
      elements: [{ type: 'heading', text: 'No level' }],
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      const hasSomePath = result.error.failures.some((f) => f.path !== '/');
      expect(hasSomePath).toBe(true);
    }
  });

  it('reports multiple failures when allErrors is true', () => {
    const result = validateDocument({
      version: '1',
      elements: [
        { type: 'input', kind: 'text', label: 'Name' },
        { type: 'heading', text: 'Missing level' },
      ],
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.failures.length).toBeGreaterThan(1);
  });
});

describe('validateDocument — error message fallback', () => {
  it('each failure has a non-empty message string', () => {
    const result = validateDocument({ elements: [] });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      for (const f of result.error.failures) {
        expect(typeof f.message).toBe('string');
        expect(f.message.length).toBeGreaterThan(0);
      }
    }
  });

  it('falls back to "Validation failed" when Ajv error has no message property', () => {
    const fakeError = { instancePath: '/field', keyword: 'type', schemaPath: '#/properties/field/type', params: {} };
    const mockValidate = Object.assign(
      (_data: unknown) => false as ReturnType<ValidateFunction>,
      { errors: [fakeError] },
    ) as unknown as ValidateFunction;

    const result = validateDocument({}, mockValidate);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.failures[0]?.message).toBe('Validation failed');
    }
  });

  it('returns empty failures when validator returns null errors array', () => {
    const mockValidate = Object.assign(
      (_data: unknown) => false as ReturnType<ValidateFunction>,
      { errors: null },
    ) as unknown as ValidateFunction;

    const result = validateDocument({}, mockValidate);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.failures).toEqual([]);
    }
  });
});
