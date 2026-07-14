import { describe, it, expect } from 'vitest';
import { isOk } from '@renderly/shared';
import {
  renderHeading,
  renderText,
  renderInputText,
  renderInputNumber,
  renderInputDate,
  renderInputChoice,
  renderSubmit,
  renderFormError,
  renderFieldError,
  renderContainer,
  renderRepeat,
  renderInputFile,
  renderSignature,
  renderCustom,
} from '../../src/renderers.js';
import type {
  IRHeadingNode,
  IRTextNode,
  IRInputTextNode,
  IRInputNumberNode,
  IRInputDateNode,
  IRInputChoiceNode,
  IRSubmitNode,
  IRFormErrorNode,
  IRFieldErrorNode,
  IRContainerNode,
  IRInputFileNode,
  IRSignatureNode,
  IRCustomNode,
  IRRepeatNode,
  IRRepeatItemNode,
} from '@renderly/schema';
import type { RenderChildrenFn } from '../../src/types.js';
import { ok } from '@renderly/shared';

const noChildren: RenderChildrenFn = () => ok('');

// ── renderHeading ─────────────────────────────────────────────────────────────

describe('renderHeading', () => {
  it('renders an h2 with escaped text and inline font-size style', () => {
    const node: IRHeadingNode = { type: 'heading', id: undefined, level: 2, text: 'Patient Info', size: 'lg', children: [] };
    const result = renderHeading(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('<h2');
    expect(result.value).toContain('</h2>');
    expect(result.value).toContain('Patient Info');
    expect(result.value).toContain('font-size:24px');
  });

  it('renders h1 through h6 with different font sizes', () => {
    const sizes = ['28px', '24px', '20px', '18px', '16px', '14px'];
    for (let level = 1; level <= 6; level++) {
      const node: IRHeadingNode = { type: 'heading', id: undefined, level: level as 1|2|3|4|5|6, text: 'T', size: 'md', children: [] };
      const r = renderHeading(node, noChildren);
      expect(isOk(r)).toBe(true);
      if (!isOk(r)) return;
      expect(r.value).toContain(sizes[level - 1]);
    }
  });

  it('escapes XSS in heading text', () => {
    const node: IRHeadingNode = { type: 'heading', id: undefined, level: 1, text: '<script>alert(1)</script>', size: 'xl', children: [] };
    const result = renderHeading(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('&lt;script&gt;');
  });

  it('includes id attribute when id is present', () => {
    const node: IRHeadingNode = { type: 'heading', id: 'section-title', level: 3, text: 'Title', size: 'md', children: [] };
    const result = renderHeading(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('id="section-title"');
  });

  it('omits id attribute when id is undefined', () => {
    const node: IRHeadingNode = { type: 'heading', id: undefined, level: 3, text: 'Title', size: 'md', children: [] };
    const result = renderHeading(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toContain(' id=');
  });
});

// ── renderText ────────────────────────────────────────────────────────────────

describe('renderText', () => {
  it('renders a paragraph with inline color for danger intent', () => {
    const node: IRTextNode = { type: 'text', id: undefined, content: 'Warning!', weight: 'bold', intent: 'danger', children: [] };
    const result = renderText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('<p');
    expect(result.value).toContain('Warning!');
    expect(result.value).toContain('#cc2200');
    expect(result.value).toContain('font-weight:700');
  });

  it('renders muted intent with correct color', () => {
    const node: IRTextNode = { type: 'text', id: undefined, content: 'Note', weight: 'normal', intent: 'muted', children: [] };
    const result = renderText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('#888888');
  });

  it('escapes XSS in text content', () => {
    const node: IRTextNode = { type: 'text', id: undefined, content: '<b>bold</b>', weight: 'normal', intent: 'default', children: [] };
    const result = renderText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<b>');
    expect(result.value).toContain('&lt;b&gt;');
  });
});

// ── renderInputText ───────────────────────────────────────────────────────────

describe('renderInputText', () => {
  it('renders label and placeholder display row (no <input> tag)', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'name', label: 'Full Name',
      placeholder: 'Jane Doe', required: false, minLength: undefined, maxLength: undefined,
      errors: [], children: [],
    };
    const result = renderInputText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('Full Name');
    expect(result.value).toContain('Jane Doe');
    expect(result.value).not.toContain('<input');
  });

  it('shows required asterisk when required=true', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'email', label: 'Email',
      placeholder: undefined, required: true, minLength: undefined, maxLength: undefined,
      errors: [], children: [],
    };
    const result = renderInputText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('*');
  });

  it('falls back to "Enter text…" when placeholder is undefined', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'notes', label: 'Notes',
      placeholder: undefined, required: false, minLength: undefined, maxLength: undefined,
      errors: [], children: [],
    };
    const result = renderInputText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('Enter text…');
  });

  it('renders field errors below the field', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'name', label: 'Name',
      placeholder: undefined, required: true, minLength: undefined, maxLength: undefined,
      errors: ['Name is required'], children: [],
    };
    const result = renderInputText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('Name is required');
  });

  it('escapes XSS in label and placeholder', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'x', label: '<script>alert(1)</script>',
      placeholder: '"><img/onerror=alert(2)>', required: false,
      minLength: undefined, maxLength: undefined, errors: [], children: [],
    };
    const result = renderInputText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    // Label XSS: script tag must be escaped
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('&lt;script&gt;');
    // Placeholder XSS: img tag must be escaped — onerror= is safe as text content
    // once the surrounding < > " are escaped; the browser won't parse it as a tag
    expect(result.value).toContain('&lt;img');
    expect(result.value).toContain('&quot;&gt;');
  });

  it('escapes XSS in field errors', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'x', label: 'X',
      placeholder: undefined, required: false, minLength: undefined, maxLength: undefined,
      errors: ['<script>steal()</script>'], children: [],
    };
    const result = renderInputText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('&lt;script&gt;');
  });

  it('backtick regression guard — escapes backtick in label', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'x', label: '`template injection`',
      placeholder: undefined, required: false, minLength: undefined, maxLength: undefined,
      errors: [], children: [],
    };
    const result = renderInputText(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('&#x60;');
    expect(result.value).not.toContain('`template');
  });
});

// ── renderInputNumber ─────────────────────────────────────────────────────────

describe('renderInputNumber', () => {
  it('renders label and placeholder, no <input> tag', () => {
    const node: IRInputNumberNode = {
      type: 'input-number', id: 'age', label: 'Age',
      placeholder: undefined, required: false, min: undefined, max: undefined,
      errors: [], children: [],
    };
    const result = renderInputNumber(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('Age');
    expect(result.value).toContain('Enter number…');
    expect(result.value).not.toContain('<input');
  });

  it('renders custom placeholder', () => {
    const node: IRInputNumberNode = {
      type: 'input-number', id: 'age', label: 'Age',
      placeholder: 'e.g. 25', required: false, min: undefined, max: undefined,
      errors: [], children: [],
    };
    const result = renderInputNumber(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('e.g. 25');
  });
});

// ── renderInputDate ───────────────────────────────────────────────────────────

describe('renderInputDate', () => {
  it('renders label with date format hint, no <input> tag', () => {
    const node: IRInputDateNode = {
      type: 'input-date', id: 'dob', label: 'Date of Birth',
      required: false, min: undefined, max: undefined, errors: [], children: [],
    };
    const result = renderInputDate(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('Date of Birth');
    expect(result.value).toContain('MM / DD / YYYY');
    expect(result.value).not.toContain('<input');
  });
});

// ── renderInputChoice ─────────────────────────────────────────────────────────

describe('renderInputChoice', () => {
  it('renders all option labels as display chips', () => {
    const node: IRInputChoiceNode = {
      type: 'input-choice', id: 'status', label: 'Status',
      required: false, multiple: false,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      errors: [], children: [],
    };
    const result = renderInputChoice(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('Active');
    expect(result.value).toContain('Inactive');
    expect(result.value).not.toContain('<select');
  });

  it('shows "Select all that apply" hint for multiple=true', () => {
    const node: IRInputChoiceNode = {
      type: 'input-choice', id: 'tags', label: 'Tags',
      required: false, multiple: true,
      options: [{ value: 'a', label: 'A' }],
      errors: [], children: [],
    };
    const result = renderInputChoice(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('Select all that apply');
  });

  it('shows "Select one" hint for multiple=false', () => {
    const node: IRInputChoiceNode = {
      type: 'input-choice', id: 'type', label: 'Type',
      required: false, multiple: false,
      options: [{ value: 'a', label: 'A' }],
      errors: [], children: [],
    };
    const result = renderInputChoice(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('Select one');
  });

  it('escapes XSS in option labels', () => {
    const node: IRInputChoiceNode = {
      type: 'input-choice', id: 'x', label: 'X',
      required: false, multiple: false,
      options: [{ value: 'v', label: '<script>evil()</script>' }],
      errors: [], children: [],
    };
    const result = renderInputChoice(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('&lt;script&gt;');
  });
});

// ── renderSubmit ──────────────────────────────────────────────────────────────

describe('renderSubmit', () => {
  it('renders as an <a> href link (no <button>)', () => {
    const node: IRSubmitNode = {
      type: 'submit', id: 'btn', label: 'Submit Form',
      route: '/api/submit', context: {}, children: [],
    };
    const result = renderSubmit(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('<a ');
    expect(result.value).toContain('href="/api/submit"');
    expect(result.value).toContain('Submit Form');
    expect(result.value).not.toContain('<button');
  });

  it('escapes XSS in label', () => {
    const node: IRSubmitNode = {
      type: 'submit', id: 'btn', label: '<script>xss()</script>',
      route: '/api/safe-route', context: {}, children: [],
    };
    const result = renderSubmit(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('&lt;script&gt;');
  });

  it('escapes angle brackets and quotes in route', () => {
    const node: IRSubmitNode = {
      type: 'submit', id: 'btn', label: 'Go',
      route: '/api?x=1&y=<b>"test"</b>', context: {}, children: [],
    };
    const result = renderSubmit(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<b>');
    expect(result.value).toContain('&lt;b&gt;');
    expect(result.value).toContain('&amp;');
    expect(result.value).toContain('&quot;');
  });

  it('rejects a javascript: route, falling back to a safe href', () => {
    const node: IRSubmitNode = {
      type: 'submit', id: 'btn', label: 'Go',
      route: 'javascript:alert(document.cookie)', context: {}, children: [],
    };
    const result = renderSubmit(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('javascript:');
    expect(result.value).toContain('href="#"');
  });
});

// ── renderFormError ───────────────────────────────────────────────────────────

describe('renderFormError', () => {
  it('renders error message with role=alert', () => {
    const node: IRFormErrorNode = { type: 'error-form', id: undefined, message: 'Something went wrong', children: [] };
    const result = renderFormError(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('role="alert"');
    expect(result.value).toContain('Something went wrong');
  });

  it('escapes XSS in form error message', () => {
    const node: IRFormErrorNode = { type: 'error-form', id: undefined, message: '<script>steal()</script>', children: [] };
    const result = renderFormError(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('&lt;script&gt;');
  });
});

// ── renderFieldError ──────────────────────────────────────────────────────────

describe('renderFieldError', () => {
  it('renders field error with data-field-id attribute', () => {
    const node: IRFieldErrorNode = { type: 'error-field', id: undefined, fieldId: 'email', message: 'Invalid email', children: [] };
    const result = renderFieldError(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('data-field-id="email"');
    expect(result.value).toContain('Invalid email');
    expect(result.value).toContain('role="alert"');
  });

  it('escapes XSS in field error message and fieldId', () => {
    const node: IRFieldErrorNode = {
      type: 'error-field', id: undefined,
      fieldId: '"><script>',
      message: '<img onerror=alert(1)>',
      children: [],
    };
    const result = renderFieldError(node, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    // fieldId XSS: script tag and quote in attribute must be escaped
    expect(result.value).not.toContain('<script>');
    expect(result.value).toContain('&lt;script&gt;');
    // message XSS: img tag must be escaped — onerror= as text content is safe
    // once the surrounding angle brackets are escaped
    expect(result.value).toContain('&lt;img');
    expect(result.value).toContain('&gt;');
  });
});

// ── renderContainer ───────────────────────────────────────────────────────────

describe('renderContainer', () => {
  it('renders children inside a div', () => {
    const renderChildrenFn: RenderChildrenFn = () => ok('<p>child</p>');
    const node: IRContainerNode = {
      type: 'container', id: undefined, direction: 'column', gap: 'md', cols: undefined, children: [],
    };
    const result = renderContainer(node, renderChildrenFn);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('<div');
    expect(result.value).toContain('<p>child</p>');
  });

  it('propagates child render failure', () => {
    const renderChildrenFn: RenderChildrenFn = () => ({
      ok: false, error: { code: 'UNREGISTERED_NODE_TYPE', nodeType: 'unknown' },
    });
    const node: IRContainerNode = {
      type: 'container', id: undefined, direction: 'column', gap: 'md', cols: undefined, children: [],
    };
    const result = renderContainer(node, renderChildrenFn);
    expect(result.ok).toBe(false);
  });
});

// ── renderRepeat ──────────────────────────────────────────────────────────────

function makeRepeatItem(index: number): IRRepeatItemNode {
  return { type: 'repeat-item', index, children: [] };
}

const baseRepeat: IRRepeatNode = {
  type: 'repeat', id: 'meds', label: 'Medications',
  minItems: 1, maxItems: 5,
  addLabel: 'Add', removeLabel: 'Remove',
  items: [makeRepeatItem(0), makeRepeatItem(1)],
  errors: [], children: [],
};

describe('renderRepeat', () => {
  it('renders each item in a bordered div', () => {
    const result = renderRepeat(baseRepeat, noChildren);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toContain('border:1px solid #dddddd');
    // 2 items → 2 bordered divs
    expect((result.value.match(/border:1px solid #dddddd/g) ?? []).length).toBe(2);
  });

  it('includes the label', () => {
    const result = renderRepeat(baseRepeat, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('Medications');
  });

  it('uses the node id', () => {
    const result = renderRepeat(baseRepeat, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('id="meds"');
  });

  it('includes child html inside each item', () => {
    const renderChildrenFn: RenderChildrenFn = () => ok('<span>child</span>');
    const result = renderRepeat(baseRepeat, renderChildrenFn);
    if (!isOk(result)) return;
    expect((result.value.match(/<span>child<\/span>/g) ?? []).length).toBe(2);
  });

  it('propagates child render failure', () => {
    const fail: RenderChildrenFn = () => ({
      ok: false, error: { code: 'UNREGISTERED_NODE_TYPE', nodeType: 'unknown' },
    });
    const result = renderRepeat(baseRepeat, fail);
    expect(result.ok).toBe(false);
  });

  it('renders errors', () => {
    const node: IRRepeatNode = { ...baseRepeat, errors: ['At least one required'] };
    const result = renderRepeat(node, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('At least one required');
  });

  it('escapes label', () => {
    const node: IRRepeatNode = { ...baseRepeat, label: '<b>bold</b>' };
    const result = renderRepeat(node, noChildren);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<b>bold</b>');
    expect(result.value).toContain('&lt;b&gt;bold&lt;/b&gt;');
  });
});

// ── renderInputFile ───────────────────────────────────────────────────────────

const baseInputFile: IRInputFileNode = {
  type: 'input-file', id: 'doc', label: 'Upload Document',
  accept: undefined, multiple: false, required: false, errors: [], children: [],
};

describe('renderInputFile', () => {
  it('renders label and placeholder', () => {
    const result = renderInputFile(baseInputFile, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('Upload Document');
    expect(result.value).toContain('Attach a file');
  });

  it('uses "Attach files" hint when multiple=true', () => {
    const node: IRInputFileNode = { ...baseInputFile, multiple: true };
    const result = renderInputFile(node, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('Attach files');
  });

  it('shows required marker when required=true', () => {
    const node: IRInputFileNode = { ...baseInputFile, required: true };
    const result = renderInputFile(node, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('color:#cc2200;');
  });

  it('renders errors', () => {
    const node: IRInputFileNode = { ...baseInputFile, errors: ['File required'] };
    const result = renderInputFile(node, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('File required');
  });

  it('escapes label', () => {
    const node: IRInputFileNode = { ...baseInputFile, label: '<script>' };
    const result = renderInputFile(node, noChildren);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<script>');
  });
});

// ── renderSignature ───────────────────────────────────────────────────────────

const baseSignature: IRSignatureNode = {
  type: 'signature', id: 'sig', label: 'Sign Here',
  required: false, errors: [], children: [],
};

describe('renderSignature', () => {
  it('renders label and dashed signature box', () => {
    const result = renderSignature(baseSignature, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('Sign Here');
    expect(result.value).toContain('border:1px dashed #aaaaaa');
  });

  it('renders errors', () => {
    const node: IRSignatureNode = { ...baseSignature, errors: ['Signature required'] };
    const result = renderSignature(node, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('Signature required');
  });

  it('escapes label', () => {
    const node: IRSignatureNode = { ...baseSignature, label: '<b>Sign</b>' };
    const result = renderSignature(node, noChildren);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('<b>Sign</b>');
  });
});

// ── renderCustom ──────────────────────────────────────────────────────────────

const baseCustom: IRCustomNode = {
  type: 'custom', id: 'widget-1', kind: 'rating-stars',
  label: 'Rate your experience', props: {}, errors: [], children: [],
};

describe('renderCustom', () => {
  it('renders with data-custom-kind attribute', () => {
    const result = renderCustom(baseCustom, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('data-custom-kind="rating-stars"');
  });

  it('uses the node id', () => {
    const result = renderCustom(baseCustom, noChildren);
    if (!isOk(result)) return;
    expect(result.value).toContain('id="widget-1"');
  });

  it('escapes kind attribute', () => {
    const node: IRCustomNode = { ...baseCustom, kind: '"evil"' };
    const result = renderCustom(node, noChildren);
    if (!isOk(result)) return;
    expect(result.value).not.toContain('"evil"');
  });

  it('includes child html', () => {
    const renderChildrenFn: RenderChildrenFn = () => ok('<span>child</span>');
    const result = renderCustom(baseCustom, renderChildrenFn);
    if (!isOk(result)) return;
    expect(result.value).toContain('<span>child</span>');
  });

  it('propagates child render failure', () => {
    const fail: RenderChildrenFn = () => ({
      ok: false, error: { code: 'UNREGISTERED_NODE_TYPE', nodeType: 'unknown' },
    });
    const result = renderCustom(baseCustom, fail);
    expect(result.ok).toBe(false);
  });
});
