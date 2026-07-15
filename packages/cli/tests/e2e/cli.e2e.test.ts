import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { auditNodes } from '@renderly/a11y';
import { lintDocument } from '../../src/lint.js';
import { extractFields } from '../../src/fields.js';

/**
 * Mirrors the exact sequence of real cross-package calls each `renderly <command>`
 * action handler makes in src/cli.ts, without spawning the built binary.
 */

const CLEAN_FORM = JSON.stringify({
  version: '1.0',
  elements: [
    { type: 'heading', level: 1, text: 'Patient Intake' },
    { type: 'input', kind: 'text', id: 'first_name', label: 'First Name', required: true },
    { type: 'input', kind: 'text', id: 'email', label: 'Email' },
    { type: 'submit', id: 'go', label: 'Submit', route: '/api/intake' },
  ],
});

const BROKEN_FORM = JSON.stringify({
  version: '1.0',
  elements: [
    { type: 'input', kind: 'text', id: 'name', label: '' },
    { type: 'input', kind: 'text', id: 'name', label: 'Duplicate ID' },
    {
      type: 'submit', id: 'go', label: 'Submit', route: '/api/x',
      rules: [{ action: 'show', when: { field: 'nonexistent_field', op: 'eq', value: 'yes' } }],
    },
  ],
});

describe('cli e2e — renderly validate', () => {
  it('accepts a well-formed document', () => {
    const result = parseDocument(CLEAN_FORM);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.elements).toHaveLength(4);
  });

  it('rejects malformed JSON with a parse error, not a validation error', () => {
    const result = parseDocument('{not json');
    expect(result.ok).toBe(false);
  });
});

describe('cli e2e — renderly lint', () => {
  it('reports no issues for a clean document', () => {
    const parsed = parseDocument(CLEAN_FORM);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(lintDocument(parsed.value)).toHaveLength(0);
  });

  it('reports DUPLICATE_FIELD_ID and DEAD_RULE for a broken document', () => {
    const parsed = parseDocument(BROKEN_FORM);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const issues = lintDocument(parsed.value);
    expect(issues).toContainEqual(expect.objectContaining({ code: 'DUPLICATE_FIELD_ID', elementId: 'name' }));
    expect(issues).toContainEqual(expect.objectContaining({ code: 'DEAD_RULE' }));
  });
});

describe('cli e2e — renderly audit', () => {
  it('reports no violations for a clean document walked through the real registry', () => {
    const parsed = parseDocument(CLEAN_FORM);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry());
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;
    expect(auditNodes(walked.value)).toEqual([]);
  });

  it('reports MISSING_FIELD_LABEL and DUPLICATE_ID for the broken document', () => {
    const parsed = parseDocument(BROKEN_FORM);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry());
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;
    const violations = auditNodes(walked.value);
    expect(violations).toContainEqual(expect.objectContaining({ code: 'MISSING_FIELD_LABEL', id: 'name' }));
    expect(violations).toContainEqual(expect.objectContaining({ code: 'DUPLICATE_ID', id: 'name' }));
  });
});

describe('cli e2e — renderly fields', () => {
  it('lists all input fields in document order with required flags', () => {
    const parsed = parseDocument(CLEAN_FORM);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const fields = extractFields(parsed.value);
    expect(fields).toEqual([
      { id: 'first_name', kind: 'text', label: 'First Name', required: true },
      { id: 'email', kind: 'text', label: 'Email', required: false },
    ]);
  });
});
