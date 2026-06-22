import type { IRNodeType } from '@renderly/schema';
import type { PdfNodeRenderer, PdfRegistry } from './types.js';
import {
  renderContainer, renderHeading, renderText,
  renderInputText, renderInputNumber, renderInputDate, renderInputChoice,
  renderSubmit, renderFormError, renderFieldError, renderRepeat,
  renderInputFile, renderSignature, renderCustom,
} from './renderers.js';
import type {
  IRContainerNode, IRHeadingNode, IRTextNode,
  IRInputTextNode, IRInputNumberNode, IRInputDateNode, IRInputChoiceNode,
  IRSubmitNode, IRFormErrorNode, IRFieldErrorNode, IRRepeatNode,
  IRInputFileNode, IRSignatureNode, IRCustomNode,
} from '@renderly/schema';
import type { PdfDoc, RenderChildrenFn } from './types.js';

export function createPdfRegistry(): Map<IRNodeType, PdfNodeRenderer> {
  return new Map();
}

export function createDefaultPdfRegistry(): Map<IRNodeType, PdfNodeRenderer> {
  return new Map<IRNodeType, PdfNodeRenderer>([
    ['container',    (n, d, rc) => renderContainer(n as IRContainerNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['heading',      (n, d, rc) => renderHeading(n as IRHeadingNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['text',         (n, d, rc) => renderText(n as IRTextNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['input-text',   (n, d, rc) => renderInputText(n as IRInputTextNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['input-number', (n, d, rc) => renderInputNumber(n as IRInputNumberNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['input-date',   (n, d, rc) => renderInputDate(n as IRInputDateNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['input-choice', (n, d, rc) => renderInputChoice(n as IRInputChoiceNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['submit',       (n, d, rc) => renderSubmit(n as IRSubmitNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['error-form',   (n, d, rc) => renderFormError(n as IRFormErrorNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['error-field',  (n, d, rc) => renderFieldError(n as IRFieldErrorNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['repeat',       (n, d, rc) => renderRepeat(n as IRRepeatNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['input-file',   (n, d, rc) => renderInputFile(n as IRInputFileNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['signature',    (n, d, rc) => renderSignature(n as IRSignatureNode, d as PdfDoc, rc as RenderChildrenFn)],
    ['custom',       (n, d, rc) => renderCustom(n as IRCustomNode, d as PdfDoc, rc as RenderChildrenFn)],
  ]);
}

export type { PdfRegistry, PdfNodeRenderer, RenderChildrenFn };
