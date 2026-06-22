import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument } from '../../src/adapter.js';
import { isOk } from '@renderly/shared';

function render(json: string): string {
  const docResult = parseDocument(json);
  if (!isOk(docResult)) throw new Error(`parse failed: ${JSON.stringify(docResult)}`);
  const walkResult = walk(docResult.value, createDefaultRegistry());
  if (!isOk(walkResult)) throw new Error(`walk failed: ${JSON.stringify(walkResult)}`);
  const emailResult = renderDocument(walkResult.value);
  if (!isOk(emailResult)) throw new Error(`render failed: ${JSON.stringify(emailResult)}`);
  return emailResult.value;
}

function renderBare(json: string): string {
  const docResult = parseDocument(json);
  if (!isOk(docResult)) throw new Error(`parse failed: ${JSON.stringify(docResult)}`);
  const walkResult = walk(docResult.value, createDefaultRegistry());
  if (!isOk(walkResult)) throw new Error(`walk failed: ${JSON.stringify(walkResult)}`);
  const emailResult = renderDocument(walkResult.value, undefined, { bare: true });
  if (!isOk(emailResult)) throw new Error(`render failed: ${JSON.stringify(emailResult)}`);
  return emailResult.value;
}

const SIMPLE_FORM = JSON.stringify({
  version: '1',
  elements: [
    { type: 'heading', level: 1, text: 'Patient Registration' },
    { type: 'input', kind: 'text', id: 'full_name', label: 'Full Name', required: true },
    { type: 'input', kind: 'number', id: 'age', label: 'Age' },
    { type: 'input', kind: 'date', id: 'dob', label: 'Date of Birth' },
    {
      type: 'input', kind: 'choice', id: 'gender', label: 'Gender',
      options: [
        { value: 'm', label: 'Male' },
        { value: 'f', label: 'Female' },
        { value: 'nb', label: 'Non-binary' },
      ],
    },
    { type: 'submit', id: 's', label: 'Register Patient', route: '/api/register' },
  ],
});

// ── outer wrapper ─────────────────────────────────────────────────────────────

describe('email e2e — outer 600px wrapper', () => {
  it('wraps output in a 600px max-width table', () => {
    const html = render(SIMPLE_FORM);
    expect(html).toContain('max-width:600px');
    expect(html).toContain('<table');
    expect(html).toContain('</table>');
  });

  it('bare mode omits the outer wrapper table', () => {
    const html = renderBare(SIMPLE_FORM);
    expect(html).not.toContain('max-width:600px');
    expect(html).not.toContain('<table');
    expect(html).toContain('Patient Registration');
  });

  it('contains no interactive HTML elements', () => {
    const html = render(SIMPLE_FORM);
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<select');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('<form');
  });
});

// ── all node types render ─────────────────────────────────────────────────────

describe('email e2e — all field types render correctly', () => {
  it('renders heading with correct text', () => {
    const html = render(SIMPLE_FORM);
    expect(html).toContain('Patient Registration');
    expect(html).toContain('<h1');
  });

  it('renders text input label', () => {
    const html = render(SIMPLE_FORM);
    expect(html).toContain('Full Name');
  });

  it('renders number input label', () => {
    const html = render(SIMPLE_FORM);
    expect(html).toContain('Age');
  });

  it('renders date input with MM / DD / YYYY hint', () => {
    const html = render(SIMPLE_FORM);
    expect(html).toContain('Date of Birth');
    expect(html).toContain('MM / DD / YYYY');
  });

  it('renders choice input option labels', () => {
    const html = render(SIMPLE_FORM);
    expect(html).toContain('Male');
    expect(html).toContain('Female');
    expect(html).toContain('Non-binary');
  });

  it('renders submit as an <a> link to the route', () => {
    const html = render(SIMPLE_FORM);
    expect(html).toContain('href="/api/register"');
    expect(html).toContain('Register Patient');
    expect(html).not.toContain('<button');
  });
});

// ── inline styles ─────────────────────────────────────────────────────────────

describe('email e2e — inline styles', () => {
  it('all style attributes are inline (no <style> block)', () => {
    const html = render(SIMPLE_FORM);
    expect(html).not.toContain('<style');
  });

  it('uses font-family in heading output', () => {
    const html = render(SIMPLE_FORM);
    expect(html).toContain('font-family:Arial');
  });
});

// ── text node ─────────────────────────────────────────────────────────────────

describe('email e2e — text node rendering', () => {
  it('renders text node with correct intent color', () => {
    const json = JSON.stringify({
      version: '1',
      elements: [
        { type: 'text', content: 'Please complete all fields', weight: 'normal', intent: 'muted' },
        { type: 'submit', id: 's', label: 'Submit', route: '/api' },
      ],
    });
    const html = render(json);
    expect(html).toContain('Please complete all fields');
    expect(html).toContain('#888888');
  });

  it('renders bold text with font-weight:700', () => {
    const json = JSON.stringify({
      version: '1',
      elements: [
        { type: 'text', content: 'Important!', weight: 'bold', intent: 'danger' },
        { type: 'submit', id: 's', label: 'Submit', route: '/api' },
      ],
    });
    const html = render(json);
    expect(html).toContain('font-weight:700');
    expect(html).toContain('#cc2200');
  });
});

// ── container section ─────────────────────────────────────────────────────────

describe('email e2e — container section', () => {
  it('renders nested container with heading and input inside', () => {
    const json = JSON.stringify({
      version: '1',
      elements: [
        {
          type: 'container',
          children: [
            { type: 'heading', level: 2, text: 'Guardian Information' },
            { type: 'input', kind: 'text', id: 'guardian_name', label: 'Guardian Name' },
          ],
        },
        { type: 'submit', id: 's', label: 'Submit', route: '/api' },
      ],
    });
    const html = render(json);
    expect(html).toContain('Guardian Information');
    expect(html).toContain('Guardian Name');
    expect(html).toContain('<h2');
  });
});

// ── XSS / security ───────────────────────────────────────────────────────────

describe('email e2e — XSS in server-returned errors', () => {
  it('escapes script injection in form-level error messages', () => {
    const doc = JSON.stringify({
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'name', label: 'Name' },
        { type: 'submit', id: 's', label: 'Submit', route: '/api' },
      ],
      errors: {
        form: ['<script>stealCookies()</script>'],
      },
    });
    const html = render(doc);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('all 6 XSS chars escaped in form error text', () => {
    const doc = JSON.stringify({
      version: '1',
      elements: [{ type: 'submit', id: 's', label: 'Go', route: '/api' }],
      errors: { form: ['& < > " \' `'] },
    });
    const html = render(doc);
    expect(html).toContain('&amp;');
    expect(html).toContain('&lt;');
    expect(html).toContain('&gt;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#x27;');
    expect(html).toContain('&#x60;');
  });
});

// ── required field indicator ──────────────────────────────────────────────────

describe('email e2e — required field indicator', () => {
  it('shows required asterisk for required fields', () => {
    const json = JSON.stringify({
      version: '1',
      elements: [
        { type: 'input', kind: 'text', id: 'name', label: 'Full Name', required: true },
        { type: 'submit', id: 's', label: 'Submit', route: '/api' },
      ],
    });
    const html = render(json);
    expect(html).toContain('*');
  });
});
