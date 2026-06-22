import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import type { FieldValues } from '@renderly/schema';
import { renderDocument } from '../../src/adapter.js';
import { isOk } from '@renderly/shared';

function render(json: string, values?: FieldValues): string {
  const docResult = parseDocument(json);
  if (!isOk(docResult)) throw new Error(`parse failed: ${JSON.stringify(docResult)}`);
  const walkResult = walk(docResult.value, createDefaultRegistry(), { values });
  if (!isOk(walkResult)) throw new Error(`walk failed: ${JSON.stringify(walkResult)}`);
  const htmlResult = renderDocument(walkResult.value);
  if (!isOk(htmlResult)) throw new Error(`render failed: ${JSON.stringify(htmlResult)}`);
  return htmlResult.value;
}

const GUARDIAN_FORM = JSON.stringify({
  version: '1',
  elements: [
    { type: 'input', kind: 'text', id: 'patient_type', label: 'Patient Type' },
    {
      type: 'input', kind: 'text', id: 'guardian_name', label: 'Guardian Name',
      rules: [{ action: 'hide', when: { field: 'patient_type', op: 'neq', value: 'minor' } }],
    },
    {
      type: 'input', kind: 'date', id: 'guardian_dob', label: 'Guardian Date of Birth',
      rules: [{ action: 'hide', when: { field: 'patient_type', op: 'neq', value: 'minor' } }],
    },
    { type: 'submit', id: 's', label: 'Submit', route: '/api/register' },
  ],
});

describe('html e2e — conditional rules: hide / show', () => {
  it('renders all fields when no values are provided (static render)', () => {
    const html = render(GUARDIAN_FORM);
    expect(html).toContain('Guardian Name');
    expect(html).toContain('Guardian Date of Birth');
  });

  it('hides guardian fields when patient_type is adult', () => {
    const html = render(GUARDIAN_FORM, { patient_type: 'adult' });
    expect(html).not.toContain('Guardian Name');
    expect(html).not.toContain('guardian_name');
    expect(html).not.toContain('Guardian Date of Birth');
  });

  it('shows guardian fields when patient_type is minor', () => {
    const html = render(GUARDIAN_FORM, { patient_type: 'minor' });
    expect(html).toContain('Guardian Name');
    expect(html).toContain('Guardian Date of Birth');
  });

  it('hides guardian fields when patient_type is empty (condition: neq minor is true)', () => {
    const html = render(GUARDIAN_FORM, { patient_type: '' });
    expect(html).not.toContain('Guardian Name');
  });
});

describe('html e2e — conditional rules: require override', () => {
  it('field rendered as required when condition is met', () => {
    const form = JSON.stringify({
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'consent', label: 'Consent Given' },
        {
          type: 'input', kind: 'text', id: 'signature', label: 'Signature',
          required: false,
          rules: [{ action: 'require', when: { field: 'consent', op: 'eq', value: 'yes' } }],
        },
        { type: 'submit', id: 's', label: 'Submit', route: '/api' },
      ],
    });

    const html_with_consent = render(form, { consent: 'yes' });
    // Input should have the required attribute
    expect(html_with_consent).toContain('id="signature"');
    expect(html_with_consent).toMatch(/id="signature"[^>]*required|required[^>]*id="signature"/);

    const html_without_consent = render(form, { consent: 'no' });
    // signature is present but not required
    expect(html_without_consent).toContain('id="signature"');
  });
});

describe('html e2e — conditional rules parsed from JSON (full pipeline)', () => {
  it('rules survive parseDocument round-trip and are evaluated correctly', () => {
    const json = JSON.stringify({
      version: '1',
      elements: [
        { type: 'input', kind: 'number', id: 'age', label: 'Age' },
        {
          type: 'input', kind: 'text', id: 'guardian', label: 'Guardian',
          rules: [{ action: 'hide', when: { field: 'age', op: 'gte', value: 18 } }],
        },
        { type: 'submit', id: 's', label: 'Submit', route: '/api' },
      ],
    });

    const html_adult = render(json, { age: 21 });
    expect(html_adult).not.toContain('Guardian');

    const html_minor = render(json, { age: 16 });
    expect(html_minor).toContain('Guardian');
  });

  it('container section is hidden when rule matches — entire section absent from HTML', () => {
    const json = JSON.stringify({
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'has_insurance', label: 'Insurance?' },
        {
          type: 'container',
          children: [
            { type: 'heading', level: 3, text: 'Insurance Details' },
            { type: 'input', kind: 'text', id: 'policy_number', label: 'Policy Number' },
          ],
          rules: [{ action: 'hide', when: { field: 'has_insurance', op: 'neq', value: 'yes' } }],
        },
        { type: 'submit', id: 's', label: 'Submit', route: '/api' },
      ],
    });

    const no_insurance = render(json, { has_insurance: 'no' });
    expect(no_insurance).not.toContain('Insurance Details');
    expect(no_insurance).not.toContain('Policy Number');
    expect(no_insurance).not.toContain('policy_number');

    const has_insurance = render(json, { has_insurance: 'yes' });
    expect(has_insurance).toContain('Insurance Details');
    expect(has_insurance).toContain('Policy Number');
  });
});
