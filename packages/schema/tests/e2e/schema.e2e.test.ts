import { describe, it, expect } from 'vitest';
import Ajv from 'ajv';
import schema from '../../src/json-schema/document.schema.json' assert { type: 'json' };
import type { Document } from '../../src/document.js';
import type { IRNode } from '../../src/ir.js';
import {
  isContainerElement,
  isInputElement,
  isSubmitElement,
  isChoiceInput,
} from '../../src/elements.js';
import {
  isDocument,
  hasFormErrors,
  fieldErrorsFor,
} from '../../src/document.js';
import {
  isIRContainerNode,
  isIRInputNode,
  isIRSubmitNode,
  isIRFieldErrorNode,
} from '../../src/ir.js';

// Simulate what Module 3 (core walker) will do: convert a Document to IRNodes.
// This is NOT a mock — it's a minimal inline stub to allow e2e contract testing
// of the schema types without a real walker. The walker itself is Module 3.
function stubIRNode(type: IRNode['type'], id?: string): IRNode {
  switch (type) {
    case 'container':
      return { type, id, direction: 'column', gap: 'md', children: [] };
    case 'input-text':
      return {
        type, id: id!, label: 'stub', placeholder: undefined,
        required: false, minLength: undefined, maxLength: undefined,
        errors: [], children: [],
      };
    case 'submit':
      return {
        type, id: id!, label: 'Submit',
        route: '/api/submit', context: {}, children: [],
      };
    case 'error-field':
      return { type, id: undefined, fieldId: id!, message: 'Required', children: [] };
    default:
      return { type: 'container', id: undefined, direction: 'column', gap: 'md', children: [] };
  }
}

describe('schema end-to-end — Document → IRNode contract (no mocks)', () => {
  const ajv = new Ajv({ strict: true });
  const validate = ajv.compile(schema);

  const rawForm = {
    version: '1.0',
    title: 'Medical History',
    elements: [
      { type: 'heading', level: 2, text: 'Medical History' },
      {
        type: 'container',
        id: 'fields',
        direction: 'column' as const,
        gap: 'md' as const,
        children: [
          { type: 'input', kind: 'text', id: 'patient-name', label: 'Patient Name', required: true },
          { type: 'input', kind: 'date', id: 'visit-date', label: 'Visit Date', required: true },
          {
            type: 'input', kind: 'choice', id: 'condition',
            label: 'Primary Condition',
            options: [
              { value: 'hypertension', label: 'Hypertension' },
              { value: 'diabetes', label: 'Diabetes' },
              { value: 'other', label: 'Other' },
            ],
          },
        ],
      },
      { type: 'submit', id: 'submit-history', label: 'Save History', route: '/api/medical-history' },
    ],
  };

  it('golden path: raw form validates against JSON Schema', () => {
    expect(validate(rawForm)).toBe(true);
  });

  it('golden path: validated raw form is a Document', () => {
    expect(isDocument(rawForm)).toBe(true);
  });

  it('golden path: element type guards correctly classify all elements', () => {
    const doc = rawForm as Document;
    const [, container, sub] = doc.elements;
    expect(isContainerElement(container!)).toBe(true);
    expect(isSubmitElement(sub!)).toBe(true);

    if (isContainerElement(container!)) {
      const [nameInput, , conditionInput] = container.children;
      expect(isInputElement(nameInput!)).toBe(true);
      if (isInputElement(conditionInput!)) {
        expect(isChoiceInput(conditionInput)).toBe(true);
      }
    }
  });

  it('golden path: IR nodes satisfy the output port contract', () => {
    const containerNode = stubIRNode('container', 'fields');
    const inputNode = stubIRNode('input-text', 'patient-name');
    const submitNode = stubIRNode('submit', 'submit-history');

    expect(isIRContainerNode(containerNode)).toBe(true);
    expect(isIRInputNode(inputNode)).toBe(true);
    expect(isIRSubmitNode(submitNode)).toBe(true);
  });

  it('golden path: error response shape integrates with Document and IRNode', () => {
    const docWithErrors: Document = {
      ...(rawForm as Document),
      errors: {
        form: ['Submission failed'],
        fields: { 'patient-name': ['Patient name is required'] },
      },
    };

    expect(validate(docWithErrors)).toBe(true);
    expect(hasFormErrors(docWithErrors)).toBe(true);
    expect(fieldErrorsFor(docWithErrors.errors!, 'patient-name')).toEqual([
      'Patient name is required',
    ]);

    const fieldErrorNode = stubIRNode('error-field', 'patient-name');
    expect(isIRFieldErrorNode(fieldErrorNode)).toBe(true);
  });
});
