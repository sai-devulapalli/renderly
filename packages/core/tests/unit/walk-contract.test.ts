import { describe, it, expect } from 'vitest';
import type { Document, IRNode } from '@renderly/schema';
import { isOk } from '@renderly/shared';
import { walk, createDefaultRegistry } from '../../src/index.js';

const registry = createDefaultRegistry();

// ── text-unescaped invariant ──────────────────────────────────────────────────
// Contract: walk() MUST NOT escape text. Escaping is the output adapter's job.
// Breach = HTML adapter double-escapes; React adapter would encode already-escaped entities.

describe('walk — text-unescaped invariant', () => {
  it('heading text is raw in the IR — no HTML entities', () => {
    const doc: Document = {
      version: '1',
      elements: [{ type: 'heading', level: 1, text: '<script>alert(1)</script>' }],
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const heading = result.value[0] as { text: string };
    expect(heading.text).toBe('<script>alert(1)</script>');
    expect(heading.text).not.toContain('&lt;');
  });

  it('text node content is raw in the IR', () => {
    const doc: Document = {
      version: '1',
      elements: [{ type: 'text', content: '"><img src=x onerror=alert(1)>' }],
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const node = result.value[0] as { content: string };
    expect(node.content).toBe('"><img src=x onerror=alert(1)>');
    expect(node.content).not.toContain('&quot;');
    expect(node.content).not.toContain('&lt;');
  });

  it('input label is raw in the IR', () => {
    const doc: Document = {
      version: '1',
      elements: [{ type: 'input', kind: 'text', id: 'f', label: 'Bad "label" & <tag>' }],
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const input = result.value[0] as { label: string };
    expect(input.label).toBe('Bad "label" & <tag>');
    expect(input.label).not.toContain('&amp;');
  });

  it('no IRNode field contains HTML entities for a doc with XSS in every text field', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'heading', level: 2, text: '& < > " \' `' },
        { type: 'text', content: '& < > " \' `' },
        { type: 'input', kind: 'text', id: 'x', label: '& < > " \' `' },
        { type: 'submit', id: 's', label: '& < > " \' `', route: '/api' },
      ],
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const serialised = JSON.stringify(result.value);
    expect(serialised).not.toContain('&amp;');
    expect(serialised).not.toContain('&lt;');
    expect(serialised).not.toContain('&gt;');
    expect(serialised).not.toContain('&quot;');
    expect(serialised).not.toContain('&#x27;');
    expect(serialised).not.toContain('&#x60;');
  });
});

// ── deep nesting ──────────────────────────────────────────────────────────────

describe('walk — deep nesting', () => {
  it('walks 5 levels of nested containers and reaches the leaf', () => {
    const doc: Document = {
      version: '1',
      elements: [{
        type: 'container',
        children: [{
          type: 'container',
          children: [{
            type: 'container',
            children: [{
              type: 'container',
              children: [{
                type: 'container',
                children: [{ type: 'text', content: 'deep leaf' }],
              }],
            }],
          }],
        }],
      }],
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    let node: IRNode = result.value[0]!;
    for (let depth = 0; depth < 5; depth++) {
      expect(node.type).toBe('container');
      node = node.children[0]!;
    }
    expect(node.type).toBe('text');
    expect((node as { content: string }).content).toBe('deep leaf');
  });

  it('walks mixed deep nesting: containers with sibling elements at each level', () => {
    const doc: Document = {
      version: '1',
      elements: [{
        type: 'container',
        children: [
          { type: 'heading', level: 2, text: 'L1' },
          {
            type: 'container',
            children: [
              { type: 'text', content: 'L2' },
              {
                type: 'container',
                children: [
                  { type: 'input', kind: 'text', id: 'deep', label: 'Deep Field' },
                ],
              },
            ],
          },
        ],
      }],
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value[0]?.type).toBe('container');
    expect(result.value[0]?.children).toHaveLength(2);
  });
});

// ── unknown fieldId in errors ─────────────────────────────────────────────────
// Server returns errors for a field that was removed from the document schema.
// Walk must succeed — unknown fieldIds are silently dropped from IR.

describe('walk — unknown fieldId in errors', () => {
  it('succeeds when errors reference a fieldId not present in any element', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'known', label: 'Known' },
      ],
      errors: {
        fields: {
          known: ['Required'],
          ghost_field: ['Error for a field that does not exist'],
          another_ghost: ['Another orphaned error'],
        },
      },
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    // The known field gets its errors
    const inputNode = result.value[0] as { errors: readonly string[] };
    expect(inputNode.errors).toEqual(['Required']);
    // Walk succeeds without creating orphaned error nodes for unknown fields
    expect(result.value).toHaveLength(1);
  });

  it('walk succeeds with errors only for unknown fields (no known field errors)', () => {
    const doc: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'name', label: 'Name' },
      ],
      errors: {
        fields: {
          completely_unknown: ['This field was removed from the form'],
        },
      },
    };
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    // Known field has no errors (orphaned errors don't bleed over)
    const inputNode = result.value[0] as { errors: readonly string[] };
    expect(inputNode.errors).toEqual([]);
  });
});
