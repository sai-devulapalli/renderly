import type { IRNode, FieldValues } from '@renderly/schema';
import { walk, createDefaultRegistry } from '@renderly/core';
import type { Registry } from '@renderly/core';
import type { Logger, Result } from '@renderly/shared';
import { err } from '@renderly/shared';
import type { WizardDocument, WizardState, WizardError } from './types.js';

export interface WalkStepOptions {
  readonly values?: FieldValues;
  readonly registry?: Registry;
  readonly logger?: Logger;
}

/**
 * Walk the elements of the current step and return their IR nodes.
 * Rules are evaluated against `values` which may contain data from ALL steps.
 */
export function walkStep(
  doc: WizardDocument,
  state: WizardState,
  opts?: WalkStepOptions,
): Result<readonly IRNode[], WizardError> {
  const step = doc.steps[state.currentStepIndex];
  if (step === undefined) {
    return err({
      code: 'STEP_OUT_OF_RANGE',
      message: `Step ${state.currentStepIndex} does not exist in this document.`,
    });
  }

  const coreDocument = {
    version: doc.version,
    elements: step.elements,
  };

  const registry = opts?.registry ?? createDefaultRegistry();
  const walkResult = walk(coreDocument, registry, {
    values: opts?.values,
    logger: opts?.logger,
  });

  if (!walkResult.ok) {
    return err({
      code: 'WALK_ERROR',
      message: `Walk failed for step "${step.id}".`,
      cause: walkResult.error,
    });
  }

  return walkResult;
}

/**
 * Walk ALL steps and return a flat array of IR nodes for the entire wizard.
 * Useful for print/PDF/email rendering of the complete form.
 */
export function walkAllSteps(
  doc: WizardDocument,
  opts?: WalkStepOptions,
): Result<readonly IRNode[], WizardError> {
  const allNodes: IRNode[] = [];

  for (let i = 0; i < doc.steps.length; i++) {
    const stepState: WizardState = { currentStepIndex: i, totalSteps: doc.steps.length };
    const result = walkStep(doc, stepState, opts);
    if (!result.ok) return result;
    allNodes.push(...result.value);
  }

  return { ok: true, value: allNodes };
}
