import { describe, it, expect } from 'vitest';
import { ok, err, isOk } from '@renderly/shared';
import type { RenderChildrenFn } from '../../src/types.js';
import type { HtmlError } from '../../src/errors.js';
import { renderRepeat } from '../../src/renderers.js';
import type { IRRepeatNode, IRRepeatItemNode } from '@renderly/schema';

function makeItem(index: number): IRRepeatItemNode {
  return { type: 'repeat-item', index, children: [] };
}

function makeRepeat(overrides: Partial<IRRepeatNode> = {}): IRRepeatNode {
  return {
    type: 'repeat',
    id: 'members',
    label: 'Members',
    minItems: 1,
    maxItems: undefined,
    addLabel: 'Add item',
    removeLabel: 'Remove',
    items: [makeItem(0)],
    errors: [],
    children: [],
    ...overrides,
  };
}

const noopChildren: RenderChildrenFn = () => ok('');
const fieldChildren: RenderChildrenFn = () => ok('<input name="name" />');
const failChildren: RenderChildrenFn = () => err<HtmlError>({ code: 'RENDER_ERROR', nodeType: 'test' });

describe('renderRepeat', () => {
  it('wraps in a fieldset with class renderly-repeat', () => {
    const result = renderRepeat(makeRepeat(), noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('class="renderly-repeat"');
    expect(result.value).toContain('fieldset');
  });

  it('renders the legend with the label', () => {
    const result = renderRepeat(makeRepeat({ label: 'Beneficiaries' }), noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('<legend>Beneficiaries</legend>');
  });

  it('escapes the label', () => {
    const result = renderRepeat(makeRepeat({ label: '<script>x</script>' }), noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('&lt;script&gt;');
  });

  it('renders an add button with data-action=repeat-add', () => {
    const result = renderRepeat(makeRepeat(), noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('data-action="repeat-add"');
    expect(result.value).toContain(`data-target="members"`);
    expect(result.value).toContain('Add item');
  });

  it('omits add button when at maxItems', () => {
    const node = makeRepeat({ maxItems: 1, items: [makeItem(0)] });
    const result = renderRepeat(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toContain('repeat-add');
  });

  it('renders a remove button per item', () => {
    const node = makeRepeat({ items: [makeItem(0), makeItem(1)] });
    const result = renderRepeat(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    const matches = result.value.match(/data-action="repeat-remove"/g);
    expect(matches).toHaveLength(2);
  });

  it('remove button carries correct data-index', () => {
    const node = makeRepeat({ items: [makeItem(0), makeItem(1)] });
    const result = renderRepeat(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('data-index="0"');
    expect(result.value).toContain('data-index="1"');
  });

  it('renders item children via renderChildren', () => {
    const result = renderRepeat(makeRepeat(), fieldChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('<input name="name" />');
  });

  it('renders field-level errors', () => {
    const node = makeRepeat({ errors: ['At least one member required'] });
    const result = renderRepeat(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('At least one member required');
    expect(result.value).toContain('field-error');
  });

  it('sets data-min and data-max attributes', () => {
    const node = makeRepeat({ minItems: 2, maxItems: 5 });
    const result = renderRepeat(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain('data-min="2"');
    expect(result.value).toContain('data-max="5"');
  });

  it('omits data-max when maxItems is undefined', () => {
    const node = makeRepeat({ maxItems: undefined });
    const result = renderRepeat(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toContain('data-max');
  });

  it('propagates renderChildren failure', () => {
    const result = renderRepeat(makeRepeat(), failChildren);
    expect(result.ok).toBe(false);
  });

  it('escapes repeat id in data-target attributes', () => {
    const node = makeRepeat({ id: '"evil"' });
    const result = renderRepeat(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toContain('data-target=""evil""');
    expect(result.value).toContain('&quot;evil&quot;');
  });
});
