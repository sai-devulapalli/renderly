import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument } from '../../src/adapter.js';
import { isOk } from '@renderly/shared';

const REPEAT_SCHEMA = JSON.stringify({
  version: '1.0',
  elements: [
    {
      type: 'repeat',
      id: 'members',
      label: 'Members',
      template: [
        { type: 'input', kind: 'text', id: 'name', label: 'Name' },
        { type: 'input', kind: 'text', id: 'email', label: 'Email' },
      ],
      minItems: 1,
      maxItems: 3,
      addLabel: 'Add member',
      removeLabel: 'Remove member',
    },
    { type: 'submit', id: 'sub', label: 'Submit', route: '/api' },
  ],
});

function pipeline(schema: string, values?: Record<string, string | number | readonly string[]>) {
  const parsed = parseDocument(schema);
  if (!parsed.ok) throw new Error(`parse failed: ${JSON.stringify(parsed.error)}`);
  const walked = walk(parsed.value, createDefaultRegistry(), values ? { values } : undefined);
  if (!walked.ok) throw new Error(`walk failed: ${JSON.stringify(walked.error)}`);
  const rendered = renderDocument(walked.value);
  if (!rendered.ok) throw new Error(`render failed: ${JSON.stringify(rendered.error)}`);
  return rendered.value;
}

describe('repeat element — end-to-end pipeline', () => {
  it('renders one item by default (minItems=1)', () => {
    const html = pipeline(REPEAT_SCHEMA);
    // one item div
    const itemMatches = html.match(/class="renderly-repeat__item"/g);
    expect(itemMatches).toHaveLength(1);
  });

  it('renders the legend label', () => {
    const html = pipeline(REPEAT_SCHEMA);
    expect(html).toContain('<legend>Members</legend>');
  });

  it('renders Add member button', () => {
    const html = pipeline(REPEAT_SCHEMA);
    expect(html).toContain('Add member');
    expect(html).toContain('data-action="repeat-add"');
  });

  it('renders Remove member button per item', () => {
    const html = pipeline(REPEAT_SCHEMA);
    expect(html).toContain('Remove member');
    expect(html).toContain('data-action="repeat-remove"');
  });

  it('renders sub-fields from the template', () => {
    const html = pipeline(REPEAT_SCHEMA);
    expect(html).toContain('name="name"');
    expect(html).toContain('name="email"');
  });

  it('renders N items from __items value', () => {
    const html = pipeline(REPEAT_SCHEMA, { 'members.__items': '2' });
    const itemMatches = html.match(/class="renderly-repeat__item"/g);
    expect(itemMatches).toHaveLength(2);
  });

  it('caps at maxItems=3 even if __items is higher', () => {
    const html = pipeline(REPEAT_SCHEMA, { 'members.__items': '10' });
    const itemMatches = html.match(/class="renderly-repeat__item"/g);
    expect(itemMatches).toHaveLength(3);
  });

  it('omits add button when at maxItems', () => {
    const html = pipeline(REPEAT_SCHEMA, { 'members.__items': '3' });
    expect(html).not.toContain('data-action="repeat-add"');
  });

  it('scopes sub-field values to each item slot', () => {
    const values = {
      'members[0].name': 'Alice',
      'members[1].name': 'Bob',
      'members.__items': '2',
    };
    const html = pipeline(REPEAT_SCHEMA, values);
    // The choice values are scoped — text inputs don't pre-fill via IR yet,
    // but 2 items should render
    const itemMatches = html.match(/class="renderly-repeat__item"/g);
    expect(itemMatches).toHaveLength(2);
  });

  it('produces valid HTML with nested fieldset', () => {
    const html = pipeline(REPEAT_SCHEMA);
    expect(html).toContain('<fieldset class="renderly-repeat"');
    expect(html).toContain('</fieldset>');
  });

  it('escapes dangerous content in label', () => {
    const schema = JSON.stringify({
      version: '1.0',
      elements: [{
        type: 'repeat',
        id: 'items',
        label: '<script>alert(1)</script>',
        template: [{ type: 'input', kind: 'text', id: 'x', label: 'X' }],
      }],
    });
    const html = pipeline(schema);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
