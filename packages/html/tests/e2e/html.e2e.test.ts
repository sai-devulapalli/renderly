import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument } from '../../src/adapter.js';
import { isOk, isErr } from '@renderly/shared';

const PATIENT_FORM_JSON = JSON.stringify({
  version: '1.0',
  title: 'Patient Registration',
  elements: [
    { type: 'heading', level: 1, text: 'Patient Registration' },
    { type: 'text', content: 'Please fill in all required fields.', intent: 'muted' },
    {
      type: 'container', direction: 'row', gap: 'sm',
      children: [
        { type: 'input', kind: 'text', id: 'first', label: 'First Name', required: true },
        { type: 'input', kind: 'text', id: 'last', label: 'Last Name', required: true },
      ],
    },
    { type: 'input', kind: 'date', id: 'dob', label: 'Date of Birth', required: true, min: '1900-01-01', max: '2099-12-31' },
    { type: 'input', kind: 'number', id: 'weight', label: 'Weight (kg)', min: 0, max: 500 },
    {
      type: 'input', kind: 'choice', id: 'gender', label: 'Gender',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other / Prefer not to say' },
      ],
    },
    { type: 'submit', id: 'reg-submit', label: 'Register Patient', route: '/api/patients' },
  ],
});

const FORM_WITH_ERRORS_JSON = JSON.stringify({
  version: '1.0',
  elements: [
    { type: 'input', kind: 'text', id: 'first', label: 'First Name', required: true },
    { type: 'submit', id: 'sub', label: 'Submit', route: '/api' },
  ],
  errors: {
    form: ['Submission failed'],
    fields: { first: ['This field is required'] },
  },
});

const XSS_FORM_JSON = JSON.stringify({
  version: '1.0',
  elements: [
    { type: 'heading', level: 1, text: '<script>alert(1)</script>' },
    { type: 'text', content: '"><img src=x onerror=alert(1)>' },
    { type: 'input', kind: 'text', id: 'x<1>', label: 'Bad "label"' },
    { type: 'submit', id: 'sub', label: 'Go', route: '/api?a=1&b=2' },
  ],
});

describe('html adapter e2e — full pipeline (no mocks)', () => {
  it('golden path: renders patient registration form to HTML', () => {
    const docResult = parseDocument(PATIENT_FORM_JSON);
    if (!isOk(docResult)) throw new Error('parse failed');

    const walkResult = walk(docResult.value, createDefaultRegistry());
    if (!isOk(walkResult)) throw new Error('walk failed');

    const htmlResult = renderDocument(walkResult.value);
    expect(isOk(htmlResult)).toBe(true);
    if (isOk(htmlResult)) {
      const html = htmlResult.value;
      expect(html).toContain('<h1');
      expect(html).toContain('Patient Registration');
      expect(html).toContain('type="text"');
      expect(html).toContain('type="date"');
      expect(html).toContain('type="number"');
      expect(html).toContain('type="radio"');
      expect(html).toContain('type="submit"');
      expect(html).toContain('data-route="/api/patients"');
    }
  });

  it('renders form + field errors into output HTML', () => {
    const docResult = parseDocument(FORM_WITH_ERRORS_JSON);
    if (!isOk(docResult)) throw new Error('parse failed');

    const walkResult = walk(docResult.value, createDefaultRegistry());
    if (!isOk(walkResult)) throw new Error('walk failed');

    const htmlResult = renderDocument(walkResult.value);
    expect(isOk(htmlResult)).toBe(true);
    if (isOk(htmlResult)) {
      const html = htmlResult.value;
      expect(html).toContain('error--form');
      expect(html).toContain('Submission failed');
      expect(html).toContain('field-errors');
      expect(html).toContain('This field is required');
    }
  });

  it('escapes all user content — no raw XSS payload in output', () => {
    const docResult = parseDocument(XSS_FORM_JSON);
    if (!isOk(docResult)) throw new Error('parse failed');

    const walkResult = walk(docResult.value, createDefaultRegistry());
    if (!isOk(walkResult)) throw new Error('walk failed');

    const htmlResult = renderDocument(walkResult.value);
    expect(isOk(htmlResult)).toBe(true);
    if (isOk(htmlResult)) {
      const html = htmlResult.value;
      // Raw tags must not appear — injected < and > are escaped
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;img');
      expect(html).toContain('&amp;b=2');
    }
  });

  it('renderDocument with invalid walk result is unreachable — core returns ok for valid documents', () => {
    const docResult = parseDocument(PATIENT_FORM_JSON);
    if (!isOk(docResult)) throw new Error('parse failed');
    const walkResult = walk(docResult.value, createDefaultRegistry());
    expect(isOk(walkResult)).toBe(true);
  });

  it('round-trip preserves all heading levels', () => {
    const raw = JSON.stringify({
      version: '1.0',
      elements: [1, 2, 3, 4, 5, 6].map((level) => ({
        type: 'heading', level, text: `Heading ${level}`,
      })),
    });
    const docResult = parseDocument(raw);
    if (!isOk(docResult)) throw new Error('parse failed');
    const walkResult = walk(docResult.value, createDefaultRegistry());
    if (!isOk(walkResult)) throw new Error('walk failed');
    const htmlResult = renderDocument(walkResult.value);
    expect(isOk(htmlResult)).toBe(true);
    if (isOk(htmlResult)) {
      for (let h = 1; h <= 6; h++) {
        expect(htmlResult.value).toContain(`<h${h}`);
        expect(htmlResult.value).toContain(`</h${h}>`);
      }
    }
  });
});

describe('html adapter e2e — error propagation', () => {
  it('renderDocument returns err for unregistered node type when using empty registry', () => {
    const docResult = parseDocument(PATIENT_FORM_JSON);
    if (!isOk(docResult)) throw new Error('parse failed');
    const walkResult = walk(docResult.value, createDefaultRegistry());
    if (!isOk(walkResult)) throw new Error('walk failed');

    const emptyRegistry = new Map();
    const htmlResult = renderDocument(walkResult.value, emptyRegistry);
    expect(isErr(htmlResult)).toBe(true);
    if (isErr(htmlResult)) {
      expect(htmlResult.error.code).toBe('UNREGISTERED_NODE_TYPE');
    }
  });
});
