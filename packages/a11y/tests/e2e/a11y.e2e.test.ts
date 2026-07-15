import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { auditNodes } from '../../src/index.js';

function auditJson(json: string) {
  const parsed = parseDocument(json);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error('unreachable');
  const walked = walk(parsed.value, createDefaultRegistry());
  expect(walked.ok).toBe(true);
  if (!walked.ok) throw new Error('unreachable');
  return auditNodes(walked.value);
}

describe('a11y e2e — parseDocument → walk → auditNodes', () => {
  it('reports no violations for a clean, realistic form', () => {
    const violations = auditJson(JSON.stringify({
      version: '1.0',
      elements: [
        { type: 'heading', level: 1, text: 'Patient Intake' },
        { type: 'input', kind: 'text', id: 'first_name', label: 'First Name', required: true },
        {
          type: 'input', kind: 'choice', id: 'insurance', label: 'Insurance Provider', required: true,
          options: [{ value: 'aetna', label: 'Aetna' }, { value: 'cigna', label: 'Cigna' }],
        },
        { type: 'submit', id: 'go', label: 'Submit', route: '/api/intake' },
      ],
    }));
    expect(violations).toEqual([]);
  });

  it('surfaces MISSING_FIELD_LABEL through the real pipeline', () => {
    const violations = auditJson(JSON.stringify({
      version: '1.0',
      elements: [{ type: 'input', kind: 'text', id: 'mystery', label: '' }],
    }));
    expect(violations).toContainEqual(expect.objectContaining({ code: 'MISSING_FIELD_LABEL', id: 'mystery' }));
  });

  it('surfaces DUPLICATE_ID for two elements sharing an id, nested inside a container', () => {
    const violations = auditJson(JSON.stringify({
      version: '1.0',
      elements: [
        { type: 'input', kind: 'text', id: 'dup', label: 'First' },
        { type: 'container', children: [{ type: 'input', kind: 'number', id: 'dup', label: 'Second' }] },
      ],
    }));
    expect(violations).toContainEqual(expect.objectContaining({ code: 'DUPLICATE_ID', id: 'dup' }));
  });

  it('surfaces HEADING_SKIP when a document jumps from h1 straight to h3', () => {
    const violations = auditJson(JSON.stringify({
      version: '1.0',
      elements: [
        { type: 'heading', level: 1, text: 'Top' },
        { type: 'heading', level: 3, text: 'Too deep', id: 'skip-me' },
      ],
    }));
    expect(violations).toContainEqual(expect.objectContaining({ code: 'HEADING_SKIP', id: 'skip-me' }));
  });

  it('surfaces EMPTY_SUBMIT_LABEL through the real pipeline', () => {
    const violations = auditJson(JSON.stringify({
      version: '1.0',
      elements: [{ type: 'submit', id: 'go', label: '', route: '/api' }],
    }));
    expect(violations).toContainEqual(expect.objectContaining({ code: 'EMPTY_SUBMIT_LABEL', id: 'go' }));
  });

  it('reports EMPTY_FORM for a document with zero elements', () => {
    const violations = auditJson(JSON.stringify({ version: '1.0', elements: [] }));
    expect(violations).toContainEqual(expect.objectContaining({ code: 'EMPTY_FORM' }));
  });
});
