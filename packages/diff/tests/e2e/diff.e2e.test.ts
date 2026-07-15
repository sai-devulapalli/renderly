import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { extractFields } from '@renderly/submit';
import { buildPayload } from '@renderly/submit';
import { diffValues, isEmptyDiff } from '../../src/index.js';

const FORM_JSON = JSON.stringify({
  version: '1.0',
  elements: [
    { type: 'input', kind: 'text', id: 'first_name', label: 'First Name', required: true },
    { type: 'input', kind: 'text', id: 'email', label: 'Email', required: true },
    { type: 'input', kind: 'choice', id: 'plan', label: 'Plan', options: [
      { value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' },
    ] },
    { type: 'submit', id: 'go', label: 'Submit', route: '/api/signup' },
  ],
});

describe('diff e2e — parseDocument → extractFields → buildPayload (submit) → diffValues (diff)', () => {
  it('reports no diff between two identical real submissions', () => {
    const parsed = parseDocument(FORM_JSON);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const fields = extractFields(parsed.value);
    const values = { first_name: 'Ada', email: 'ada@example.com', plan: 'basic' };

    const before = buildPayload(fields, values, '/api/signup');
    const after = buildPayload(fields, values, '/api/signup');
    expect(before.ok && after.ok).toBe(true);
    if (!before.ok || !after.ok) return;

    const diff = diffValues(before.value.fields, after.value.fields);
    expect(isEmptyDiff(diff)).toBe(true);
  });

  it('reports a changed field between two real submissions of the same form', () => {
    const parsed = parseDocument(FORM_JSON);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const fields = extractFields(parsed.value);
    const before = buildPayload(fields, { first_name: 'Ada', email: 'ada@example.com', plan: 'basic' }, '/api/signup');
    const after = buildPayload(fields, { first_name: 'Ada', email: 'ada@example.com', plan: 'pro' }, '/api/signup');
    expect(before.ok && after.ok).toBe(true);
    if (!before.ok || !after.ok) return;

    const diff = diffValues(before.value.fields, after.value.fields);
    expect(isEmptyDiff(diff)).toBe(false);
    expect(diff.changed).toEqual([{ field: 'plan', from: 'basic', to: 'pro' }]);
    expect(diff.unchanged).toEqual(expect.arrayContaining(['first_name', 'email']));
  });

  it('rejects a payload missing a required field before diff ever sees it', () => {
    const parsed = parseDocument(FORM_JSON);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const fields = extractFields(parsed.value);
    const incomplete = buildPayload(fields, { first_name: 'Ada' }, '/api/signup');
    expect(incomplete.ok).toBe(false);
  });
});
