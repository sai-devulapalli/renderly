import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { isOk, isErr } from '@renderly/shared';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument } from '../../src/adapter.js';
import { createReactRegistry } from '../../src/registry.js';

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
    { type: 'input', kind: 'date', id: 'dob', label: 'Date of Birth', required: true },
    { type: 'input', kind: 'number', id: 'weight', label: 'Weight (kg)', min: 0, max: 500 },
    {
      type: 'input', kind: 'choice', id: 'gender', label: 'Gender',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
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
    form: ['<script>Submission failed</script>'],
    fields: { first: ['This field is required'] },
  },
});

const XSS_FORM_JSON = JSON.stringify({
  version: '1.0',
  elements: [
    { type: 'heading', level: 1, text: '<script>alert(1)</script>' },
    { type: 'text', content: '"><img src=x onerror=alert(1)>' },
    { type: 'submit', id: 'sub', label: 'Go', route: '/api' },
  ],
});

function pipelineRender(rawJson: string) {
  const docResult = parseDocument(rawJson);
  if (!isOk(docResult)) throw new Error(`parse failed: ${JSON.stringify(docResult)}`);
  const walkResult = walk(docResult.value, createDefaultRegistry());
  if (!isOk(walkResult)) throw new Error(`walk failed: ${JSON.stringify(walkResult)}`);
  return renderDocument(walkResult.value);
}

describe('react adapter e2e — full pipeline (no mocks)', () => {
  it('golden path: renders patient form to DOM correctly', () => {
    const renderResult = pipelineRender(PATIENT_FORM_JSON);
    expect(isOk(renderResult)).toBe(true);
    if (!isOk(renderResult)) return;

    const { container, getByText, getByRole } = render(renderResult.value);
    expect(getByRole('heading', { level: 1 })).toBeTruthy();
    expect(getByText('Patient Registration')).toBeTruthy();
    expect(container.querySelector('input[type="text"]')).not.toBeNull();
    expect(container.querySelector('input[type="date"]')).not.toBeNull();
    expect(container.querySelector('input[type="number"]')).not.toBeNull();
    expect(container.querySelector('select')).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it('renders form + field errors into DOM', () => {
    const renderResult = pipelineRender(FORM_WITH_ERRORS_JSON);
    expect(isOk(renderResult)).toBe(true);
    if (!isOk(renderResult)) return;

    const { container } = render(renderResult.value);
    expect(container.querySelector('[role="alert"].error--form')).not.toBeNull();
    expect(container.querySelector('.field-errors')).not.toBeNull();
    expect(container.querySelector('.field-error')?.textContent).toBe('This field is required');
  });

  it('XSS: React never injects raw script tags into the DOM', () => {
    const renderResult = pipelineRender(XSS_FORM_JSON);
    expect(isOk(renderResult)).toBe(true);
    if (!isOk(renderResult)) return;

    const { container } = render(renderResult.value);
    // React text content is safely escaped — no actual script element
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    // Text content still carries the raw string (visible to user as text)
    expect(container.querySelector('h1')?.textContent).toBe('<script>alert(1)</script>');
  });

  it('returns UNREGISTERED_NODE_TYPE when registry is empty', () => {
    const docResult = parseDocument(PATIENT_FORM_JSON);
    if (!isOk(docResult)) throw new Error('parse failed');
    const walkResult = walk(docResult.value, createDefaultRegistry());
    if (!isOk(walkResult)) throw new Error('walk failed');

    const result = renderDocument(walkResult.value, createReactRegistry());
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('UNREGISTERED_NODE_TYPE');
  });

  it('adapter result branch — renderDocument returns err when renderNodes fails', () => {
    const docResult = parseDocument(PATIENT_FORM_JSON);
    if (!isOk(docResult)) throw new Error('parse failed');
    const walkResult = walk(docResult.value, createDefaultRegistry());
    if (!isOk(walkResult)) throw new Error('walk failed');

    // Use empty registry so renderNodes returns an error
    const emptyReg = new Map();
    const result = renderDocument(walkResult.value, emptyReg);
    expect(isErr(result)).toBe(true);
  });
});
