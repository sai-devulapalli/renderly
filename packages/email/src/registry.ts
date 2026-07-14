import type { IRNodeType, RenderableIRNodeType } from '@renderly/schema';
import type { EmailNodeRenderer, EmailRegistry } from './types.js';
import {
  renderContainer,
  renderHeading,
  renderText,
  renderInputText,
  renderInputNumber,
  renderInputDate,
  renderInputChoice,
  renderSubmit,
  renderFormError,
  renderFieldError,
  renderRepeat,
  renderInputFile,
  renderSignature,
  renderCustom,
} from './renderers.js';
import type {
  IRContainerNode,
  IRHeadingNode,
  IRTextNode,
  IRInputTextNode,
  IRInputNumberNode,
  IRInputDateNode,
  IRInputChoiceNode,
  IRSubmitNode,
  IRFormErrorNode,
  IRFieldErrorNode,
  IRInputFileNode,
  IRSignatureNode,
  IRCustomNode,
  IRRepeatNode,
  IRNode,
} from '@renderly/schema';
import type { RenderChildrenFn } from './types.js';

export function createEmailRegistry(): Map<IRNodeType, EmailNodeRenderer> {
  return new Map();
}

const DEFAULT_EMAIL_RENDERERS = {
  container:      (n, rc) => renderContainer(n as IRContainerNode, rc),
  heading:        (n, rc) => renderHeading(n as IRHeadingNode, rc),
  text:           (n, rc) => renderText(n as IRTextNode, rc),
  'input-text':   (n, rc) => renderInputText(n as IRInputTextNode, rc),
  'input-number': (n, rc) => renderInputNumber(n as IRInputNumberNode, rc),
  'input-date':   (n, rc) => renderInputDate(n as IRInputDateNode, rc),
  'input-choice': (n, rc) => renderInputChoice(n as IRInputChoiceNode, rc),
  submit:         (n, rc) => renderSubmit(n as IRSubmitNode, rc),
  'error-form':   (n, rc) => renderFormError(n as IRFormErrorNode, rc),
  'error-field':  (n, rc) => renderFieldError(n as IRFieldErrorNode, rc),
  repeat:         (n, rc) => renderRepeat(n as IRRepeatNode, rc),
  'input-file':   (n, rc) => renderInputFile(n as IRInputFileNode, rc),
  signature:      (n, rc) => renderSignature(n as IRSignatureNode, rc),
  custom:         (n, rc) => renderCustom(n as IRCustomNode, rc),
} satisfies Record<RenderableIRNodeType, EmailNodeRenderer>;

export function createDefaultEmailRegistry(): Map<IRNodeType, EmailNodeRenderer> {
  return new Map(Object.entries(DEFAULT_EMAIL_RENDERERS) as [IRNodeType, EmailNodeRenderer][]);
}

export type { EmailRegistry, EmailNodeRenderer, RenderChildrenFn, IRNode };
