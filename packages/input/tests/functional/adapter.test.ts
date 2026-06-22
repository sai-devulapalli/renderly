import { describe, it, expect } from 'vitest';
import { parseDocument, parseDocumentObject } from '../../src/adapter.js';
import { isOk, isErr } from '@renderly/shared';
import { isParseError, isValidationError } from '../../src/errors.js';

describe('parseDocument — happy path', () => {
  it('accepts a minimal valid JSON document', () => {
    const result = parseDocument('{"version":"1","elements":[]}');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.version).toBe('1');
      expect(result.value.elements).toEqual([]);
    }
  });

  it('accepts a document with all element types', () => {
    const raw = JSON.stringify({
      version: '1.0',
      title: 'Full Form',
      elements: [
        { type: 'heading', level: 2, text: 'Section' },
        { type: 'text', content: 'Fill in details' },
        {
          type: 'container', direction: 'row', gap: 'sm',
          children: [
            { type: 'input', kind: 'text', id: 'first', label: 'First' },
            { type: 'input', kind: 'text', id: 'last', label: 'Last' },
          ],
        },
        { type: 'input', kind: 'date', id: 'dob', label: 'DOB' },
        { type: 'input', kind: 'number', id: 'age', label: 'Age', min: 0, max: 120 },
        {
          type: 'input', kind: 'choice', id: 'sex', label: 'Sex',
          options: [{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }],
        },
        { type: 'submit', id: 'sub', label: 'Submit', route: '/submit' },
      ],
    });
    const result = parseDocument(raw);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value.elements).toHaveLength(7);
  });
});

describe('parseDocument — parse failures', () => {
  it('returns PARSE_ERROR for invalid JSON', () => {
    const result = parseDocument('not { json }');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(isParseError(result.error)).toBe(true);
  });

  it('returns PARSE_ERROR for empty string', () => {
    const result = parseDocument('');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(isParseError(result.error)).toBe(true);
  });
});

describe('parseDocument — validation failures', () => {
  it('returns VALIDATION_ERROR for valid JSON that fails schema', () => {
    const result = parseDocument('{"elements":[]}');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(isValidationError(result.error)).toBe(true);
      if (isValidationError(result.error)) {
        expect(result.error.failures.length).toBeGreaterThan(0);
      }
    }
  });

  it('returns path-located failures for nested schema violations', () => {
    const result = parseDocument(JSON.stringify({
      version: '1',
      elements: [{ type: 'input', kind: 'text', label: 'No ID' }],
    }));
    expect(isErr(result)).toBe(true);
    if (isErr(result) && isValidationError(result.error)) {
      const paths = result.error.failures.map((f) => f.path);
      expect(paths.some((p) => p.includes('elements'))).toBe(true);
    }
  });
});

describe('parseDocumentObject', () => {
  it('validates a pre-parsed object and returns ok', () => {
    const result = parseDocumentObject({ version: '1', elements: [] });
    expect(isOk(result)).toBe(true);
  });

  it('returns VALIDATION_ERROR for invalid object', () => {
    const result = parseDocumentObject({ elements: [] });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(isValidationError(result.error)).toBe(true);
  });
});
