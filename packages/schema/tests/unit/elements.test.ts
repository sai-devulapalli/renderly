import { describe, it, expect } from 'vitest';
import type { Element, InputElement } from '../../src/elements.js';
import {
  isContainerElement,
  isHeadingElement,
  isTextElement,
  isInputElement,
  isSubmitElement,
  isTextInput,
  isNumberInput,
  isDateInput,
  isChoiceInput,
  isFileInput,
  isRepeatElement,
  isSignatureElement,
  isCustomElement,
  inputKindOf,
} from '../../src/elements.js';

const container: Element = { type: 'container', children: [] };
const heading: Element = { type: 'heading', level: 1, text: 'Title' };
const text: Element = { type: 'text', content: 'Hello' };
const textInput: Element = { type: 'input', kind: 'text', id: 'f1', label: 'Name' };
const numberInput: Element = { type: 'input', kind: 'number', id: 'f2', label: 'Age' };
const dateInput: Element = { type: 'input', kind: 'date', id: 'f3', label: 'DOB' };
const choiceInput: Element = {
  type: 'input',
  kind: 'choice',
  id: 'f4',
  label: 'Gender',
  options: [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }],
};
const fileInput: Element = { type: 'input', kind: 'file', id: 'f5', label: 'Attachment' };
const submit: Element = { type: 'submit', id: 's1', label: 'Submit', route: '/api/submit' };
const repeat: Element = { type: 'repeat', id: 'r1', label: 'Items', template: [] };
const signature: Element = { type: 'signature', id: 'sig1', label: 'Sign here' };
const custom: Element = { type: 'custom', kind: 'rating', id: 'cu1' };

describe('isContainerElement', () => {
  it('returns true for container', () => expect(isContainerElement(container)).toBe(true));
  it('returns false for non-container', () => expect(isContainerElement(heading)).toBe(false));
});

describe('isHeadingElement', () => {
  it('returns true for heading', () => expect(isHeadingElement(heading)).toBe(true));
  it('returns false for non-heading', () => expect(isHeadingElement(text)).toBe(false));
});

describe('isTextElement', () => {
  it('returns true for text', () => expect(isTextElement(text)).toBe(true));
  it('returns false for non-text', () => expect(isTextElement(submit)).toBe(false));
});

describe('isInputElement', () => {
  it('returns true for any input kind', () => {
    expect(isInputElement(textInput)).toBe(true);
    expect(isInputElement(numberInput)).toBe(true);
  });
  it('returns false for non-input', () => expect(isInputElement(submit)).toBe(false));
});

describe('isSubmitElement', () => {
  it('returns true for submit', () => expect(isSubmitElement(submit)).toBe(true));
  it('returns false for non-submit', () => expect(isSubmitElement(container)).toBe(false));
});

describe('isTextInput', () => {
  it('returns true for text input', () => expect(isTextInput(textInput as InputElement)).toBe(true));
  it('returns false for number input', () => expect(isTextInput(numberInput as InputElement)).toBe(false));
});

describe('isNumberInput', () => {
  it('returns true for number input', () => expect(isNumberInput(numberInput as InputElement)).toBe(true));
  it('returns false for date input', () => expect(isNumberInput(dateInput as InputElement)).toBe(false));
});

describe('isDateInput', () => {
  it('returns true for date input', () => expect(isDateInput(dateInput as InputElement)).toBe(true));
  it('returns false for choice input', () => expect(isDateInput(choiceInput as InputElement)).toBe(false));
});

describe('isChoiceInput', () => {
  it('returns true for choice input', () => expect(isChoiceInput(choiceInput as InputElement)).toBe(true));
  it('returns false for text input', () => expect(isChoiceInput(textInput as InputElement)).toBe(false));
});

describe('isFileInput', () => {
  it('returns true for file input', () => expect(isFileInput(fileInput as InputElement)).toBe(true));
  it('returns false for text input', () => expect(isFileInput(textInput as InputElement)).toBe(false));
});

describe('inputKindOf', () => {
  it('returns kind for each input type', () => {
    expect(inputKindOf(textInput as InputElement)).toBe('text');
    expect(inputKindOf(numberInput as InputElement)).toBe('number');
    expect(inputKindOf(dateInput as InputElement)).toBe('date');
    expect(inputKindOf(choiceInput as InputElement)).toBe('choice');
    expect(inputKindOf(fileInput as InputElement)).toBe('file');
  });
});

describe('isRepeatElement', () => {
  it('returns true for repeat', () => expect(isRepeatElement(repeat)).toBe(true));
  it('returns false for non-repeat', () => expect(isRepeatElement(container)).toBe(false));
});

describe('isSignatureElement', () => {
  it('returns true for signature', () => expect(isSignatureElement(signature)).toBe(true));
  it('returns false for non-signature', () => expect(isSignatureElement(container)).toBe(false));
});

describe('isCustomElement', () => {
  it('returns true for custom', () => expect(isCustomElement(custom)).toBe(true));
  it('returns false for non-custom', () => expect(isCustomElement(container)).toBe(false));
});

describe('ContainerElement — optional props', () => {
  it('accepts a full container with all optional props', () => {
    const el: Element = {
      type: 'container',
      id: 'c1',
      direction: 'row',
      gap: 'lg',
      children: [heading],
    };
    expect(isContainerElement(el)).toBe(true);
  });

  it('accepts nested containers', () => {
    const inner: Element = { type: 'container', children: [] };
    const outer: Element = { type: 'container', children: [inner] };
    expect(isContainerElement(outer)).toBe(true);
    expect((outer as { children: Element[] }).children).toHaveLength(1);
  });
});
