import { describe, it, expect } from 'vitest';
import type { Document } from '@renderly/schema';
import { isOk, isErr } from '@renderly/shared';
import {
  isIRContainerNode, isIRInputNode, isIRSubmitNode,
  isIRFormErrorNode, isIRHeadingNode,
} from '@renderly/schema';
import { walk, createDefaultRegistry, createRegistry } from '../../src/index.js';

const registry = createDefaultRegistry();

const medicalHistoryForm: Document = {
  version: '1.0',
  title: 'Medical History',
  elements: [
    { type: 'heading', level: 1, text: 'Medical History Form' },
    { type: 'text', content: 'Complete all fields. Required fields are marked.', intent: 'muted' },
    {
      type: 'container',
      id: 'patient-info',
      direction: 'row',
      gap: 'md',
      children: [
        { type: 'input', kind: 'text', id: 'first-name', label: 'First Name', required: true },
        { type: 'input', kind: 'text', id: 'last-name', label: 'Last Name', required: true },
      ],
    },
    { type: 'input', kind: 'date', id: 'dob', label: 'Date of Birth', required: true },
    { type: 'input', kind: 'number', id: 'age', label: 'Age', min: 0, max: 150 },
    {
      type: 'input', kind: 'choice', id: 'blood-type', label: 'Blood Type',
      options: [
        { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
        { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
        { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
      ],
    },
    { type: 'submit', id: 'submit-history', label: 'Save Medical History', route: '/api/medical-history' },
  ],
};

describe('core e2e — medical history form (no mocks)', () => {
  it('golden path: walk produces an IRNode tree', () => {
    const result = walk(medicalHistoryForm, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) throw new Error('expected ok');
    expect(result.value).toHaveLength(7);
  });

  it('golden path: heading node has resolved defaults', () => {
    const result = walk(medicalHistoryForm, registry);
    if (!isOk(result)) throw new Error('expected ok');
    const heading = result.value[0]!;
    expect(isIRHeadingNode(heading)).toBe(true);
    if (isIRHeadingNode(heading)) {
      expect(heading.level).toBe(1);
      expect(heading.size).toBe('lg');
    }
  });

  it('golden path: container node has resolved direction and gap', () => {
    const result = walk(medicalHistoryForm, registry);
    if (!isOk(result)) throw new Error('expected ok');
    const container = result.value[2]!;
    expect(isIRContainerNode(container)).toBe(true);
    if (isIRContainerNode(container)) {
      expect(container.id).toBe('patient-info');
      expect(container.direction).toBe('row');
      expect(container.gap).toBe('md');
      expect(container.children).toHaveLength(2);
      expect(isIRInputNode(container.children[0]!)).toBe(true);
    }
  });

  it('golden path: input nodes carry empty errors when no FormErrors', () => {
    const result = walk(medicalHistoryForm, registry);
    if (!isOk(result)) throw new Error('expected ok');
    const dateNode = result.value[3] as { errors: string[] };
    expect(dateNode.errors).toEqual([]);
  });

  it('golden path: submit node has resolved context default', () => {
    const result = walk(medicalHistoryForm, registry);
    if (!isOk(result)) throw new Error('expected ok');
    const submit = result.value[6]!;
    expect(isIRSubmitNode(submit)).toBe(true);
    if (isIRSubmitNode(submit)) {
      expect(submit.route).toBe('/api/medical-history');
      expect(submit.context).toEqual({});
    }
  });

  it('golden path: walk with field errors injects errors into the correct nodes', () => {
    const docWithErrors: Document = {
      ...medicalHistoryForm,
      errors: {
        form: ['Please fix the errors below'],
        fields: {
          'first-name': ['First name is required'],
          dob: ['Date of birth is required'],
        },
      },
    };
    const result = walk(docWithErrors, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) throw new Error('expected ok');

    expect(isIRFormErrorNode(result.value[0]!)).toBe(true);

    const container = result.value[3]!;
    if (isIRContainerNode(container)) {
      const firstNameNode = container.children[0] as { errors: string[] };
      expect(firstNameNode.errors).toEqual(['First name is required']);
    }

    const dobNode = result.value[4] as { errors: string[] };
    expect(dobNode.errors).toEqual(['Date of birth is required']);
  });

  it('golden path: unregistered element type returns a typed error', () => {
    const emptyRegistry = createRegistry();
    const result = walk(medicalHistoryForm, emptyRegistry);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('UNREGISTERED_ELEMENT_TYPE');
    }
  });
});
