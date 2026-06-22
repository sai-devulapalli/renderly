import { describe, it, expect } from 'vitest';
import { parseDocument } from '../../src/adapter.js';
import { isOk, isErr } from '@renderly/shared';
import {
  isContainerElement, isInputElement, isSubmitElement,
  isTextInput, isChoiceInput,
  isFileInput, isSignatureElement, isCustomElement, isRepeatElement,
} from '@renderly/schema';
import { isParseError, isValidationError } from '../../src/errors.js';

const PATIENT_INTAKE_JSON = JSON.stringify({
  version: '1.0',
  title: 'Patient Intake',
  elements: [
    { type: 'heading', level: 1, text: 'Patient Intake Form' },
    { type: 'text', content: 'All fields marked * are required.', intent: 'muted' },
    {
      type: 'container',
      id: 'name-row',
      direction: 'row',
      gap: 'md',
      children: [
        { type: 'input', kind: 'text', id: 'first-name', label: 'First Name *', required: true },
        { type: 'input', kind: 'text', id: 'last-name',  label: 'Last Name *',  required: true },
      ],
    },
    { type: 'input', kind: 'date',   id: 'dob',       label: 'Date of Birth *', required: true },
    { type: 'input', kind: 'number', id: 'age',       label: 'Age',              min: 0, max: 150 },
    {
      type: 'input', kind: 'choice', id: 'blood-type', label: 'Blood Type',
      options: [
        { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' }, { value: 'O+', label: 'O+' },
      ],
    },
    {
      type: 'submit', id: 'intake-submit',
      label: 'Submit Intake',
      route: '/api/v1/intake',
      context: { formVersion: 'intake-v3' },
    },
  ],
});

describe('input adapter e2e — patient intake form (no mocks)', () => {
  it('golden path: raw JSON string parses and validates to a Document', () => {
    const result = parseDocument(PATIENT_INTAKE_JSON);
    expect(isOk(result)).toBe(true);
  });

  it('golden path: parsed Document has correct version and title', () => {
    const result = parseDocument(PATIENT_INTAKE_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    expect(result.value.version).toBe('1.0');
    expect(result.value.title).toBe('Patient Intake');
  });

  it('golden path: all seven root elements are present and typed', () => {
    const result = parseDocument(PATIENT_INTAKE_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const { elements } = result.value;
    expect(elements).toHaveLength(7);
    expect(elements[0]?.type).toBe('heading');
    expect(elements[1]?.type).toBe('text');
    expect(isContainerElement(elements[2]!)).toBe(true);
    expect(isSubmitElement(elements[6]!)).toBe(true);
  });

  it('golden path: container children are correctly typed inputs', () => {
    const result = parseDocument(PATIENT_INTAKE_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const container = result.value.elements[2]!;
    if (!isContainerElement(container)) throw new Error('expected container');
    const [first, last] = container.children;
    expect(isInputElement(first!)).toBe(true);
    expect(isInputElement(last!)).toBe(true);
    if (isInputElement(first!)) expect(isTextInput(first)).toBe(true);
  });

  it('golden path: choice input options are preserved', () => {
    const result = parseDocument(PATIENT_INTAKE_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const choice = result.value.elements[5]!;
    if (!isInputElement(choice)) throw new Error('expected input');
    expect(isChoiceInput(choice)).toBe(true);
    if (isChoiceInput(choice)) {
      expect(choice.options).toHaveLength(4);
      expect(choice.options[0]?.value).toBe('A+');
    }
  });

  it('golden path: submit opaque context is preserved verbatim', () => {
    const result = parseDocument(PATIENT_INTAKE_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const submit = result.value.elements[6]!;
    if (!isSubmitElement(submit)) throw new Error('expected submit');
    expect(submit.context).toEqual({ formVersion: 'intake-v3' });
  });

  it('error path: truncated JSON returns PARSE_ERROR', () => {
    const result = parseDocument('{"version":"1","elements":[{');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(isParseError(result.error)).toBe(true);
  });

  it('error path: valid JSON failing schema returns VALIDATION_ERROR with located failures', () => {
    const badForm = JSON.stringify({
      version: '1',
      elements: [
        { type: 'input', kind: 'text', label: 'Missing ID' },
        { type: 'heading', level: 99, text: 'Bad level' },
      ],
    });
    const result = parseDocument(badForm);
    expect(isErr(result)).toBe(true);
    if (isErr(result) && isValidationError(result.error)) {
      expect(result.error.failures.length).toBeGreaterThan(0);
      expect(result.error.failures.every((f) => typeof f.path === 'string')).toBe(true);
      expect(result.error.failures.every((f) => f.message.length > 0)).toBe(true);
    }
  });
});

// ── file input ────────────────────────────────────────────────────────────────

const FILE_INPUT_JSON = JSON.stringify({
  version: '1.0',
  title: 'Document Upload',
  elements: [
    {
      type: 'input', kind: 'file', id: 'passport',
      label: 'Passport Scan', accept: '.pdf,.jpg', multiple: false, required: true,
    },
    {
      type: 'input', kind: 'file', id: 'attachments',
      label: 'Supporting Documents', multiple: true,
    },
  ],
});

describe('input adapter e2e — file input element', () => {
  it('parses a document containing file inputs', () => {
    const result = parseDocument(FILE_INPUT_JSON);
    expect(isOk(result)).toBe(true);
  });

  it('preserves required and accept fields', () => {
    const result = parseDocument(FILE_INPUT_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const el = result.value.elements[0]!;
    expect(isInputElement(el)).toBe(true);
    if (!isInputElement(el)) return;
    expect(isFileInput(el)).toBe(true);
    if (!isFileInput(el)) return;
    expect(el.accept).toBe('.pdf,.jpg');
    expect(el.required).toBe(true);
    expect(el.multiple).toBe(false);
  });

  it('preserves multiple=true on the second element', () => {
    const result = parseDocument(FILE_INPUT_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const el = result.value.elements[1]!;
    if (!isInputElement(el) || !isFileInput(el)) return;
    expect(el.multiple).toBe(true);
  });

  it('rejects a file input missing the required id field', () => {
    const bad = JSON.stringify({
      version: '1', elements: [{ type: 'input', kind: 'file', label: 'No ID' }],
    });
    const result = parseDocument(bad);
    expect(isErr(result)).toBe(true);
    if (isErr(result) && isValidationError(result.error)) {
      expect(result.error.failures.some((f) => f.path.includes('elements'))).toBe(true);
    }
  });
});

// ── signature element ─────────────────────────────────────────────────────────

const SIGNATURE_JSON = JSON.stringify({
  version: '1.0',
  elements: [
    { type: 'signature', id: 'patient-sig', label: 'Patient Signature', required: true },
    { type: 'signature', id: 'witness-sig', label: 'Witness Signature' },
  ],
});

describe('input adapter e2e — signature element', () => {
  it('parses a document containing signature elements', () => {
    const result = parseDocument(SIGNATURE_JSON);
    expect(isOk(result)).toBe(true);
  });

  it('preserves id, label, and required', () => {
    const result = parseDocument(SIGNATURE_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const el = result.value.elements[0]!;
    expect(isSignatureElement(el)).toBe(true);
    if (!isSignatureElement(el)) return;
    expect(el.id).toBe('patient-sig');
    expect(el.label).toBe('Patient Signature');
    expect(el.required).toBe(true);
  });

  it('optional required defaults to undefined when absent', () => {
    const result = parseDocument(SIGNATURE_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const el = result.value.elements[1]!;
    if (!isSignatureElement(el)) return;
    expect(el.required).toBeUndefined();
  });

  it('rejects a signature missing the required id field', () => {
    const bad = JSON.stringify({
      version: '1', elements: [{ type: 'signature', label: 'No ID' }],
    });
    const result = parseDocument(bad);
    expect(isErr(result)).toBe(true);
  });
});

// ── custom element ────────────────────────────────────────────────────────────

const CUSTOM_JSON = JSON.stringify({
  version: '1.0',
  elements: [
    {
      type: 'custom', kind: 'rating-stars', id: 'satisfaction',
      label: 'Rate your visit', props: { maxStars: 5, color: 'gold' },
    },
    { type: 'custom', kind: 'nps-score', id: 'nps' },
  ],
});

describe('input adapter e2e — custom element', () => {
  it('parses a document containing custom elements', () => {
    const result = parseDocument(CUSTOM_JSON);
    expect(isOk(result)).toBe(true);
  });

  it('preserves kind, id, label, and props', () => {
    const result = parseDocument(CUSTOM_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const el = result.value.elements[0]!;
    expect(isCustomElement(el)).toBe(true);
    if (!isCustomElement(el)) return;
    expect(el.kind).toBe('rating-stars');
    expect(el.id).toBe('satisfaction');
    expect(el.label).toBe('Rate your visit');
    expect(el.props).toEqual({ maxStars: 5, color: 'gold' });
  });

  it('label and props are optional', () => {
    const result = parseDocument(CUSTOM_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const el = result.value.elements[1]!;
    if (!isCustomElement(el)) return;
    expect(el.label).toBeUndefined();
    expect(el.props).toBeUndefined();
  });

  it('rejects a custom element with an empty kind string', () => {
    const bad = JSON.stringify({
      version: '1', elements: [{ type: 'custom', kind: '', id: 'x' }],
    });
    const result = parseDocument(bad);
    expect(isErr(result)).toBe(true);
  });
});

// ── repeat element ────────────────────────────────────────────────────────────

const REPEAT_JSON = JSON.stringify({
  version: '1.0',
  elements: [
    {
      type: 'repeat',
      id: 'medications',
      label: 'Medications',
      addLabel: 'Add medication',
      removeLabel: 'Remove',
      minItems: 1,
      maxItems: 10,
      template: [
        { type: 'input', kind: 'text',   id: 'med-name',  label: 'Medication name',  required: true },
        { type: 'input', kind: 'text',   id: 'med-dose',  label: 'Dosage' },
        { type: 'input', kind: 'number', id: 'med-freq',  label: 'Times per day', min: 1 },
      ],
    },
  ],
});

describe('input adapter e2e — repeat element', () => {
  it('parses a document containing a repeat element', () => {
    const result = parseDocument(REPEAT_JSON);
    expect(isOk(result)).toBe(true);
  });

  it('preserves id, label, addLabel, removeLabel, minItems, maxItems', () => {
    const result = parseDocument(REPEAT_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const el = result.value.elements[0]!;
    expect(isRepeatElement(el)).toBe(true);
    if (!isRepeatElement(el)) return;
    expect(el.id).toBe('medications');
    expect(el.label).toBe('Medications');
    expect(el.addLabel).toBe('Add medication');
    expect(el.removeLabel).toBe('Remove');
    expect(el.minItems).toBe(1);
    expect(el.maxItems).toBe(10);
  });

  it('preserves the template array with all child elements', () => {
    const result = parseDocument(REPEAT_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const el = result.value.elements[0]!;
    if (!isRepeatElement(el)) return;
    expect(el.template).toHaveLength(3);
    expect(el.template[0]?.type).toBe('input');
    expect(isInputElement(el.template[0]!)).toBe(true);
  });

  it('template children are fully typed (text input, number input)', () => {
    const result = parseDocument(REPEAT_JSON);
    if (!isOk(result)) throw new Error('expected ok');
    const el = result.value.elements[0]!;
    if (!isRepeatElement(el)) return;
    const [name, , freq] = el.template;
    if (!isInputElement(name!)) return;
    expect(isTextInput(name)).toBe(true);
    if (!isInputElement(freq!)) return;
    expect(freq.kind).toBe('number');
  });

  it('rejects a repeat element with an empty template array', () => {
    const bad = JSON.stringify({
      version: '1', elements: [{ type: 'repeat', id: 'r', label: 'R', template: [] }],
    });
    const result = parseDocument(bad);
    expect(isErr(result)).toBe(true);
  });

  it('rejects a repeat element missing the template field', () => {
    const bad = JSON.stringify({
      version: '1', elements: [{ type: 'repeat', id: 'r', label: 'R' }],
    });
    const result = parseDocument(bad);
    expect(isErr(result)).toBe(true);
  });

  it('repeat template may contain a nested signature element', () => {
    const doc = JSON.stringify({
      version: '1',
      elements: [{
        type: 'repeat', id: 'r', label: 'Consents',
        template: [{ type: 'signature', id: 'sig', label: 'Sign each' }],
      }],
    });
    const result = parseDocument(doc);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const el = result.value.elements[0]!;
    if (!isRepeatElement(el)) return;
    expect(isSignatureElement(el.template[0]!)).toBe(true);
  });
});
