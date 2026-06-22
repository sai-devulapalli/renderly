import { describe, it, expect } from 'vitest';
import { createDefaultPdfRegistry, createPdfRegistry } from '../../src/registry.js';
import { renderDocument } from '../../src/adapter.js';
import type { IRNode, IRHeadingNode, IRInputTextNode, IRSubmitNode } from '@renderly/schema';
import { isOk } from '@renderly/shared';

function makeNodes(): IRNode[] {
  return [
    { type: 'heading', id: 'h', level: 1, text: 'Patient Form', size: 'xl', children: [] } as IRHeadingNode,
    {
      type: 'input-text', id: 'name', label: 'Full Name',
      placeholder: 'Enter name', required: true,
      minLength: undefined, maxLength: undefined, errors: [], children: [],
    } as IRInputTextNode,
    {
      type: 'submit', id: 's', label: 'Submit',
      route: '/api/submit', context: {}, children: [],
    } as IRSubmitNode,
  ];
}

// ── registry ──────────────────────────────────────────────────────────────────

describe('createPdfRegistry', () => {
  it('returns an empty Map', () => {
    expect(createPdfRegistry().size).toBe(0);
  });
});

describe('createDefaultPdfRegistry', () => {
  it('has 14 renderers', () => {
    expect(createDefaultPdfRegistry().size).toBe(14);
  });

  it('registers all known node types', () => {
    const registry = createDefaultPdfRegistry();
    const expectedTypes = [
      'container', 'heading', 'text',
      'input-text', 'input-number', 'input-date', 'input-choice',
      'submit', 'error-form', 'error-field', 'repeat',
      'input-file', 'signature', 'custom',
    ];
    for (const t of expectedTypes) {
      expect(registry.has(t as never), `missing: ${t}`).toBe(true);
    }
  });
});

// ── renderDocument ────────────────────────────────────────────────────────────

describe('renderDocument', () => {
  it('returns ok with a Buffer for a valid node list', async () => {
    const result = await renderDocument(makeNodes());
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toBeInstanceOf(Buffer);
  });

  it('produces non-empty output', async () => {
    const result = await renderDocument(makeNodes());
    if (!isOk(result)) throw new Error('expected ok');
    expect(result.value.length).toBeGreaterThan(0);
  });

  it('output starts with %PDF- magic bytes', async () => {
    const result = await renderDocument(makeNodes());
    if (!isOk(result)) throw new Error('expected ok');
    expect(result.value.toString('ascii', 0, 5)).toBe('%PDF-');
  });

  it('returns error for unregistered node type', async () => {
    const nodes = [{ type: 'unknown-custom' as never, children: [] }];
    const result = await renderDocument(nodes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UNREGISTERED_NODE_TYPE');
    expect(result.error.nodeType).toBe('unknown-custom');
  });

  it('accepts custom margin option', async () => {
    const result = await renderDocument(makeNodes(), undefined, { margin: 72 });
    expect(isOk(result)).toBe(true);
  });

  it('accepts title option', async () => {
    const result = await renderDocument(makeNodes(), undefined, { title: 'Patient Registration' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.length).toBeGreaterThan(0);
  });

  it('renders an empty node list without error', async () => {
    const result = await renderDocument([]);
    expect(isOk(result)).toBe(true);
  });

  it('renders all IR node types without throwing', async () => {
    const nodes: IRNode[] = [
      { type: 'heading', id: undefined, level: 2, text: 'Section', size: 'md', children: [] },
      { type: 'text', id: undefined, content: 'Info text', weight: 'normal', intent: 'default', children: [] },
      {
        type: 'input-text', id: 'n', label: 'Name',
        placeholder: undefined, required: false, minLength: undefined, maxLength: undefined,
        errors: [], children: [],
      },
      {
        type: 'input-number', id: 'age', label: 'Age',
        placeholder: undefined, required: false, min: undefined, max: undefined,
        errors: [], children: [],
      },
      {
        type: 'input-date', id: 'dob', label: 'DOB',
        required: false, min: undefined, max: undefined, errors: [], children: [],
      },
      {
        type: 'input-choice', id: 'g', label: 'Gender',
        required: false, multiple: false,
        options: [{ value: 'm', label: 'M' }, { value: 'f', label: 'F' }],
        errors: [], children: [],
      },
      {
        type: 'container', id: undefined, direction: 'column', gap: 'md', cols: undefined,
        children: [
          { type: 'heading', id: undefined, level: 3, text: 'Child', size: 'sm', children: [] },
        ],
      },
      { type: 'error-form', id: undefined, message: 'Form error', children: [] },
      { type: 'error-field', id: undefined, fieldId: 'n', message: 'Required', children: [] },
      {
        type: 'submit', id: 's', label: 'Go',
        route: '/go', context: {}, children: [],
      },
    ];

    const result = await renderDocument(nodes);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.toString('ascii', 0, 5)).toBe('%PDF-');
  });
});
