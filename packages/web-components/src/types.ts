import type { FieldValue } from '@renderly/schema';
import type { WcError } from './errors.js';

/** Values collected from the native form on submit. */
export type SubmitValues = Record<string, FieldValue>;

export interface RenderlySubmitDetail {
  readonly values: SubmitValues;
}

export interface RenderlySubmitEvent extends CustomEvent<RenderlySubmitDetail> {}
export interface RenderlyErrorEvent extends CustomEvent<WcError> {}

declare global {
  interface HTMLElementEventMap {
    'renderly-submit': CustomEvent<RenderlySubmitDetail>;
    'renderly-error': CustomEvent<WcError>;
  }
}
