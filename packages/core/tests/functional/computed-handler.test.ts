import { describe, it, expect } from 'vitest';
import { walk, createDefaultRegistry } from '../../src/index.js';
import type { Document } from '@renderly/schema';

// ── computed element integration ──────────────────────────────────────────────

describe('computed element via walk', () => {
  const doc: Document = {
    version: '1',
    elements: [
      { type: 'input', kind: 'number', id: 'price', label: 'Unit Price' },
      { type: 'input', kind: 'number', id: 'qty', label: 'Quantity' },
      { type: 'computed', id: 'total', label: 'Total', expr: 'price * qty', format: 'currency' },
    ],
  };

  it('emits an IRTextNode for a computed element', () => {
    const r = walk(doc, createDefaultRegistry(), { values: { price: 10, qty: 3 } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const computed = r.value.find((n) => 'id' in n && n.id === 'total');
    expect(computed).toBeDefined();
    expect(computed?.type).toBe('text');
  });

  it('shows evaluated value when fields are present', () => {
    const r = walk(doc, createDefaultRegistry(), { values: { price: 10, qty: 3 } });
    if (!r.ok) return;
    const node = r.value.find((n) => 'id' in n && n.id === 'total') as { content: string } | undefined;
    expect(node?.content).toBe('Total: $30.00');
  });

  it('shows "—" placeholder when fields are missing', () => {
    const r = walk(doc, createDefaultRegistry(), { values: {} });
    if (!r.ok) return;
    const node = r.value.find((n) => 'id' in n && n.id === 'total') as { content: string } | undefined;
    expect(node?.content).toBe('Total: —');
  });

  it('shows "—" placeholder when no values context provided', () => {
    const r = walk(doc, createDefaultRegistry());
    if (!r.ok) return;
    const node = r.value.find((n) => 'id' in n && n.id === 'total') as { content: string } | undefined;
    expect(node?.content).toBe('Total: —');
  });

  it('formats number type correctly', () => {
    const numDoc: Document = {
      version: '1',
      elements: [
        { type: 'computed', id: 'c', label: 'Count', expr: '5 + 7', format: 'number' },
      ],
    };
    const r = walk(numDoc, createDefaultRegistry(), { values: {} });
    if (!r.ok) return;
    const node = r.value.find((n) => 'id' in n && n.id === 'c') as { content: string } | undefined;
    expect(node?.content).toBe('Count: 12');
  });

  it('formats percent type correctly', () => {
    const pctDoc: Document = {
      version: '1',
      elements: [
        { type: 'computed', id: 'p', label: 'Rate', expr: 'score / total', format: 'percent' },
      ],
    };
    const r = walk(pctDoc, createDefaultRegistry(), { values: { score: 0.75, total: 1 } });
    if (!r.ok) return;
    const node = r.value.find((n) => 'id' in n && n.id === 'p') as { content: string } | undefined;
    expect(node?.content).toBe('Rate: 75.0%');
  });

  it('applies conditional rules — hide when condition matches', () => {
    const docWithRules: Document = {
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'mode', label: 'Mode' },
        {
          type: 'computed', id: 'calc', label: 'Calc', expr: '1 + 1',
          rules: [{ action: 'hide', when: { field: 'mode', op: 'eq', value: 'off' } }],
        },
      ],
    };
    const hidden = walk(docWithRules, createDefaultRegistry(), { values: { mode: 'off' } });
    if (!hidden.ok) return;
    expect(hidden.value.every((n) => !('id' in n) || n.id !== 'calc')).toBe(true);

    const shown = walk(docWithRules, createDefaultRegistry(), { values: { mode: 'on' } });
    if (!shown.ok) return;
    expect(shown.value.some((n) => 'id' in n && n.id === 'calc')).toBe(true);
  });
});
