import { describe, it, expect } from 'vitest';
import { freezeSnapshot } from '../../src/freeze.js';
import type { IRNode, IRInputTextNode, IRInputChoiceNode, IRContainerNode, IRHeadingNode, IRSubmitNode } from '@renderly/schema';

function textInput(id: string, label: string, required = false): IRInputTextNode {
  return { type: 'input-text', id, label, placeholder: undefined, required, minLength: undefined, maxLength: undefined, errors: [], children: [] };
}

function choiceInput(id: string, label: string, options: { value: string; label: string }[]): IRInputChoiceNode {
  return { type: 'input-choice', id, label, required: false, multiple: false, options, errors: [], children: [] };
}

function heading(text: string): IRHeadingNode {
  return { type: 'heading', id: undefined, level: 1, text, size: 'xl', children: [] };
}

function submit(): IRSubmitNode {
  return { type: 'submit', id: 's', label: 'Submit', route: '/api', context: {}, children: [] };
}

// ── input → text replacement ──────────────────────────────────────────────────

describe('freezeSnapshot — input fields become text nodes', () => {
  it('replaces input-text with a text node showing label: value', () => {
    const nodes: IRNode[] = [textInput('name', 'Full Name')];
    const result = freezeSnapshot(nodes, { values: { name: 'Alice Smith' } });
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe('text');
    const t = result[0] as { content: string };
    expect(t.content).toBe('Full Name: Alice Smith');
  });

  it('uses emptyPlaceholder for fields with no submitted value', () => {
    const nodes: IRNode[] = [textInput('phone', 'Phone')];
    const result = freezeSnapshot(nodes, { values: {} });
    expect(result[0]?.type).toBe('text');
    const t = result[0] as { content: string };
    expect(t.content).toContain('—');
  });

  it('uses custom emptyPlaceholder', () => {
    const nodes: IRNode[] = [textInput('phone', 'Phone')];
    const result = freezeSnapshot(nodes, { values: {}, emptyPlaceholder: 'N/A' });
    const t = result[0] as { content: string };
    expect(t.content).toContain('N/A');
  });

  it('omits empty non-required fields when omitEmpty=true', () => {
    const nodes: IRNode[] = [textInput('phone', 'Phone', false)];
    const result = freezeSnapshot(nodes, { values: {}, omitEmpty: true });
    expect(result).toHaveLength(0);
  });

  it('keeps empty required fields even when omitEmpty=true', () => {
    const nodes: IRNode[] = [textInput('name', 'Name', true)];
    const result = freezeSnapshot(nodes, { values: {}, omitEmpty: true });
    expect(result).toHaveLength(1);
  });
});

// ── choice inputs ─────────────────────────────────────────────────────────────

describe('freezeSnapshot — choice fields', () => {
  const options = [{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }];

  it('resolves selected option value to label', () => {
    const nodes: IRNode[] = [choiceInput('gender', 'Gender', options)];
    const result = freezeSnapshot(nodes, { values: { gender: 'm' } });
    const t = result[0] as { content: string };
    expect(t.content).toBe('Gender: Male');
  });

  it('shows placeholder for unselected choice', () => {
    const nodes: IRNode[] = [choiceInput('gender', 'Gender', options)];
    const result = freezeSnapshot(nodes, { values: {} });
    const t = result[0] as { content: string };
    expect(t.content).toContain('—');
  });

  it('joins multiple selected values with commas', () => {
    const nodes: IRNode[] = [{ ...choiceInput('tags', 'Tags', [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ]), multiple: true }];
    const result = freezeSnapshot(nodes, { values: { tags: ['a', 'b'] as unknown as string } });
    const t = result[0] as { content: string };
    expect(t.content).toContain('Alpha, Beta');
  });
});

// ── pass-through nodes ────────────────────────────────────────────────────────

describe('freezeSnapshot — pass-through nodes', () => {
  it('preserves heading nodes unchanged', () => {
    const nodes: IRNode[] = [heading('Patient Info')];
    const result = freezeSnapshot(nodes, { values: {} });
    expect(result[0]?.type).toBe('heading');
    expect((result[0] as IRHeadingNode).text).toBe('Patient Info');
  });

  it('removes submit buttons', () => {
    const nodes: IRNode[] = [heading('Form'), submit()];
    const result = freezeSnapshot(nodes, { values: {} });
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe('heading');
  });
});

// ── container recursion ───────────────────────────────────────────────────────

describe('freezeSnapshot — container recursion', () => {
  it('recurses into container children', () => {
    const container: IRContainerNode = {
      type: 'container', id: 'sec', direction: 'column', gap: 'md', cols: undefined,
      children: [textInput('email', 'Email')],
    };
    const result = freezeSnapshot([container], { values: { email: 'a@b.com' } });
    expect(result[0]?.type).toBe('container');
    const c = result[0] as IRContainerNode;
    expect(c.children[0]?.type).toBe('text');
  });

  it('removes empty container when all children are omitted', () => {
    const container: IRContainerNode = {
      type: 'container', id: undefined, direction: 'column', gap: 'md', cols: undefined,
      children: [textInput('opt', 'Optional', false)],
    };
    const result = freezeSnapshot([container], { values: {}, omitEmpty: true });
    expect(result).toHaveLength(0);
  });
});
