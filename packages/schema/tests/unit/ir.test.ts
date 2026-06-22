import { describe, it, expect } from 'vitest';
import type { IRNode } from '../../src/ir.js';
import {
  isIRContainerNode,
  isIRHeadingNode,
  isIRTextNode,
  isIRInputNode,
  isIRSubmitNode,
  isIRFormErrorNode,
  isIRFieldErrorNode,
} from '../../src/ir.js';

const container: IRNode = {
  type: 'container', id: undefined, direction: 'column',
  gap: 'md', children: [],
};
const heading: IRNode = {
  type: 'heading', id: undefined, level: 1,
  text: 'Title', size: 'lg', children: [],
};
const text: IRNode = {
  type: 'text', id: undefined, content: 'Hello',
  weight: 'normal', intent: 'default', children: [],
};
const inputText: IRNode = {
  type: 'input-text', id: 'f1', label: 'Name',
  placeholder: undefined, required: false,
  minLength: undefined, maxLength: undefined,
  errors: [], children: [],
};
const inputNumber: IRNode = {
  type: 'input-number', id: 'f2', label: 'Age',
  placeholder: undefined, required: false,
  min: undefined, max: undefined,
  errors: [], children: [],
};
const inputDate: IRNode = {
  type: 'input-date', id: 'f3', label: 'DOB',
  required: false, min: undefined, max: undefined,
  errors: [], children: [],
};
const inputChoice: IRNode = {
  type: 'input-choice', id: 'f4', label: 'Gender',
  required: false, multiple: false,
  options: [{ value: 'M', label: 'Male' }],
  errors: [], children: [],
};
const submit: IRNode = {
  type: 'submit', id: 's1', label: 'Submit',
  route: '/api/submit', context: {}, children: [],
};
const formError: IRNode = {
  type: 'error-form', id: undefined,
  message: 'Submission failed', children: [],
};
const fieldError: IRNode = {
  type: 'error-field', id: undefined,
  fieldId: 'name', message: 'Required', children: [],
};

describe('isIRContainerNode', () => {
  it('returns true for container', () => expect(isIRContainerNode(container)).toBe(true));
  it('returns false for non-container', () => expect(isIRContainerNode(heading)).toBe(false));
});

describe('isIRHeadingNode', () => {
  it('returns true for heading', () => expect(isIRHeadingNode(heading)).toBe(true));
  it('returns false for text', () => expect(isIRHeadingNode(text)).toBe(false));
});

describe('isIRTextNode', () => {
  it('returns true for text', () => expect(isIRTextNode(text)).toBe(true));
  it('returns false for heading', () => expect(isIRTextNode(heading)).toBe(false));
});

describe('isIRInputNode', () => {
  it('returns true for input-text', () => expect(isIRInputNode(inputText)).toBe(true));
  it('returns true for input-number', () => expect(isIRInputNode(inputNumber)).toBe(true));
  it('returns true for input-date', () => expect(isIRInputNode(inputDate)).toBe(true));
  it('returns true for input-choice', () => expect(isIRInputNode(inputChoice)).toBe(true));
  it('returns false for submit', () => expect(isIRInputNode(submit)).toBe(false));
});

describe('isIRSubmitNode', () => {
  it('returns true for submit', () => expect(isIRSubmitNode(submit)).toBe(true));
  it('returns false for container', () => expect(isIRSubmitNode(container)).toBe(false));
});

describe('isIRFormErrorNode', () => {
  it('returns true for form error', () => expect(isIRFormErrorNode(formError)).toBe(true));
  it('returns false for field error', () => expect(isIRFormErrorNode(fieldError)).toBe(false));
});

describe('isIRFieldErrorNode', () => {
  it('returns true for field error', () => expect(isIRFieldErrorNode(fieldError)).toBe(true));
  it('returns false for form error', () => expect(isIRFieldErrorNode(formError)).toBe(false));
});
