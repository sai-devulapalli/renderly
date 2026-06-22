import type { IRNodeType } from '@renderly/schema';
import type {
  IRContainerNode, IRHeadingNode, IRTextNode,
  IRInputTextNode, IRInputNumberNode, IRInputDateNode, IRInputChoiceNode,
  IRSubmitNode, IRFormErrorNode, IRFieldErrorNode,
  IRInputFileNode, IRSignatureNode, IRCustomNode, IRRepeatNode,
} from '@renderly/schema';
import type { ReactNodeRenderer, ReactRegistry } from './types.js';
import {
  renderContainer, renderHeading, renderText,
  renderInputText, renderInputNumber, renderInputDate, renderInputChoice,
  renderSubmit, renderFormError, renderFieldError,
  renderRepeat, renderInputFile, renderSignature, renderCustom,
} from './renderers.js';

export function createReactRegistry(): Map<IRNodeType, ReactNodeRenderer> {
  return new Map();
}

export function createDefaultReactRegistry(): Map<IRNodeType, ReactNodeRenderer> {
  return new Map<IRNodeType, ReactNodeRenderer>([
    ['container',    (n, ctx) => renderContainer(n as IRContainerNode, ctx)],
    ['heading',      (n, ctx) => renderHeading(n as IRHeadingNode, ctx)],
    ['text',         (n, ctx) => renderText(n as IRTextNode, ctx)],
    ['input-text',   (n, ctx) => renderInputText(n as IRInputTextNode, ctx)],
    ['input-number', (n, ctx) => renderInputNumber(n as IRInputNumberNode, ctx)],
    ['input-date',   (n, ctx) => renderInputDate(n as IRInputDateNode, ctx)],
    ['input-choice', (n, ctx) => renderInputChoice(n as IRInputChoiceNode, ctx)],
    ['submit',       (n, ctx) => renderSubmit(n as IRSubmitNode, ctx)],
    ['error-form',   (n, ctx) => renderFormError(n as IRFormErrorNode, ctx)],
    ['error-field',  (n, ctx) => renderFieldError(n as IRFieldErrorNode, ctx)],
    ['repeat',       (n, ctx) => renderRepeat(n as IRRepeatNode, ctx)],
    ['input-file',   (n, ctx) => renderInputFile(n as IRInputFileNode, ctx)],
    ['signature',    (n, ctx) => renderSignature(n as IRSignatureNode, ctx)],
    ['custom',       (n, ctx) => renderCustom(n as IRCustomNode, ctx)],
  ]);
}

export type { ReactRegistry, ReactNodeRenderer };
