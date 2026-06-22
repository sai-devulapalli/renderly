import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { freezeSnapshot } from '../../src/freeze.js';
import { renderDocument as renderMarkdown } from '@renderly/markdown';

const SCHEMA = JSON.stringify({
  version: '1',
  elements: [
    { type: 'heading', level: 1, text: 'Registration Review' },
    { type: 'input', kind: 'text', id: 'name', label: 'Full Name', required: true },
    { type: 'input', kind: 'text', id: 'phone', label: 'Phone' },
    { type: 'input', kind: 'choice', id: 'plan', label: 'Plan',
      options: [{ value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }],
    },
    { type: 'submit', id: 's', label: 'Submit', route: '/api' },
  ],
});

describe('@renderly/snapshot full pipeline', () => {
  it('freezes walked IR and removes submit nodes', () => {
    const parsed = parseDocument(SCHEMA);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const walked = walk(parsed.value, createDefaultRegistry());
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, {
      values: { name: 'Alice Smith', plan: 'pro' },
    });

    expect(frozen.every((n) => n.type !== 'submit')).toBe(true);
    const names = frozen.filter((n) => 'id' in n && n.id === 'name');
    expect(names).toHaveLength(1);
    expect((names[0] as { content: string }).content).toBe('Full Name: Alice Smith');

    const plans = frozen.filter((n) => 'id' in n && n.id === 'plan');
    expect((plans[0] as { content: string }).content).toBe('Plan: Pro');
  });

  it('pipe frozen snapshot through markdown adapter', () => {
    const parsed = parseDocument(SCHEMA);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry());
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, {
      values: { name: 'Bob Jones', phone: '555-1234', plan: 'basic' },
    });

    const rendered = renderMarkdown(frozen);
    expect(rendered.ok).toBe(true);
    if (!rendered.ok) return;

    const md = rendered.value;
    expect(md).toContain('Full Name: Bob Jones');
    expect(md).toContain('Phone: 555');
    expect(md).toContain('Plan: Basic');
    expect(md).not.toContain('Submit');
    expect(md).not.toContain('---');
  });

  it('omitEmpty removes empty optional fields from snapshot', () => {
    const parsed = parseDocument(SCHEMA);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry());
    if (!walked.ok) return;

    const frozen = freezeSnapshot(walked.value, {
      values: { name: 'Charlie' },
      omitEmpty: true,
    });

    const phoneNodes = frozen.filter((n) => 'id' in n && n.id === 'phone');
    expect(phoneNodes).toHaveLength(0);

    const nameNodes = frozen.filter((n) => 'id' in n && n.id === 'name');
    expect(nameNodes).toHaveLength(1);
  });
});
