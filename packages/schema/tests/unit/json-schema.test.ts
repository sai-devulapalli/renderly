import { describe, it, expect, beforeAll } from 'vitest';
import Ajv from 'ajv';
import schema from '../../src/json-schema/document.schema.json' assert { type: 'json' };

let validate: ReturnType<Ajv['compile']>;

beforeAll(() => {
  const ajv = new Ajv({ strict: true });
  validate = ajv.compile(schema);
});

function check(doc: unknown): boolean {
  return validate(doc) as boolean;
}

describe('JSON Schema — valid documents', () => {
  it('accepts a minimal document', () => {
    expect(check({ version: '1', elements: [] })).toBe(true);
  });

  it('accepts a document with a title', () => {
    expect(check({ version: '1', title: 'My Form', elements: [] })).toBe(true);
  });

  it('accepts a heading element', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'heading', level: 1, text: 'Hello' }],
    })).toBe(true);
  });

  it('accepts a text element', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'text', content: 'Some text' }],
    })).toBe(true);
  });

  it('accepts a container element with children', () => {
    expect(check({
      version: '1',
      elements: [{
        type: 'container',
        children: [{ type: 'text', content: 'child' }],
      }],
    })).toBe(true);
  });

  it('accepts a text input element', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'input', kind: 'text', id: 'f1', label: 'Name' }],
    })).toBe(true);
  });

  it('accepts a number input element', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'input', kind: 'number', id: 'f2', label: 'Age' }],
    })).toBe(true);
  });

  it('accepts a date input element', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'input', kind: 'date', id: 'f3', label: 'DOB' }],
    })).toBe(true);
  });

  it('accepts a choice input element', () => {
    expect(check({
      version: '1',
      elements: [{
        type: 'input', kind: 'choice', id: 'f4', label: 'Status',
        options: [{ value: 'a', label: 'A' }],
      }],
    })).toBe(true);
  });

  it('accepts a submit element', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'submit', id: 's1', label: 'Submit', route: '/api/submit' }],
    })).toBe(true);
  });

  it('accepts a document with form errors', () => {
    expect(check({
      version: '1',
      elements: [],
      errors: {
        form: ['Something went wrong'],
        fields: { name: ['Required'] },
      },
    })).toBe(true);
  });
});

describe('JSON Schema — invalid documents', () => {
  it('rejects a document missing version', () => {
    expect(check({ elements: [] })).toBe(false);
  });

  it('rejects a document missing elements', () => {
    expect(check({ version: '1' })).toBe(false);
  });

  it('rejects an empty version string', () => {
    expect(check({ version: '', elements: [] })).toBe(false);
  });

  it('rejects an unknown element type', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'unknown-type' }],
    })).toBe(false);
  });

  it('rejects a heading missing level', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'heading', text: 'No level' }],
    })).toBe(false);
  });

  it('rejects a heading missing text', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'heading', level: 1 }],
    })).toBe(false);
  });

  it('rejects an input missing id', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'input', kind: 'text', label: 'Name' }],
    })).toBe(false);
  });

  it('rejects a choice input with empty options array', () => {
    expect(check({
      version: '1',
      elements: [{
        type: 'input', kind: 'choice', id: 'f1', label: 'Choose', options: [],
      }],
    })).toBe(false);
  });

  it('rejects a submit missing route', () => {
    expect(check({
      version: '1',
      elements: [{ type: 'submit', id: 's1', label: 'Go' }],
    })).toBe(false);
  });

  it('rejects a document with additional top-level properties', () => {
    expect(check({ version: '1', elements: [], unknown: true })).toBe(false);
  });
});
