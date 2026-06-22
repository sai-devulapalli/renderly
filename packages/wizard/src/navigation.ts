import type { WizardDocument, WizardState, WizardError } from './types.js';
import type { Result } from '@renderly/shared';
import { ok, err } from '@renderly/shared';

export function createWizardState(doc: WizardDocument): Result<WizardState, WizardError> {
  if (doc.steps.length === 0) {
    return err({ code: 'EMPTY_STEPS', message: 'WizardDocument must have at least one step.' });
  }
  return ok({ currentStepIndex: 0, totalSteps: doc.steps.length });
}

export function nextStep(state: WizardState): WizardState | null {
  if (state.currentStepIndex >= state.totalSteps - 1) return null;
  return { ...state, currentStepIndex: state.currentStepIndex + 1 };
}

export function prevStep(state: WizardState): WizardState | null {
  if (state.currentStepIndex <= 0) return null;
  return { ...state, currentStepIndex: state.currentStepIndex - 1 };
}

export function goToStep(state: WizardState, index: number): Result<WizardState, WizardError> {
  if (index < 0 || index >= state.totalSteps) {
    return err({
      code: 'STEP_OUT_OF_RANGE',
      message: `Step index ${index} is out of range [0, ${state.totalSteps - 1}].`,
    });
  }
  return ok({ ...state, currentStepIndex: index });
}

export function isFirstStep(state: WizardState): boolean {
  return state.currentStepIndex === 0;
}

export function isLastStep(state: WizardState): boolean {
  return state.currentStepIndex === state.totalSteps - 1;
}

export function stepProgress(state: WizardState): number {
  if (state.totalSteps <= 1) return 1;
  return (state.currentStepIndex + 1) / state.totalSteps;
}
