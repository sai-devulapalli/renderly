import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument } from '../../src/adapter.js';

const SCHEMA = JSON.stringify({
  version: '1',
  elements: [
    { type: 'heading', level: 1, text: 'Patient Registration' },
    { type: 'input', kind: 'text', id: 'first_name', label: 'First Name', required: true },
    { type: 'input', kind: 'text', id: 'last_name', label: 'Last Name', required: true },
    { type: 'input', kind: 'choice', id: 'gender', label: 'Gender',
      options: [{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }],
    },
    { type: 'submit', id: 's', label: 'Register', route: '/api/register' },
  ],
});

describe('@renderly/markdown full pipeline', () => {
  it('parse → walk → render produces valid Markdown', () => {
    const parsed = parseDocument(SCHEMA);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const walked = walk(parsed.value, createDefaultRegistry());
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const rendered = renderDocument(walked.value);
    expect(rendered.ok).toBe(true);
    if (!rendered.ok) return;

    const md = rendered.value;
    expect(md).toContain('# Patient Registration');
    expect(md).toContain('**First Name**');
    expect(md).toContain('*(required)*');
    expect(md).toContain('**Last Name**');
    expect(md).toContain('- Male');
    expect(md).toContain('- Female');
    expect(md).toContain('→ **[Register](/api/register)**');
    expect(md).toContain('---');
  });

  it('escapes Markdown special characters in text values', () => {
    const doc = JSON.stringify({
      version: '1',
      elements: [
        { type: 'heading', level: 2, text: 'Section **A** [link]' },
        { type: 'text', content: 'Use `code` here.' },
      ],
    });
    const parsed = parseDocument(doc);
    if (!parsed.ok) return;
    const walked = walk(parsed.value, createDefaultRegistry());
    if (!walked.ok) return;
    const rendered = renderDocument(walked.value);
    if (!rendered.ok) return;

    expect(rendered.value).not.toContain('**A**');
    expect(rendered.value).toContain('\\*\\*A\\*\\*');
    expect(rendered.value).toContain('\\`code\\`');
  });

  it('renders form errors and field errors', () => {
    const parsed = parseDocument(SCHEMA);
    if (!parsed.ok) return;
    const docWithErrors = {
      ...parsed.value,
      errors: {
        form: ['Submission failed'],
        fields: { first_name: ['This field is required'] },
      },
    };
    const walked = walk(docWithErrors, createDefaultRegistry());
    if (!walked.ok) return;
    const rendered = renderDocument(walked.value);
    if (!rendered.ok) return;

    expect(rendered.value).toContain('> ⚠ **Form error:** Submission failed');
    expect(rendered.value).toContain('> ⚠ This field is required');
  });
});
