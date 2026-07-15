import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument } from '../../src/adapter.js';

const PATIENT_FORM_JSON = JSON.stringify({
  version: '1.0',
  title: 'Patient Intake',
  elements: [
    { type: 'heading', level: 1, text: 'Patient Intake' },
    { type: 'input', kind: 'text', id: 'first_name', label: 'First Name', required: true },
    { type: 'input', kind: 'date', id: 'dob', label: 'Date of Birth', required: true },
    {
      type: 'input', kind: 'choice', id: 'insurance', label: 'Insurance Provider', required: true,
      options: [{ value: 'aetna', label: 'Aetna' }, { value: 'cigna', label: 'Cigna' }],
    },
    { type: 'submit', id: 'go', label: 'Submit', route: '/api/intake' },
  ],
});

describe('pdf e2e — parseDocument → walk → renderDocument(pdf)', () => {
  it('produces a real, well-formed PDF buffer for a realistic form', async () => {
    const parsed = parseDocument(PATIENT_FORM_JSON);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const walked = walk(parsed.value, createDefaultRegistry());
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const result = await renderDocument(walked.value, undefined, { title: 'Patient Intake' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(Buffer.isBuffer(result.value)).toBe(true);
    expect(result.value.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(result.value.length).toBeGreaterThan(500);
    expect(result.value.subarray(-6).toString('latin1').trim()).toBe('%%EOF');
  });

  it('still produces a valid PDF when re-rendering a document with server-side field errors', async () => {
    const parsed = parseDocument(JSON.stringify({
      version: '1.0',
      elements: [
        { type: 'input', kind: 'text', id: 'email', label: 'Email', required: true },
        { type: 'submit', id: 'go', label: 'Submit', route: '/api/intake' },
      ],
      errors: { fields: { email: ['Email is required'] } },
    }));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const walked = walk(parsed.value, createDefaultRegistry());
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const result = await renderDocument(walked.value);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});
