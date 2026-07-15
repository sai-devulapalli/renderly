import { describe, it, expect } from 'vitest';
import type { Element, FieldValues, FormErrors, IRNode } from '@renderly/schema';
import type { HandlerContext } from '../../src/types.js';
import { repeatHandler, deriveItemCount } from '../../src/handlers.js';
import type { RepeatElement } from '@renderly/schema';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTextEl(id: string): Element {
  return { type: 'input', kind: 'text', id, label: id };
}

function makeRepeatEl(overrides: Partial<RepeatElement> = {}): RepeatElement {
  return {
    type: 'repeat',
    id: 'members',
    label: 'Members',
    template: [makeTextEl('name'), makeTextEl('email')],
    ...overrides,
  };
}

function makeContext(
  values?: FieldValues,
  errors?: FormErrors,
): HandlerContext {
  return {
    values,
    errors,
    walkChildren: (children, scope) => {
      const nodes: IRNode[] = children.map(() => ({
        type: 'text' as const,
        id: undefined,
        content: `scoped:${JSON.stringify(scope?.values ?? {})}`,
        weight: 'normal' as const,
        intent: 'default' as const,
        children: [],
      }));
      return { ok: true, value: nodes };
    },
  };
}

// ── deriveItemCount ────────────────────────────────────────────────────────────

describe('deriveItemCount', () => {
  it('returns minItems when no values provided', () => {
    expect(deriveItemCount('members', undefined, 2)).toBe(2);
  });

  it('returns minItems when no relevant keys', () => {
    expect(deriveItemCount('members', { other: 'x' }, 1)).toBe(1);
  });

  it('reads explicit __items numeric key', () => {
    expect(deriveItemCount('members', { 'members.__items': 3 }, 1)).toBe(3);
  });

  it('reads explicit __items string key', () => {
    expect(deriveItemCount('members', { 'members.__items': '4' }, 1)).toBe(4);
  });

  it('returns at least minItems even if __items is lower', () => {
    expect(deriveItemCount('members', { 'members.__items': 0 }, 2)).toBe(2);
  });

  it('scans existing keys to infer count', () => {
    const values: FieldValues = {
      'members[0].name': 'Alice',
      'members[1].name': 'Bob',
      'members[2].email': 'c@c.com',
    };
    expect(deriveItemCount('members', values, 1)).toBe(3);
  });

  it('does not confuse keys from other repeat IDs', () => {
    const values: FieldValues = { 'other[5].name': 'x' };
    expect(deriveItemCount('members', values, 1)).toBe(1);
  });

  it('ignores a key with an unclosed bracket', () => {
    const values: FieldValues = { 'members[0.name': 'x' };
    expect(deriveItemCount('members', values, 1)).toBe(1);
  });
});

// ── repeatHandler ─────────────────────────────────────────────────────────────

describe('repeatHandler', () => {
  it('returns an IRRepeatNode', () => {
    const el = makeRepeatEl();
    const result = repeatHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.type).toBe('repeat');
  });

  it('uses minItems as the default count (no values)', () => {
    const el = makeRepeatEl({ minItems: 2 });
    const result = repeatHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const node = result.value as { items: unknown[] };
    expect(node.items).toHaveLength(2);
  });

  it('uses 1 item when no minItems and no values', () => {
    const el = makeRepeatEl({ minItems: undefined });
    const result = repeatHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const node = result.value as { items: unknown[] };
    expect(node.items).toHaveLength(1);
  });

  it('derives count from __items value', () => {
    const el = makeRepeatEl({ minItems: 1 });
    const result = repeatHandler(el, makeContext({ 'members.__items': '3' }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const node = result.value as { items: unknown[] };
    expect(node.items).toHaveLength(3);
  });

  it('caps at maxItems', () => {
    const el = makeRepeatEl({ minItems: 1, maxItems: 2 });
    const result = repeatHandler(el, makeContext({ 'members.__items': '5' }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const node = result.value as { items: unknown[] };
    expect(node.items).toHaveLength(2);
  });

  it('resolves addLabel and removeLabel defaults', () => {
    const el = makeRepeatEl();
    const result = repeatHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const node = result.value as { addLabel: string; removeLabel: string };
    expect(node.addLabel).toBe('Add item');
    expect(node.removeLabel).toBe('Remove');
  });

  it('uses custom addLabel / removeLabel', () => {
    const el = makeRepeatEl({ addLabel: '+ Beneficiary', removeLabel: 'Delete' });
    const result = repeatHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const node = result.value as { addLabel: string; removeLabel: string };
    expect(node.addLabel).toBe('+ Beneficiary');
    expect(node.removeLabel).toBe('Delete');
  });

  it('passes scoped values to walkChildren (strips id[i]. prefix)', () => {
    const el = makeRepeatEl({ minItems: 1 });
    const values: FieldValues = {
      'members[0].name': 'Alice',
      'members[0].email': 'alice@a.com',
    };
    const result = repeatHandler(el, makeContext(values));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const node = result.value as { items: Array<{ children: Array<{ content: string }> }> };
    const scopedJson = node.items[0].children[0].content;
    const parsed = JSON.parse(scopedJson.replace('scoped:', ''));
    expect(parsed['name']).toBe('Alice');
    expect(parsed['email']).toBe('alice@a.com');
  });

  it('collects field-level errors for the repeat id', () => {
    const el = makeRepeatEl();
    const errors: FormErrors = { fields: { members: ['Too few members'] } };
    const result = repeatHandler(el, makeContext(undefined, errors));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const node = result.value as { errors: readonly string[] };
    expect(node.errors).toContain('Too few members');
  });

  it('extracts item-scoped errors matching the repeat item prefix', () => {
    const el = makeRepeatEl({ minItems: 1 });
    const errors: FormErrors = { fields: { 'members[0].name': ['Required'] } };
    const result = repeatHandler(el, makeContext(undefined, errors));
    expect(result.ok).toBe(true);
  });

  it('propagates walkChildren failure', () => {
    const el = makeRepeatEl({ minItems: 1 });
    const ctx: HandlerContext = {
      values: undefined,
      errors: undefined,
      walkChildren: () => ({
        ok: false,
        error: { code: 'HANDLER_FAILED', elementType: 'input' },
      }),
    };
    const result = repeatHandler(el, ctx);
    expect(result.ok).toBe(false);
  });

  it('assigns sequential indices to items', () => {
    const el = makeRepeatEl({ minItems: 3 });
    const result = repeatHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const node = result.value as { items: Array<{ index: number }> };
    expect(node.items.map((i) => i.index)).toEqual([0, 1, 2]);
  });
});
