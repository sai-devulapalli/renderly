import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { freezeSnapshot } from '../../src/freeze.js';
import { renderDocument as renderMarkdown } from '@renderly/markdown';

const SCHEMA = JSON.stringify({
  version: '1',
  elements: [
    { type: 'heading', level: 1, text: 'Registration Review' },
    { type: 'input', kind: 'text', id: 'name', label: 'Full Name', required: true },
    { type: 'input', kind: 'text', id: 'phone', label: 'Phone' },
    { type: 'input', kind: 'choice', id: 'plan', label: 'Plan',
      options: [{ value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }],
    },
    { type: 'submit', id: 's', label: 'Submit', route: '/api' },
  ],
});

const SCHEMA_NEW_TYPES = JSON.stringify({
  version: '1',
  elements: [
    { type: 'heading', level: 1, text: 'Patient Intake' },
    { type: 'input', kind: 'file', id: 'insurance', label: 'Insurance Card' },
    { type: 'signature', id: 'consent', label: 'Consent Signature', required: true },
    { type: 'custom', kind: 'rating', id: 'satisfaction', label: 'Satisfaction' },
    {
      type: 'repeat', id: 'medications', label: 'Medications',
      template: [
        { type: 'input', kind: 'text', id: 'name', label: 'Drug Name' },
        { type: 'input', kind: 'text', id: 'dose', label: 'Dosage' },
      ],
    },
    { type: 'submit', id: 's', label: 'Submit', route: '/api' },
  ],
});

describe('@renderly/snapshot full pipeline', () => {
  it('freezes walked IR and removes submit nodes', () => {
    const parsed = parseDocument(SCHEMA);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const walked = walk(parsed.value, createDefaultRegistry());
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, {
      values: { name: 'Alice Smith', plan: 'pro' },
    });

    expect(frozen.every((n) => n.type !== 'submit')).toBe(true);
    const names = frozen.filter((n) => 'id' in n && n.id === 'name');
    expect(names).toHaveLength(1);
    expect((names[0] as { content: string }).content).toBe('Full Name: Alice Smith');

    const plans = frozen.filter((n) => 'id' in n && n.id === 'plan');
    expect((plans[0] as { content: string }).content).toBe('Plan: Pro');
  });

  it('pipe frozen snapshot through markdown adapter', () => {
    const parsed = parseDocument(SCHEMA);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry());
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, {
      values: { name: 'Bob Jones', phone: '555-1234', plan: 'basic' },
    });

    const rendered = renderMarkdown(frozen);
    expect(rendered.ok).toBe(true);
    if (!rendered.ok) return;

    const md = rendered.value;
    expect(md).toContain('Full Name: Bob Jones');
    expect(md).toContain('Phone: 555');
    expect(md).toContain('Plan: Basic');
    expect(md).not.toContain('Submit');
    expect(md).not.toContain('---');
  });

  it('omitEmpty removes empty optional fields from snapshot', () => {
    const parsed = parseDocument(SCHEMA);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry());
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, {
      values: { name: 'Charlie' },
      omitEmpty: true,
    });

    const phoneNodes = frozen.filter((n) => 'id' in n && n.id === 'phone');
    expect(phoneNodes).toHaveLength(0);

    const nameNodes = frozen.filter((n) => 'id' in n && n.id === 'name');
    expect(nameNodes).toHaveLength(1);
  });
});

describe('@renderly/snapshot — new element types (file, signature, custom, repeat)', () => {
  it('freezes file input to a text node', () => {
    const parsed = parseDocument(SCHEMA_NEW_TYPES);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry(), { values: { insurance: 'card.pdf' } });
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, { values: { insurance: 'card.pdf' } });
    const insuranceNodes = frozen.filter((n) => 'id' in n && n.id === 'insurance');
    expect(insuranceNodes).toHaveLength(1);
    expect((insuranceNodes[0] as { content: string }).content).toBe('Insurance Card: card.pdf');
  });

  it('freezes signature to "Signed" when value is present', () => {
    const parsed = parseDocument(SCHEMA_NEW_TYPES);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry(), {
      values: { consent: 'data:image/png;base64,abc' },
    });
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, {
      values: { consent: 'data:image/png;base64,abc' },
    });
    const consentNodes = frozen.filter((n) => 'id' in n && n.id === 'consent');
    expect(consentNodes).toHaveLength(1);
    expect((consentNodes[0] as { content: string }).content).toBe('Consent Signature: Signed');
  });

  it('passes custom nodes through unchanged', () => {
    const parsed = parseDocument(SCHEMA_NEW_TYPES);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry());
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, { values: {} });
    const customNodes = frozen.filter((n) => n.type === 'custom');
    expect(customNodes).toHaveLength(1);
  });

  it('expands repeat items into label + frozen children pairs', () => {
    const parsed = parseDocument(SCHEMA_NEW_TYPES);
    if (!parsed.ok) return;
    const values = {
      'medications.__items': '2',
      'medications[0].name': 'Aspirin',
      'medications[0].dose': '81mg',
      'medications[1].name': 'Lisinopril',
      'medications[1].dose': '10mg',
    };
    const walked = walk(parsed.value, createDefaultRegistry(), { values });
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, { values });
    const textContents = frozen
      .filter((n) => n.type === 'text')
      .map((n) => (n as { content: string }).content);

    expect(textContents.some((c) => c.includes('Item 1'))).toBe(true);
    expect(textContents.some((c) => c.includes('Aspirin'))).toBe(true);
    expect(textContents.some((c) => c.includes('Item 2'))).toBe(true);
    expect(textContents.some((c) => c.includes('Lisinopril'))).toBe(true);
  });

  it('pipes frozen new-type snapshot through markdown adapter', () => {
    const parsed = parseDocument(SCHEMA_NEW_TYPES);
    if (!parsed.ok) return;
    const values = {
      insurance: 'card.pdf',
      consent: 'data:image/png;base64,abc',
      'medications.__items': '1',
      'medications[0].name': 'Metformin',
      'medications[0].dose': '500mg',
    };
    const walked = walk(parsed.value, createDefaultRegistry(), { values });
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, { values });
    const rendered = renderMarkdown(frozen);
    expect(rendered.ok).toBe(true);
    if (!rendered.ok) return;

    const md = rendered.value;
    expect(md).toContain('card\\.pdf'); // escapeMd escapes '.' → '\.'
    expect(md).toContain('Signed');
    expect(md).toContain('Metformin');
    expect(md).not.toContain('Submit');
  });
});
