import { describe, it, expect } from 'vitest';
import { lintDocument } from '../../src/lint.js';
import { extractFields } from '../../src/fields.js';
import type { Document } from '@renderly/schema';

// ── lintDocument ──────────────────────────────────────────────────────────────

describe('lintDocument — no issues', () => {
  it('returns empty array for a clean document', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'name', label: 'Name' },
        { type: 'input', kind: 'text', id: 'email', label: 'Email',
          rules: [{ action: 'hide', when: { field: 'name', op: 'eq', value: 'Skip' } }],
        },
      ],
    };
    expect(lintDocument(doc)).toHaveLength(0);
  });
});

describe('lintDocument — DEAD_RULE', () => {
  it('detects a rule referencing a nonexistent field', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'email', label: 'Email',
          rules: [{ action: 'hide', when: { field: 'ghost_field', op: 'eq', value: 'x' } }],
        },
      ],
    };
    const issues = lintDocument(doc);
    expect(issues.some((i) => i.code === 'DEAD_RULE')).toBe(true);
    const deadRule = issues.find((i) => i.code === 'DEAD_RULE')!;
    expect(deadRule.severity).toBe('warning');
    expect(deadRule.message).toContain('ghost_field');
  });

  it('detects dead rule in a nested container', () => {
    const doc: Document = {
      version: '1',
      elements: [
        {
          type: 'container',
          children: [
            { type: 'input', kind: 'text', id: 'note', label: 'Note',
              rules: [{ action: 'show', when: { field: 'missing', op: 'neq', value: '0' } }],
            },
          ],
        },
      ],
    };
    const issues = lintDocument(doc);
    expect(issues.some((i) => i.code === 'DEAD_RULE')).toBe(true);
  });
});

describe('lintDocument — DUPLICATE_FIELD_ID', () => {
  it('detects duplicate IDs at the top level', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'name', label: 'Name' },
        { type: 'input', kind: 'text', id: 'name', label: 'Name Again' },
      ],
    };
    const issues = lintDocument(doc);
    expect(issues.some((i) => i.code === 'DUPLICATE_FIELD_ID')).toBe(true);
    const dupe = issues.find((i) => i.code === 'DUPLICATE_FIELD_ID')!;
    expect(dupe.severity).toBe('error');
    expect(dupe.elementId).toBe('name');
  });

  it('detects duplicate IDs across container and top-level', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'field1', label: 'Field 1' },
        {
          type: 'container',
          children: [{ type: 'input', kind: 'text', id: 'field1', label: 'Also Field 1' }],
        },
      ],
    };
    const issues = lintDocument(doc);
    expect(issues.some((i) => i.code === 'DUPLICATE_FIELD_ID')).toBe(true);
  });

  it('returns no duplicate when IDs are unique', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'a', label: 'A' },
        { type: 'input', kind: 'text', id: 'b', label: 'B' },
      ],
    };
    expect(lintDocument(doc).some((i) => i.code === 'DUPLICATE_FIELD_ID')).toBe(false);
  });
});

// ── extractFields ─────────────────────────────────────────────────────────────

describe('extractFields', () => {
  it('lists top-level input fields with correct metadata', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'first', label: 'First Name', required: true },
        { type: 'input', kind: 'number', id: 'age', label: 'Age' },
      ],
    };
    const fields = extractFields(doc);
    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({ id: 'first', kind: 'text', label: 'First Name', required: true });
    expect(fields[1]).toMatchObject({ id: 'age', kind: 'number', label: 'Age', required: false });
  });

  it('recurses into containers', () => {
    const doc: Document = {
      version: '1',
      elements: [
        {
          type: 'container',
          children: [{ type: 'input', kind: 'date', id: 'dob', label: 'Date of Birth' }],
        },
      ],
    };
    const fields = extractFields(doc);
    expect(fields).toHaveLength(1);
    expect(fields[0]?.id).toBe('dob');
  });

  it('returns empty array for document with no input fields', () => {
    const doc: Document = {
      version: '1',
      elements: [{ type: 'heading', level: 1, text: 'Welcome' }],
    };
    expect(extractFields(doc)).toHaveLength(0);
  });
});
