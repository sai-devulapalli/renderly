import type { Element, FieldValues, FormErrors, IRNode } from '@renderly/schema';
import type { Result } from '@renderly/shared';

export type WalkErrorCode = 'UNREGISTERED_ELEMENT_TYPE' | 'HANDLER_FAILED' | 'MAX_DEPTH_EXCEEDED';

export const WALK_ERROR_CODES = {
  UNREGISTERED_ELEMENT_TYPE: 'UNREGISTERED_ELEMENT_TYPE',
  HANDLER_FAILED: 'HANDLER_FAILED',
  MAX_DEPTH_EXCEEDED: 'MAX_DEPTH_EXCEEDED',
} as const satisfies Record<WalkErrorCode, WalkErrorCode>;

export interface WalkError {
  readonly code: WalkErrorCode;
  readonly elementType: string;
  readonly cause?: unknown;
}

export interface WalkScope {
  readonly values?: FieldValues;
  readonly errors?: FormErrors;
}

export interface HandlerContext {
  readonly errors: FormErrors | undefined;
  readonly values: FieldValues | undefined;
  readonly walkChildren: (
    elements: readonly Element[],
    scope?: WalkScope,
  ) => Result<IRNode[], WalkError>;
}

export type ElementHandler = (
  element: Element,
  context: HandlerContext,
) => Result<IRNode, WalkError>;
