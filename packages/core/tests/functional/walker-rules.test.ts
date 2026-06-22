import { describe, it, expect } from 'vitest';
import type { Document } from '@renderly/schema';
import { isOk } from '@renderly/shared';
import { walk, createDefaultRegistry } from '../../src/index.js';

const registry = createDefaultRegistry();

// Minimal document with all the elements we need for rule testing
const FORM: Document = {
  version: '1',
  elements: [
    {
      type: 'input', kind: 'text', id: 'has_guardian', label: 'Do you have a guardian?',
    },
    {
      type: 'input', kind: 'text', id: 'guardian_name', label: 'Guardian Name',
      rules: [{ action: 'hide', when: { field: 'has_guardian', op: 'neq', value: 'yes' } }],
    },
    {
      type: 'input', kind: 'text', id: 'name', label: 'Full Name', required: false,
      rules: [{ action: 'require', when: { field: 'has_guardian', op: 'eq', value: 'yes' } }],
    },
    { type: 'submit', id: 's', label: 'Submit', route: '/api' },
  ],
};

// ── hide / show ───────────────────────────────────────────────────────────────

describe('walk with rules — hide action', () => {
  it('excludes hidden elements from the IR when condition is met', () => {
    const result = walk(FORM, registry, { values: { has_guardian: 'no' } });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const ids = result.value
      .filter((n): n is { id: string } => 'id' in n)
      .map((n) => n.id);
    expect(ids).not.toContain('guardian_name');
  });

  it('includes element when hide condition is not met', () => {
    const result = walk(FORM, registry, { values: { has_guardian: 'yes' } });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const ids = result.value
      .filter((n): n is { id: string } => 'id' in n)
      .map((n) => n.id);
    expect(ids).toContain('guardian_name');
  });

  it('includes all elements when values is not provided (no rule evaluation)', () => {
    const result = walk(FORM, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toHaveLength(FORM.elements.length);
  });

  it('includes all elements when values is empty object', () => {
    const result = walk(FORM, registry, { values: {} });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    // guardian_name hides when has_guardian != 'yes' — empty values means condition is met
    const ids = result.value
      .filter((n): n is { id: string } => 'id' in n)
      .map((n) => n.id);
    expect(ids).not.toContain('guardian_name');
  });
});

// ── require / optional override ───────────────────────────────────────────────

describe('walk with rules — require action', () => {
  it('overrides required=false to required=true when condition is met', () => {
    const result = walk(FORM, registry, { values: { has_guardian: 'yes' } });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const nameNode = result.value.find(
      (n): n is { id: string; required: boolean } => 'id' in n && n.id === 'name',
    );
    expect(nameNode).toBeDefined();
    expect(nameNode?.required).toBe(true);
  });

  it('leaves required unchanged when condition is not met', () => {
    const result = walk(FORM, registry, { values: { has_guardian: 'no' } });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const nameNode = result.value.find(
      (n): n is { id: string; required: boolean } => 'id' in n && n.id === 'name',
    );
    expect(nameNode?.required).toBe(false);
  });
});

// ── multiple rules on one element ─────────────────────────────────────────────

describe('walk with rules — multiple rules', () => {
  it('evaluates all rules and applies effects independently', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'consent', label: 'Consent' },
        {
          type: 'input', kind: 'text', id: 'signature', label: 'Signature', required: false,
          rules: [
            { action: 'hide',    when: { field: 'consent', op: 'neq', value: 'yes' } },
            { action: 'require', when: { field: 'consent', op: 'eq',  value: 'yes' } },
          ],
        },
      ],
    };

    // When consent = 'yes': signature is visible AND required
    const with_consent = walk(doc, registry, { values: { consent: 'yes' } });
    expect(isOk(with_consent)).toBe(true);
    if (!isOk(with_consent)) return;
    const sig = with_consent.value.find(
      (n): n is { id: string; required: boolean } => 'id' in n && n.id === 'signature',
    );
    expect(sig).toBeDefined();
    expect(sig?.required).toBe(true);

    // When consent != 'yes': signature is hidden
    const without_consent = walk(doc, registry, { values: { consent: 'no' } });
    expect(isOk(without_consent)).toBe(true);
    if (!isOk(without_consent)) return;
    const ids = without_consent.value
      .filter((n): n is { id: string } => 'id' in n)
      .map((n) => n.id);
    expect(ids).not.toContain('signature');
  });
});

// ── conditional section (container with rules) ────────────────────────────────

describe('walk with rules — container hide', () => {
  it('hides an entire section when the container rule matches', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'type', label: 'Type' },
        {
          type: 'container',
          children: [
            { type: 'heading', level: 2, text: 'Guardian Details' },
            { type: 'input', kind: 'text', id: 'guardian', label: 'Guardian' },
          ],
          rules: [{ action: 'hide', when: { field: 'type', op: 'neq', value: 'minor' } }],
        },
        { type: 'submit', id: 's', label: 'Submit', route: '/api' },
      ],
    };

    const result_adult = walk(doc, registry, { values: { type: 'adult' } });
    expect(isOk(result_adult)).toBe(true);
    if (!isOk(result_adult)) return;
    // Only input[type] and submit remain — container is hidden
    expect(result_adult.value).toHaveLength(2);
    expect(result_adult.value[0]?.type).toBe('input-text');
    expect(result_adult.value[1]?.type).toBe('submit');

    const result_minor = walk(doc, registry, { values: { type: 'minor' } });
    expect(isOk(result_minor)).toBe(true);
    if (!isOk(result_minor)) return;
    // Container appears with both children
    expect(result_minor.value).toHaveLength(3);
    expect(result_minor.value[1]?.type).toBe('container');
    expect(result_minor.value[1]?.children).toHaveLength(2);
  });
});

// ── numeric operator end-to-end ───────────────────────────────────────────────

describe('walk with rules — numeric operators', () => {
  it('hides guardian name when patient_age >= 18', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'number', id: 'patient_age', label: 'Age' },
        {
          type: 'input', kind: 'text', id: 'guardian_name', label: 'Guardian Name',
          rules: [{ action: 'hide', when: { field: 'patient_age', op: 'gte', value: 18 } }],
        },
      ],
    };

    const adult = walk(doc, registry, { values: { patient_age: 25 } });
    expect(isOk(adult)).toBe(true);
    if (!isOk(adult)) return;
    expect(adult.value).toHaveLength(1);
    expect(adult.value[0]?.type).toBe('input-number');

    const minor = walk(doc, registry, { values: { patient_age: 15 } });
    expect(isOk(minor)).toBe(true);
    if (!isOk(minor)) return;
    expect(minor.value).toHaveLength(2);
  });
});

// ── in / nin operator end-to-end ─────────────────────────────────────────────

describe('walk with rules — in / nin operators', () => {
  it('shows specialist_referral only for specific diagnoses', () => {
    const doc: Document = {
      version: '1',
      elements: [
        {
          type: 'input', kind: 'choice', id: 'diagnosis', label: 'Diagnosis',
          options: [
            { value: 'diabetes', label: 'Diabetes' },
            { value: 'hypertension', label: 'Hypertension' },
            { value: 'flu', label: 'Flu' },
          ],
        },
        {
          type: 'input', kind: 'text', id: 'specialist', label: 'Specialist Referral',
          rules: [{
            action: 'hide',
            when: { field: 'diagnosis', op: 'nin', value: ['diabetes', 'hypertension'] },
          }],
        },
      ],
    };

    const needs_specialist = walk(doc, registry, { values: { diagnosis: 'diabetes' } });
    expect(isOk(needs_specialist)).toBe(true);
    if (!isOk(needs_specialist)) return;
    expect(needs_specialist.value).toHaveLength(2);

    const no_specialist = walk(doc, registry, { values: { diagnosis: 'flu' } });
    expect(isOk(no_specialist)).toBe(true);
    if (!isOk(no_specialist)) return;
    expect(no_specialist.value).toHaveLength(1);
  });
});
