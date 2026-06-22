import { describe, it, expect } from 'vitest';
import type { Document } from '@renderly/schema';
import { isOk, isErr } from '@renderly/shared';
import { walk, createDefaultRegistry, createRegistry } from '../../src/index.js';

const registry = createDefaultRegistry();

describe('walk — empty document', () => {
  it('returns ok with empty array', () => {
    const doc: Document = { version: '1', elements: [] };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toEqual([]);
  });
});

describe('walk — single elements', () => {
  it('walks a heading element', () => {
    const doc: Document = { version: '1', elements: [{ type: 'heading', level: 1, text: 'Hi' }] };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.type).toBe('heading');
    }
  });

  it('walks all built-in element types', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'heading', level: 1, text: 'H' },
        { type: 'text', content: 'T' },
        { type: 'input', kind: 'text', id: 'f1', label: 'L1' },
        { type: 'input', kind: 'number', id: 'f2', label: 'L2' },
        { type: 'input', kind: 'date', id: 'f3', label: 'L3' },
        { type: 'input', kind: 'choice', id: 'f4', label: 'L4', options: [{ value: 'a', label: 'A' }] },
        { type: 'submit', id: 's1', label: 'Go', route: '/api' },
      ],
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toHaveLength(7);
  });
});

describe('walk — nested containers', () => {
  it('recursively walks container children', () => {
    const doc: Document = {
      version: '1',
      elements: [{
        type: 'container',
        children: [
          { type: 'text', content: 'inner' },
          { type: 'heading', level: 2, text: 'inner heading' },
        ],
      }],
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const container = result.value[0]!;
      expect(container.type).toBe('container');
      expect(container.children).toHaveLength(2);
    }
  });
});

describe('walk — form errors', () => {
  it('prepends IRFormErrorNode when doc.errors.form is present', () => {
    const doc: Document = {
      version: '1',
      elements: [{ type: 'text', content: 'body' }],
      errors: { form: ['Submission failed', 'Try again'] },
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]?.type).toBe('error-form');
      expect(result.value[1]?.type).toBe('error-form');
      expect(result.value[2]?.type).toBe('text');
      expect((result.value[0] as { message: string }).message).toBe('Submission failed');
    }
  });

  it('does not prepend error nodes when form errors array is empty', () => {
    const doc: Document = {
      version: '1',
      elements: [{ type: 'text', content: 'body' }],
      errors: { form: [] },
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value[0]?.type).toBe('text');
    }
  });

  it('embeds field errors into input nodes', () => {
    const doc: Document = {
      version: '1',
      elements: [{ type: 'input', kind: 'text', id: 'email', label: 'Email' }],
      errors: { fields: { email: ['Invalid email'] } },
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const node = result.value[0] as { errors: string[] };
      expect(node.errors).toEqual(['Invalid email']);
    }
  });
});

describe('walk — boundary cases', () => {
  it('walks a choice element with zero options', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'choice', id: 'pick', label: 'Pick one', options: [] },
      ],
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const node = result.value[0] as { type: string; options: readonly unknown[] };
      expect(node.type).toBe('input-choice');
      expect(node.options).toEqual([]);
    }
  });
});

describe('walk — unregistered element type', () => {
  it('returns err with UNREGISTERED_ELEMENT_TYPE when handler not found', () => {
    const emptyRegistry = createRegistry();
    const doc: Document = { version: '1', elements: [{ type: 'heading', level: 1, text: 'H' }] };
    const result = walk(doc, emptyRegistry);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('UNREGISTERED_ELEMENT_TYPE');
    }
  });
});

describe('walk — handler returns err', () => {
  it('propagates handler error through walkElements', () => {
    const failingRegistry = createRegistry();
    failingRegistry.register('heading', () => ({
      ok: false,
      error: { code: 'HANDLER_FAILED', elementType: 'heading' },
    }));
    const doc: Document = { version: '1', elements: [{ type: 'heading', level: 1, text: 'H' }] };
    const result = walk(doc, failingRegistry);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('HANDLER_FAILED');
    }
  });
});
