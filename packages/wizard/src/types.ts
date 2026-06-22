import type { Element } from '@renderly/schema';

export interface WizardStep {
  readonly id: string;
  readonly title?: string;
  readonly elements: readonly Element[];
}

export interface WizardDocument {
  readonly version: string;
  readonly title?: string;
  readonly steps: readonly WizardStep[];
}

export interface WizardState {
  readonly currentStepIndex: number;
  readonly totalSteps: number;
}

export type WizardErrorCode =
  | 'EMPTY_STEPS'
  | 'STEP_OUT_OF_RANGE'
  | 'INVALID_DOCUMENT'
  | 'WALK_ERROR';

export interface WizardError {
  readonly code: WizardErrorCode;
  readonly message: string;
  readonly cause?: unknown;
}
