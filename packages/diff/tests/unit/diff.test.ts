import { describe, it, expect } from 'vitest';
import { diffValues, fieldValuesEqual, formatFieldValue, isEmptyDiff } from '../../src/index.js';
import type { FieldValues } from '@renderly/schema';

// ── fieldValuesEqual ──────────────────────────────────────────────────────────

describe('fieldValuesEqual', () => {
  it('equal strings return true', () => {
    expect(fieldValuesEqual('hello', 'hello')).toBe(true);
  });
  it('different strings return false', () => {
    expect(fieldValuesEqual('hello', 'world')).toBe(false);
  });
  it('equal numbers return true', () => {
    expect(fieldValuesEqual(42, 42)).toBe(true);
  });
  it('different numbers return false', () => {
    expect(fieldValuesEqual(1, 2)).toBe(false);
  });
  it('equal arrays return true', () => {
    expect(fieldValuesEqual(['a', 'b'], ['a', 'b'])).toBe(true);
  });
  it('different array contents return false', () => {
    expect(fieldValuesEqual(['a', 'b'], ['a', 'c'])).toBe(false);
  });
  it('different array lengths return false', () => {
    expect(fieldValuesEqual(['a'], ['a', 'b'])).toBe(false);
  });
  it('string vs number returns false', () => {
    expect(fieldValuesEqual('1', 1 as unknown as string)).toBe(false);
  });
  it('empty arrays are equal', () => {
    expect(fieldValuesEqual([], [])).toBe(true);
  });
});

// ── formatFieldValue ──────────────────────────────────────────────────────────

describe('formatFieldValue', () => {
  it('formats a string as-is', () => {
    expect(formatFieldValue('hello')).toBe('hello');
  });
  it('formats a number as a string', () => {
    expect(formatFieldValue(42)).toBe('42');
  });
  it('joins an array with comma+space', () => {
    expect(formatFieldValue(['a', 'b', 'c'])).toBe('a, b, c');
  });
  it('formats an empty array as empty string', () => {
    expect(formatFieldValue([])).toBe('');
  });
});

// ── diffValues ────────────────────────────────────────────────────────────────

describe('diffValues — basic cases', () => {
  it('returns empty diff for identical snapshots', () => {
    const snap: FieldValues = { name: 'Alice', age: 30 };
    const diff = diffValues(snap, snap);
    expect(diff.changed).toHaveLength(0);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.unchanged).toContain('name');
    expect(diff.unchanged).toContain('age');
  });

  it('detects changed fields', () => {
    const before: FieldValues = { name: 'Alice' };
    const after: FieldValues  = { name: 'Bob' };
    const diff = diffValues(before, after);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]).toMatchObject({ field: 'name', from: 'Alice', to: 'Bob' });
  });

  it('detects added fields', () => {
    const before: FieldValues = { name: 'Alice' };
    const after: FieldValues  = { name: 'Alice', email: 'alice@example.com' };
    const diff = diffValues(before, after);
    expect(diff.added).toContain('email');
    expect(diff.changed).toHaveLength(0);
  });

  it('detects removed fields', () => {
    const before: FieldValues = { name: 'Alice', phone: '555-1234' };
    const after: FieldValues  = { name: 'Alice' };
    const diff = diffValues(before, after);
    expect(diff.removed).toContain('phone');
    expect(diff.changed).toHaveLength(0);
  });

  it('handles both snapshots empty', () => {
    const diff = diffValues({}, {});
    expect(isEmptyDiff(diff)).toBe(true);
    expect(diff.unchanged).toHaveLength(0);
  });

  it('handles before empty (all fields added)', () => {
    const diff = diffValues({}, { a: '1', b: '2' });
    expect(diff.added).toContain('a');
    expect(diff.added).toContain('b');
    expect(diff.changed).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  it('handles after empty (all fields removed)', () => {
    const diff = diffValues({ a: '1', b: '2' }, {});
    expect(diff.removed).toContain('a');
    expect(diff.removed).toContain('b');
    expect(diff.changed).toHaveLength(0);
    expect(diff.added).toHaveLength(0);
  });
});

describe('diffValues — array values', () => {
  it('detects changed array fields', () => {
    const before: FieldValues = { diagnoses: ['flu'] };
    const after: FieldValues  = { diagnoses: ['flu', 'anemia'] };
    const diff = diffValues(before, after);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]?.field).toBe('diagnoses');
  });

  it('identical arrays are unchanged', () => {
    const before: FieldValues = { tags: ['a', 'b'] };
    const after: FieldValues  = { tags: ['a', 'b'] };
    const diff = diffValues(before, after);
    expect(diff.unchanged).toContain('tags');
    expect(diff.changed).toHaveLength(0);
  });
});

describe('diffValues — multiple changes', () => {
  it('classifies multiple fields correctly', () => {
    const before: FieldValues = { name: 'Alice', age: 30, phone: '555' };
    const after: FieldValues  = { name: 'Bob',   age: 30, email: 'b@x.com' };
    const diff = diffValues(before, after);

    expect(diff.changed.map((d) => d.field)).toContain('name');
    expect(diff.unchanged).toContain('age');
    expect(diff.removed).toContain('phone');
    expect(diff.added).toContain('email');
  });
});

// ── isEmptyDiff ───────────────────────────────────────────────────────────────

describe('isEmptyDiff', () => {
  it('returns true when no changes, adds, or removes', () => {
    const diff = diffValues({ x: '1' }, { x: '1' });
    expect(isEmptyDiff(diff)).toBe(true);
  });

  it('returns false when there are changes', () => {
    const diff = diffValues({ x: '1' }, { x: '2' });
    expect(isEmptyDiff(diff)).toBe(false);
  });
});
