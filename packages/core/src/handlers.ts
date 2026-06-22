import type {
  Element,
  ContainerElement,
  HeadingElement,
  TextElement,
  TextInputElement,
  NumberInputElement,
  DateInputElement,
  ChoiceInputElement,
  SubmitElement,
  ComputedElement,
  RepeatElement,
  FieldValues,
  FieldValue,
  FormErrors,
  IRRepeatItemNode,
  FileInputElement,
  SignatureElement,
  CustomElement,
} from '@renderly/schema';
import { fieldErrorsFor } from '@renderly/schema';
import { ok } from '@renderly/shared';
import type { ElementHandler } from './types.js';
import {
  buildContainerNode,
  buildHeadingNode,
  buildTextNode,
  buildInputTextNode,
  buildInputNumberNode,
  buildInputDateNode,
  buildInputChoiceNode,
  buildSubmitNode,
  buildRepeatNode,
  buildRepeatItemNode,
  buildInputFileNode,
  buildSignatureNode,
  buildCustomNode,
} from './builders.js';
import { evaluateExpr, formatComputedValue } from './expr.js';
import { evaluateValidationRules } from './rules.js';

export const containerHandler: ElementHandler = (element, context) => {
  const el = element as ContainerElement;
  const childrenResult = context.walkChildren(el.children);
  if (!childrenResult.ok) return childrenResult;
  return ok(buildContainerNode(el, childrenResult.value));
};

export const headingHandler: ElementHandler = (element, _context) => {
  return ok(buildHeadingNode(element as HeadingElement));
};

export const textHandler: ElementHandler = (element, _context) => {
  return ok(buildTextNode(element as TextElement));
};

export const textInputHandler: ElementHandler = (element, context) => {
  const el = element as TextInputElement;
  const formErrors = context.errors !== undefined
    ? fieldErrorsFor(context.errors, el.id)
    : [];
  const ruleErrors = context.values !== undefined && el.rules !== undefined && el.rules.length > 0
    ? evaluateValidationRules(el.rules, context.values)
    : [];
  return ok(buildInputTextNode(el, [...formErrors, ...ruleErrors]));
};

export const numberInputHandler: ElementHandler = (element, context) => {
  const el = element as NumberInputElement;
  const formErrors = context.errors !== undefined
    ? fieldErrorsFor(context.errors, el.id)
    : [];
  const ruleErrors = context.values !== undefined && el.rules !== undefined && el.rules.length > 0
    ? evaluateValidationRules(el.rules, context.values)
    : [];
  return ok(buildInputNumberNode(el, [...formErrors, ...ruleErrors]));
};

export const dateInputHandler: ElementHandler = (element, context) => {
  const el = element as DateInputElement;
  const formErrors = context.errors !== undefined
    ? fieldErrorsFor(context.errors, el.id)
    : [];
  const ruleErrors = context.values !== undefined && el.rules !== undefined && el.rules.length > 0
    ? evaluateValidationRules(el.rules, context.values)
    : [];
  return ok(buildInputDateNode(el, [...formErrors, ...ruleErrors]));
};

export const choiceInputHandler: ElementHandler = (element, context) => {
  const el = element as ChoiceInputElement;
  const formErrors = context.errors !== undefined
    ? fieldErrorsFor(context.errors, el.id)
    : [];
  const ruleErrors = context.values !== undefined && el.rules !== undefined && el.rules.length > 0
    ? evaluateValidationRules(el.rules, context.values)
    : [];
  const raw = context.values?.[el.id];
  const value = Array.isArray(raw)
    ? (raw as readonly string[])
    : typeof raw === 'string' ? raw : undefined;
  return ok(buildInputChoiceNode(el, [...formErrors, ...ruleErrors], value));
};

export const submitHandler: ElementHandler = (element, _context) => {
  return ok(buildSubmitNode(element as SubmitElement));
};

export const computedHandler: ElementHandler = (element, context) => {
  const el = element as ComputedElement;
  const value = context.values !== undefined
    ? evaluateExpr(el.expr, context.values)
    : undefined;
  const display = formatComputedValue(value, el.format ?? 'number');
  return ok(buildTextNode({
    type: 'text',
    id: el.id,
    content: `${el.label}: ${display}`,
    weight: 'normal',
    intent: 'default',
  }));
};

export function deriveItemCount(
  id: string,
  values: FieldValues | undefined,
  minItems: number,
): number {
  if (!values) return minItems;
  const raw = values[`${id}.__items`];
  if (typeof raw === 'number') return Math.max(minItems, raw);
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) return Math.max(minItems, n);
  }
  let maxIdx = -1;
  const prefix = `${id}[`;
  for (const key of Object.keys(values)) {
    if (!key.startsWith(prefix)) continue;
    const bracket = key.indexOf(']', prefix.length);
    if (bracket === -1) continue;
    const idx = parseInt(key.slice(prefix.length, bracket), 10);
    if (!isNaN(idx) && idx > maxIdx) maxIdx = idx;
  }
  return Math.max(minItems, maxIdx + 1);
}

function extractItemValues(id: string, index: number, values: FieldValues): FieldValues {
  const prefix = `${id}[${index}].`;
  const scoped: Record<string, FieldValue> = {};
  for (const [key, val] of Object.entries(values)) {
    if (key.startsWith(prefix) && val !== undefined) {
      scoped[key.slice(prefix.length)] = val;
    }
  }
  return scoped;
}

function extractItemErrors(
  id: string,
  index: number,
  errors: FormErrors | undefined,
): FormErrors | undefined {
  if (!errors?.fields) return undefined;
  const prefix = `${id}[${index}].`;
  const fields: Record<string, readonly string[]> = {};
  for (const [key, errs] of Object.entries(errors.fields)) {
    if (key.startsWith(prefix)) {
      fields[key.slice(prefix.length)] = errs;
    }
  }
  return Object.keys(fields).length > 0 ? { fields } : undefined;
}

export const repeatHandler: ElementHandler = (element, context) => {
  const el = element as RepeatElement;
  const fieldErrors = context.errors !== undefined
    ? fieldErrorsFor(context.errors, el.id)
    : [];
  const minItems = el.minItems ?? 1;
  const count = deriveItemCount(el.id, context.values, minItems);
  const actualCount = el.maxItems !== undefined ? Math.min(count, el.maxItems) : count;

  const items: IRRepeatItemNode[] = [];
  for (let i = 0; i < actualCount; i++) {
    const itemValues = context.values !== undefined
      ? extractItemValues(el.id, i, context.values)
      : undefined;
    const itemErrors = extractItemErrors(el.id, i, context.errors);
    const childrenResult = context.walkChildren(el.template, {
      values: itemValues,
      errors: itemErrors,
    });
    if (!childrenResult.ok) return childrenResult;
    items.push(buildRepeatItemNode(i, childrenResult.value));
  }

  return ok(buildRepeatNode(el, items, fieldErrors));
};

export const fileInputHandler: ElementHandler = (element, context) => {
  const el = element as FileInputElement;
  const formErrors = context.errors !== undefined
    ? fieldErrorsFor(context.errors, el.id)
    : [];
  const ruleErrors = context.values !== undefined && el.rules !== undefined && el.rules.length > 0
    ? evaluateValidationRules(el.rules, context.values)
    : [];
  return ok(buildInputFileNode(el, [...formErrors, ...ruleErrors]));
};

export const signatureHandler: ElementHandler = (element, context) => {
  const el = element as SignatureElement;
  const formErrors = context.errors !== undefined
    ? fieldErrorsFor(context.errors, el.id)
    : [];
  const ruleErrors = context.values !== undefined && el.rules !== undefined && el.rules.length > 0
    ? evaluateValidationRules(el.rules, context.values)
    : [];
  return ok(buildSignatureNode(el, [...formErrors, ...ruleErrors]));
};

export const customHandler: ElementHandler = (element, context) => {
  const el = element as CustomElement;
  const formErrors = context.errors !== undefined
    ? fieldErrorsFor(context.errors, el.id)
    : [];
  return ok(buildCustomNode(el, formErrors));
};

export const ALL_HANDLERS: ReadonlyMap<string, ElementHandler> = new Map([
  ['container', containerHandler],
  ['heading', headingHandler],
  ['text', textHandler],
  ['input:text', textInputHandler],
  ['input:number', numberInputHandler],
  ['input:date', dateInputHandler],
  ['input:choice', choiceInputHandler],
  ['submit', submitHandler],
  ['computed', computedHandler],
  ['repeat', repeatHandler],
  ['input:file', fileInputHandler],
  ['signature', signatureHandler],
  ['custom', customHandler],
] as const);
