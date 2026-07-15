import { describe, it, expect } from 'vitest';
import { renderDocument } from '@renderly/html';
import { createWizardState, walkAllSteps, walkStep, nextStep } from '../../src/index.js';
import type { WizardDocument } from '../../src/index.js';

const INTAKE_WIZARD: WizardDocument = {
  version: '1.0',
  title: 'Patient Intake',
  steps: [
    {
      id: 'personal',
      title: 'Personal Info',
      elements: [
        { type: 'input', kind: 'text', id: 'first_name', label: 'First Name', required: true },
        { type: 'input', kind: 'text', id: 'last_name', label: 'Last Name', required: true },
      ],
    },
    {
      id: 'contact',
      title: 'Contact Info',
      elements: [
        { type: 'input', kind: 'text', id: 'email', label: 'Email', required: true },
        {
          type: 'input', kind: 'text', id: 'guardian_email', label: 'Guardian Email',
          rules: [{ action: 'hide', when: { field: 'first_name', op: 'eq', value: 'Ada' } }],
        },
      ],
    },
    {
      id: 'review',
      title: 'Review',
      elements: [
        { type: 'heading', level: 2, text: 'Please review your information' },
        { type: 'submit', id: 'go', label: 'Submit Intake', route: '/api/intake' },
      ],
    },
  ],
};

describe('wizard e2e — walkAllSteps → renderDocument(html)', () => {
  it('renders every step\'s fields into one real HTML document, in step order', () => {
    const walked = walkAllSteps(INTAKE_WIZARD);
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const rendered = renderDocument(walked.value);
    expect(rendered.ok).toBe(true);
    if (!rendered.ok) return;

    const firstNameIdx = rendered.value.indexOf('First Name');
    const emailIdx = rendered.value.indexOf('Email');
    const submitIdx = rendered.value.indexOf('Submit Intake');
    expect(firstNameIdx).toBeGreaterThan(-1);
    expect(emailIdx).toBeGreaterThan(firstNameIdx);
    expect(submitIdx).toBeGreaterThan(emailIdx);
  });

  it('renders only the current step\'s HTML', () => {
    const stateResult = createWizardState(INTAKE_WIZARD);
    expect(stateResult.ok).toBe(true);
    if (!stateResult.ok) return;

    const step2 = nextStep(stateResult.value);
    expect(step2).not.toBeNull();
    if (step2 === null) return;

    const walked = walkStep(INTAKE_WIZARD, step2, {
      values: { first_name: 'Grace', last_name: 'Hopper' },
    });
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const rendered = renderDocument(walked.value);
    expect(rendered.ok).toBe(true);
    if (!rendered.ok) return;
    expect(rendered.value).toContain('Email');
    expect(rendered.value).not.toContain('First Name');
    expect(rendered.value).not.toContain('Submit Intake');
  });

  it('a later step\'s conditional rule correctly reads a value entered on an earlier step', () => {
    const stateResult = createWizardState(INTAKE_WIZARD);
    expect(stateResult.ok).toBe(true);
    if (!stateResult.ok) return;
    const step2 = nextStep(stateResult.value);
    if (step2 === null) throw new Error('unreachable');

    const hidden = walkStep(INTAKE_WIZARD, step2, { values: { first_name: 'Ada' } });
    expect(hidden.ok).toBe(true);
    if (hidden.ok) {
      const html = renderDocument(hidden.value);
      expect(html.ok).toBe(true);
      if (html.ok) expect(html.value).not.toContain('Guardian Email');
    }

    const shown = walkStep(INTAKE_WIZARD, step2, { values: { first_name: 'Grace' } });
    expect(shown.ok).toBe(true);
    if (shown.ok) {
      const html = renderDocument(shown.value);
      expect(html.ok).toBe(true);
      if (html.ok) expect(html.value).toContain('Guardian Email');
    }
  });
});
