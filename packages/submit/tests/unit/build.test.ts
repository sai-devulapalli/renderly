import { describe, it, expect } from 'vitest';
import type { FieldDescriptor } from '../../src/types.js';
import { buildPayload } from '../../src/build.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function textField(id: string, required: boolean): FieldDescriptor {
  return { id, kind: 'text', label: id, required, multiple: false };
}

function choiceField(id: string, required: boolean, multiple = false): FieldDescriptor {
  return { id, kind: 'choice', label: id, required, multiple };
}

// ── isEmptyValue (tested through buildPayload) ────────────────────────────────

describe('buildPayload — isEmptyValue branches', () => {
  const field = textField('x', true);

  it('treats undefined value as empty (missing key in values)', () => {
    const result = buildPayload([field], {}, '/route');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.failures[0]?.fieldId).toBe('x');
  });

  it('treats empty string as empty', () => {
    const result = buildPayload([field], { x: '' }, '/route');
    expect(result.ok).toBe(false);
  });

  it('treats non-empty string as present', () => {
    const result = buildPayload([field], { x: 'hello' }, '/route');
    expect(result.ok).toBe(true);
  });

  it('treats zero (number) as present — not empty', () => {
    const numField: FieldDescriptor = { id: 'n', kind: 'number', label: 'N', required: true, multiple: false };
    const result = buildPayload([numField], { n: 0 }, '/route');
    expect(result.ok).toBe(true);
  });

  it('treats empty array as empty', () => {
    const cf = choiceField('tags', true, true);
    const result = buildPayload([cf], { tags: [] }, '/route');
    expect(result.ok).toBe(false);
  });

  it('treats non-empty array as present', () => {
    const cf = choiceField('tags', true, true);
    const result = buildPayload([cf], { tags: ['a', 'b'] }, '/route');
    expect(result.ok).toBe(true);
  });
});

// ── required/optional logic ───────────────────────────────────────────────────

describe('buildPayload — required field validation', () => {
  it('skips validation for optional fields with empty value', () => {
    const optional = textField('note', false);
    const result = buildPayload([optional], { note: '' }, '/route');
    expect(result.ok).toBe(true);
  });

  it('skips validation for optional fields with missing value', () => {
    const optional = textField('note', false);
    const result = buildPayload([optional], {}, '/route');
    expect(result.ok).toBe(true);
  });

  it('collects all missing required fields — not just the first', () => {
    const fields = [textField('a', true), textField('b', true), textField('c', true)];
    const result = buildPayload(fields, {}, '/route');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.failures).toHaveLength(3);
      expect(result.error.failures.map((f) => f.fieldId)).toEqual(['a', 'b', 'c']);
    }
  });

  it('only reports missing required fields, not satisfied ones', () => {
    const fields = [textField('a', true), textField('b', true), textField('c', false)];
    const result = buildPayload(fields, { a: 'yes' }, '/route');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.failures).toHaveLength(1);
      expect(result.error.failures[0]?.fieldId).toBe('b');
    }
  });
});

// ── successful payload ────────────────────────────────────────────────────────

describe('buildPayload — success', () => {
  it('builds a payload with route, fields, and default empty context', () => {
    const fields = [textField('name', true)];
    const result = buildPayload(fields, { name: 'Alice' }, '/api/form');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.route).toBe('/api/form');
      expect(result.value.fields).toEqual({ name: 'Alice' });
      expect(result.value.context).toEqual({});
    }
  });

  it('passes explicit context through to the payload', () => {
    const fields = [textField('q', false)];
    const ctx = { token: 'abc', version: 2 };
    const result = buildPayload(fields, { q: 'search' }, '/search', ctx);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.context).toEqual(ctx);
    }
  });

  it('includes optional-field values in the payload', () => {
    const fields = [textField('opt', false)];
    const result = buildPayload(fields, { opt: 'value' }, '/route');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fields['opt']).toBe('value');
    }
  });

  it('builds a payload for empty fields list', () => {
    const result = buildPayload([], {}, '/route');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fields).toEqual({});
    }
  });
});

// ── error shape ───────────────────────────────────────────────────────────────

describe('buildPayload — error shape', () => {
  it('error has code PAYLOAD_ERROR', () => {
    const result = buildPayload([textField('x', true)], {}, '/route');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('PAYLOAD_ERROR');
    }
  });

  it('failure entries have code MISSING_REQUIRED_FIELD', () => {
    const result = buildPayload([textField('x', true)], {}, '/route');
    if (!result.ok) {
      expect(result.error.failures[0]?.code).toBe('MISSING_REQUIRED_FIELD');
    }
  });

  it('failure message names the field id', () => {
    const result = buildPayload([textField('email', true)], {}, '/route');
    if (!result.ok) {
      expect(result.error.failures[0]?.message).toContain('email');
    }
  });
});
