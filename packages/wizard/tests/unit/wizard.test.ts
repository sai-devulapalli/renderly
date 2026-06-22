import { describe, it, expect } from 'vitest';
import {
  createWizardState, nextStep, prevStep, goToStep,
  isFirstStep, isLastStep, stepProgress, walkStep, walkAllSteps,
} from '../../src/index.js';
import type { WizardDocument } from '../../src/types.js';

const DOC: WizardDocument = {
  version: '1',
  steps: [
    {
      id: 'personal',
      title: 'Personal Info',
      elements: [
        { type: 'input', kind: 'text', id: 'first_name', label: 'First Name' },
        { type: 'input', kind: 'text', id: 'last_name', label: 'Last Name' },
      ],
    },
    {
      id: 'contact',
      title: 'Contact Info',
      elements: [
        { type: 'input', kind: 'text', id: 'email', label: 'Email' },
      ],
    },
    {
      id: 'review',
      title: 'Review',
      elements: [
        { type: 'heading', level: 2, text: 'Please review your information' },
        { type: 'submit', id: 's', label: 'Submit', route: '/api/register' },
      ],
    },
  ],
};

// ── createWizardState ─────────────────────────────────────────────────────────

describe('createWizardState', () => {
  it('creates state starting at step 0', () => {
    const r = createWizardState(DOC);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.currentStepIndex).toBe(0);
    expect(r.value.totalSteps).toBe(3);
  });

  it('returns EMPTY_STEPS error for document with no steps', () => {
    const r = createWizardState({ version: '1', steps: [] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('EMPTY_STEPS');
  });
});

// ── navigation ────────────────────────────────────────────────────────────────

describe('nextStep / prevStep', () => {
  it('nextStep increments the index', () => {
    const r = createWizardState(DOC);
    if (!r.ok) throw new Error();
    const next = nextStep(r.value);
    expect(next?.currentStepIndex).toBe(1);
  });

  it('nextStep returns null at the last step', () => {
    const state = { currentStepIndex: 2, totalSteps: 3 };
    expect(nextStep(state)).toBeNull();
  });

  it('prevStep decrements the index', () => {
    const state = { currentStepIndex: 2, totalSteps: 3 };
    expect(prevStep(state)?.currentStepIndex).toBe(1);
  });

  it('prevStep returns null at step 0', () => {
    const state = { currentStepIndex: 0, totalSteps: 3 };
    expect(prevStep(state)).toBeNull();
  });
});

describe('goToStep', () => {
  it('jumps to the specified index', () => {
    const state = { currentStepIndex: 0, totalSteps: 3 };
    const r = goToStep(state, 2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.currentStepIndex).toBe(2);
  });

  it('returns STEP_OUT_OF_RANGE for negative index', () => {
    const state = { currentStepIndex: 1, totalSteps: 3 };
    const r = goToStep(state, -1);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('STEP_OUT_OF_RANGE');
  });

  it('returns STEP_OUT_OF_RANGE when index >= totalSteps', () => {
    const state = { currentStepIndex: 0, totalSteps: 3 };
    expect(goToStep(state, 3).ok).toBe(false);
  });
});

// ── predicates ────────────────────────────────────────────────────────────────

describe('isFirstStep / isLastStep / stepProgress', () => {
  it('isFirstStep is true at index 0', () => {
    expect(isFirstStep({ currentStepIndex: 0, totalSteps: 3 })).toBe(true);
    expect(isFirstStep({ currentStepIndex: 1, totalSteps: 3 })).toBe(false);
  });

  it('isLastStep is true at index totalSteps-1', () => {
    expect(isLastStep({ currentStepIndex: 2, totalSteps: 3 })).toBe(true);
    expect(isLastStep({ currentStepIndex: 1, totalSteps: 3 })).toBe(false);
  });

  it('stepProgress returns fraction of completion', () => {
    expect(stepProgress({ currentStepIndex: 0, totalSteps: 3 })).toBeCloseTo(1 / 3);
    expect(stepProgress({ currentStepIndex: 2, totalSteps: 3 })).toBeCloseTo(3 / 3);
  });

  it('stepProgress returns 1 for single-step wizard', () => {
    expect(stepProgress({ currentStepIndex: 0, totalSteps: 1 })).toBe(1);
  });
});

// ── walkStep ──────────────────────────────────────────────────────────────────

describe('walkStep', () => {
  it('returns IR nodes for the current step only', () => {
    const state = { currentStepIndex: 0, totalSteps: 3 };
    const r = walkStep(DOC, state);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const ids = r.value.filter((n): n is { id: string } => 'id' in n).map((n) => n.id);
    expect(ids).toContain('first_name');
    expect(ids).toContain('last_name');
    expect(ids).not.toContain('email');
  });

  it('does not include nodes from other steps', () => {
    const state = { currentStepIndex: 1, totalSteps: 3 };
    const r = walkStep(DOC, state);
    if (!r.ok) throw new Error();
    const ids = r.value.filter((n): n is { id: string } => 'id' in n).map((n) => n.id);
    expect(ids).toContain('email');
    expect(ids).not.toContain('first_name');
  });

  it('returns STEP_OUT_OF_RANGE when index exceeds document steps', () => {
    const state = { currentStepIndex: 99, totalSteps: 99 };
    const r = walkStep(DOC, state);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('STEP_OUT_OF_RANGE');
  });

  it('applies conditional rules using cross-step values', () => {
    const docWithRules: WizardDocument = {
      version: '1',
      steps: [
        { id: 'step1', elements: [{ type: 'input', kind: 'text', id: 'type', label: 'Type' }] },
        {
          id: 'step2',
          elements: [
            { type: 'input', kind: 'text', id: 'guardian', label: 'Guardian',
              rules: [{ action: 'hide', when: { field: 'type', op: 'neq', value: 'minor' } }],
            },
          ],
        },
      ],
    };
    const state = { currentStepIndex: 1, totalSteps: 2 };
    const shown = walkStep(docWithRules, state, { values: { type: 'minor' } });
    expect(shown.ok && shown.value.some((n) => 'id' in n && n.id === 'guardian')).toBe(true);

    const hidden = walkStep(docWithRules, state, { values: { type: 'adult' } });
    expect(hidden.ok && hidden.value.every((n) => !('id' in n) || n.id !== 'guardian')).toBe(true);
  });
});

// ── walkAllSteps ──────────────────────────────────────────────────────────────

describe('walkAllSteps', () => {
  it('returns combined IR for all steps', () => {
    const r = walkAllSteps(DOC);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const ids = r.value.filter((n): n is { id: string } => 'id' in n).map((n) => n.id);
    expect(ids).toContain('first_name');
    expect(ids).toContain('email');
    expect(ids).toContain('s');
  });
});
