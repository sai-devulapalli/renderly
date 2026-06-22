import { describe, it, expect } from 'vitest';
import { freezeSnapshot } from '../../src/freeze.js';
import type { IRNode, IRInputTextNode, IRInputChoiceNode, IRInputFileNode, IRSignatureNode, IRRepeatNode, IRRepeatItemNode, IRCustomNode, IRContainerNode, IRHeadingNode, IRSubmitNode } from '@renderly/schema';

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

function fileInput(id: string, label: string, required = false): IRInputFileNode {
  return { type: 'input-file', id, label, accept: undefined, multiple: false, required, errors: [], children: [] };
}

function signature(id: string, label: string, required = false): IRSignatureNode {
  return { type: 'signature', id, label, required, errors: [], children: [] };
}

function custom(id: string, kind: string, label?: string): IRCustomNode {
  return { type: 'custom', id, kind, label, props: {}, errors: [], children: [] };
}

function repeatNode(id: string, label: string, items: IRRepeatItemNode[]): IRRepeatNode {
  return { type: 'repeat', id, label, minItems: 1, maxItems: undefined, addLabel: 'Add', removeLabel: 'Remove', items, errors: [], children: [] };
}

function repeatItem(index: number, children: IRNode[]): IRRepeatItemNode {
  return { type: 'repeat-item', index, children };
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

// ── input-file ────────────────────────────────────────────────────────────────

describe('freezeSnapshot — input-file fields', () => {
  it('converts input-file to a text node showing the filename', () => {
    const nodes: IRNode[] = [fileInput('photo', 'Photo')];
    const result = freezeSnapshot(nodes, { values: { photo: 'headshot.jpg' } });
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe('text');
    expect((result[0] as { content: string }).content).toBe('Photo: headshot.jpg');
  });

  it('shows placeholder for file input with no value', () => {
    const nodes: IRNode[] = [fileInput('photo', 'Photo')];
    const result = freezeSnapshot(nodes, { values: {} });
    expect((result[0] as { content: string }).content).toContain('—');
  });

  it('omits empty non-required file input when omitEmpty=true', () => {
    const nodes: IRNode[] = [fileInput('photo', 'Photo', false)];
    const result = freezeSnapshot(nodes, { values: {}, omitEmpty: true });
    expect(result).toHaveLength(0);
  });

  it('keeps empty required file input when omitEmpty=true', () => {
    const nodes: IRNode[] = [fileInput('resume', 'Resume', true)];
    const result = freezeSnapshot(nodes, { values: {}, omitEmpty: true });
    expect(result).toHaveLength(1);
  });
});

// ── signature ─────────────────────────────────────────────────────────────────

describe('freezeSnapshot — signature fields', () => {
  it('shows "Signed" when a signature value is present', () => {
    const nodes: IRNode[] = [signature('sig', 'Signature')];
    const result = freezeSnapshot(nodes, { values: { sig: 'data:image/png;base64,abc' } });
    expect(result).toHaveLength(1);
    expect((result[0] as { content: string }).content).toBe('Signature: Signed');
  });

  it('shows placeholder when signature is absent', () => {
    const nodes: IRNode[] = [signature('sig', 'Signature')];
    const result = freezeSnapshot(nodes, { values: {} });
    expect((result[0] as { content: string }).content).toContain('—');
  });

  it('omits empty non-required signature when omitEmpty=true', () => {
    const nodes: IRNode[] = [signature('sig', 'Signature', false)];
    const result = freezeSnapshot(nodes, { values: {}, omitEmpty: true });
    expect(result).toHaveLength(0);
  });

  it('keeps empty required signature when omitEmpty=true', () => {
    const nodes: IRNode[] = [signature('sig', 'Signature', true)];
    const result = freezeSnapshot(nodes, { values: {}, omitEmpty: true });
    expect(result).toHaveLength(1);
  });
});

// ── repeat ────────────────────────────────────────────────────────────────────

describe('freezeSnapshot — repeat fields', () => {
  // Children of repeat items have UNSCOPED IDs (walker strips the prefix).
  // Values in opts use the flat-keyed form; freeze extracts scoped values per item.

  it('emits a label text node and frozen children per item', () => {
    const item0 = repeatItem(0, [textInput('name', 'Name')]);
    const nodes: IRNode[] = [repeatNode('contacts', 'Contacts', [item0])];
    const result = freezeSnapshot(nodes, { values: { 'contacts[0].name': 'Alice' } });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect((result[0] as { content: string }).content).toContain('Item 1');
    expect((result[1] as { content: string }).content).toBe('Name: Alice');
  });

  it('produces one label + children group per item', () => {
    const item0 = repeatItem(0, [textInput('val', 'Value')]);
    const item1 = repeatItem(1, [textInput('val', 'Value')]);
    const nodes: IRNode[] = [repeatNode('tags', 'Tags', [item0, item1])];
    const result = freezeSnapshot(nodes, {
      values: { 'tags[0].val': 'A', 'tags[1].val': 'B' },
    });
    expect(result).toHaveLength(4); // label + field for each of 2 items
  });

  it('omits items whose frozen children are all empty under omitEmpty=true', () => {
    const item0 = repeatItem(0, [textInput('val', 'Value', false)]);
    const nodes: IRNode[] = [repeatNode('tags', 'Tags', [item0])];
    const result = freezeSnapshot(nodes, { values: {}, omitEmpty: true });
    expect(result).toHaveLength(0);
  });

  it('outputs nothing when repeat has no items', () => {
    const nodes: IRNode[] = [repeatNode('items', 'Items', [])];
    const result = freezeSnapshot(nodes, { values: {} });
    expect(result).toHaveLength(0);
  });
});

// ── custom pass-through ───────────────────────────────────────────────────────

describe('freezeSnapshot — custom nodes', () => {
  it('passes custom nodes through unchanged', () => {
    const nodes: IRNode[] = [custom('rating', 'stars', 'Rating')];
    const result = freezeSnapshot(nodes, { values: {} });
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe('custom');
  });
});
