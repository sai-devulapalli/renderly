import { describe, it, expect } from 'vitest';
import type { Document } from '@renderly/schema';
import { extractFields, extractSubmit } from '../../src/extract.js';

// ── shared fixtures ───────────────────────────────────────────────────────────

const BASE_DOC: Document = { version: '1', elements: [] };

// ── extractFields ─────────────────────────────────────────────────────────────

describe('extractFields', () => {
  it('returns empty array for document with no input elements', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        { type: 'heading', level: 1, text: 'Title' },
        { type: 'text', content: 'Body copy' },
      ],
    };
    expect(extractFields(doc)).toEqual([]);
  });

  it('extracts a text input with required: true', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        { type: 'input', kind: 'text', id: 'name', label: 'Name', required: true },
      ],
    };
    const fields = extractFields(doc);
    expect(fields).toHaveLength(1);
    expect(fields[0]).toEqual({
      id: 'name',
      kind: 'text',
      label: 'Name',
      required: true,
      multiple: false,
    });
  });

  it('defaults required to false when omitted', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        { type: 'input', kind: 'text', id: 'email', label: 'Email' },
      ],
    };
    const [field] = extractFields(doc);
    expect(field?.required).toBe(false);
  });

  it('extracts a number input', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        { type: 'input', kind: 'number', id: 'age', label: 'Age', required: false },
      ],
    };
    const [field] = extractFields(doc);
    expect(field).toMatchObject({ id: 'age', kind: 'number', required: false, multiple: false });
  });

  it('extracts a date input', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        { type: 'input', kind: 'date', id: 'dob', label: 'DOB' },
      ],
    };
    const [field] = extractFields(doc);
    expect(field).toMatchObject({ id: 'dob', kind: 'date', multiple: false });
  });

  it('extracts a non-multiple choice input with multiple: false', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        {
          type: 'input', kind: 'choice', id: 'color', label: 'Color',
          options: [{ value: 'red', label: 'Red' }],
        },
      ],
    };
    const [field] = extractFields(doc);
    expect(field).toMatchObject({ kind: 'choice', multiple: false });
  });

  it('extracts a multiple choice input with multiple: true', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        {
          type: 'input', kind: 'choice', id: 'tags', label: 'Tags',
          multiple: true,
          options: [{ value: 'a', label: 'A' }],
        },
      ],
    };
    const [field] = extractFields(doc);
    expect(field).toMatchObject({ kind: 'choice', multiple: true });
  });

  it('defaults multiple to false when choice.multiple is omitted', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        {
          type: 'input', kind: 'choice', id: 'size', label: 'Size',
          options: [],
        },
      ],
    };
    const [field] = extractFields(doc);
    expect(field?.multiple).toBe(false);
  });

  it('recursively extracts inputs nested inside a container', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        {
          type: 'container',
          children: [
            { type: 'input', kind: 'text', id: 'first', label: 'First' },
            { type: 'input', kind: 'text', id: 'last', label: 'Last' },
          ],
        },
      ],
    };
    const fields = extractFields(doc);
    expect(fields.map((f) => f.id)).toEqual(['first', 'last']);
  });

  it('skips heading, text, and submit elements at any depth', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        { type: 'heading', level: 2, text: 'Section' },
        { type: 'text', content: 'Note' },
        { type: 'input', kind: 'text', id: 'kept', label: 'Kept' },
        { type: 'submit', id: 'sub', label: 'Send', route: '/api' },
      ],
    };
    const fields = extractFields(doc);
    expect(fields).toHaveLength(1);
    expect(fields[0]?.id).toBe('kept');
  });

  it('preserves document order across mixed elements and nested containers', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        { type: 'input', kind: 'text', id: 'a', label: 'A' },
        {
          type: 'container',
          children: [
            { type: 'input', kind: 'text', id: 'b', label: 'B' },
            { type: 'input', kind: 'date', id: 'c', label: 'C' },
          ],
        },
        { type: 'input', kind: 'number', id: 'd', label: 'D' },
      ],
    };
    expect(extractFields(doc).map((f) => f.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

// ── extractSubmit ─────────────────────────────────────────────────────────────

describe('extractSubmit', () => {
  it('returns undefined for a document with no submit element', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        { type: 'input', kind: 'text', id: 'name', label: 'Name' },
      ],
    };
    expect(extractSubmit(doc)).toBeUndefined();
  });

  it('returns the submit element at the top level', () => {
    const submitEl = { type: 'submit' as const, id: 'sub', label: 'Send', route: '/submit' };
    const doc: Document = { ...BASE_DOC, elements: [submitEl] };
    expect(extractSubmit(doc)).toEqual(submitEl);
  });

  it('finds a submit element nested inside a container', () => {
    const submitEl = { type: 'submit' as const, id: 'nested', label: 'Go', route: '/go' };
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        {
          type: 'container',
          children: [
            { type: 'input', kind: 'text', id: 'x', label: 'X' },
            submitEl,
          ],
        },
      ],
    };
    expect(extractSubmit(doc)).toEqual(submitEl);
  });

  it('returns undefined when container children have no submit element', () => {
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        {
          type: 'container',
          children: [
            { type: 'input', kind: 'text', id: 'x', label: 'X' },
          ],
        },
      ],
    };
    expect(extractSubmit(doc)).toBeUndefined();
  });

  it('returns the first submit element when multiple exist', () => {
    const first = { type: 'submit' as const, id: 'first', label: 'First', route: '/first' };
    const second = { type: 'submit' as const, id: 'second', label: 'Second', route: '/second' };
    const doc: Document = { ...BASE_DOC, elements: [first, second] };
    expect(extractSubmit(doc)).toEqual(first);
  });

  it('finds a submit element in a deeply nested container', () => {
    const submitEl = { type: 'submit' as const, id: 'deep', label: 'Deep', route: '/deep' };
    const doc: Document = {
      ...BASE_DOC,
      elements: [
        {
          type: 'container',
          children: [
            {
              type: 'container',
              children: [submitEl],
            },
          ],
        },
      ],
    };
    expect(extractSubmit(doc)).toEqual(submitEl);
  });
});
