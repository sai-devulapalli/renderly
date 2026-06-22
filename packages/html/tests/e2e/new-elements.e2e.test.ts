import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import type { FieldValues } from '@renderly/schema';
import { renderDocument } from '../../src/adapter.js';
import { isOk } from '@renderly/shared';

// ── pipeline helper ───────────────────────────────────────────────────────────

function render(json: string, values?: FieldValues): string {
  const docResult = parseDocument(json);
  if (!isOk(docResult)) throw new Error(`parse failed: ${JSON.stringify(docResult)}`);
  const walkResult = walk(docResult.value, createDefaultRegistry(), { values });
  if (!isOk(walkResult)) throw new Error(`walk failed: ${JSON.stringify(walkResult)}`);
  const htmlResult = renderDocument(walkResult.value);
  if (!isOk(htmlResult)) throw new Error(`render failed: ${JSON.stringify(htmlResult)}`);
  return htmlResult.value;
}

// ── 1. File input ─────────────────────────────────────────────────────────────

const FILE_INPUT_JSON = JSON.stringify({
  version: '1',
  elements: [
    { type: 'input', kind: 'file', id: 'resume', label: 'Resume', accept: '.pdf', required: true },
    { type: 'submit', id: 'sub', label: 'Submit', route: '/api/upload' },
  ],
});

describe('new-elements e2e — file input', () => {
  it('renders <input type="file">', () => {
    const html = render(FILE_INPUT_JSON);
    expect(html).toContain('type="file"');
  });

  it('has the correct accept attribute', () => {
    const html = render(FILE_INPUT_JSON);
    expect(html).toContain('accept=".pdf"');
  });

  it('has required attribute', () => {
    const html = render(FILE_INPUT_JSON);
    expect(html).toContain('required');
    // The input itself must carry required, not just somewhere in the markup
    expect(html).toMatch(/type="file"[^>]*required|required[^>]*type="file"/);
  });

  it('label is escaped (XSS test)', () => {
    const xssJson = JSON.stringify({
      version: '1',
      elements: [
        {
          type: 'input',
          kind: 'file',
          id: 'resume',
          label: '<script>alert("xss")</script>Upload CV',
          accept: '.pdf',
          required: true,
        },
        { type: 'submit', id: 'sub', label: 'Submit', route: '/api' },
      ],
    });
    const html = render(xssJson);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ── 2. Signature element ──────────────────────────────────────────────────────

const SIGNATURE_JSON = JSON.stringify({
  version: '1',
  elements: [
    { type: 'signature', id: 'sig', label: 'Signature' },
    { type: 'submit', id: 'sub', label: 'Submit', route: '/api/sign' },
  ],
});

describe('new-elements e2e — signature element', () => {
  it('renders .renderly-signature div', () => {
    const html = render(SIGNATURE_JSON);
    expect(html).toContain('renderly-signature');
  });

  it('has hidden input with name="sig"', () => {
    const html = render(SIGNATURE_JSON);
    expect(html).toContain('type="hidden"');
    expect(html).toContain('name="sig"');
  });

  it('has .renderly-signature__pad element', () => {
    const html = render(SIGNATURE_JSON);
    expect(html).toContain('renderly-signature__pad');
  });
});

// ── 3. Custom element ─────────────────────────────────────────────────────────

const CUSTOM_JSON = JSON.stringify({
  version: '1',
  elements: [
    { type: 'custom', kind: 'date-range', id: 'dates', label: 'Date Range' },
    { type: 'submit', id: 'sub', label: 'Submit', route: '/api' },
  ],
});

describe('new-elements e2e — custom element', () => {
  it('renders .renderly-custom div', () => {
    const html = render(CUSTOM_JSON);
    expect(html).toContain('renderly-custom');
  });

  it('has data-kind="date-range"', () => {
    const html = render(CUSTOM_JSON);
    expect(html).toContain('data-kind="date-range"');
  });

  it('renders label text', () => {
    const html = render(CUSTOM_JSON);
    expect(html).toContain('Date Range');
  });
});

// ── 4. Cross-field validation ─────────────────────────────────────────────────

const CROSS_VALIDATION_JSON = JSON.stringify({
  version: '1',
  elements: [
    {
      type: 'input',
      kind: 'text',
      id: 'end_date',
      label: 'End Date',
      rules: [
        {
          action: 'error',
          when: { field: 'end_date', op: 'empty' },
          message: 'End date is required',
        },
      ],
    },
    { type: 'submit', id: 'sub', label: 'Submit', route: '/api' },
  ],
});

describe('new-elements e2e — cross-field validation rule', () => {
  it('shows error message when end_date is empty string', () => {
    const html = render(CROSS_VALIDATION_JSON, { end_date: '' });
    expect(html).toContain('End date is required');
  });

  it('does not show error message when end_date is filled in', () => {
    const html = render(CROSS_VALIDATION_JSON, { end_date: '2026-12-31' });
    expect(html).not.toContain('End date is required');
  });
});
