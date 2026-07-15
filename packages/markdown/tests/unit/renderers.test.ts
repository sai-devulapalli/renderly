import { describe, it, expect } from 'vitest';
import { isOk } from '@renderly/shared';
import { ok } from '@renderly/shared';
import {
  renderHeading, renderText, renderInputText, renderInputNumber,
  renderInputDate, renderInputChoice, renderSubmit,
  renderFormError, renderFieldError, renderContainer,
  renderRepeat, renderInputFile, renderSignature, renderCustom,
} from '../../src/renderers.js';
import type { RenderChildrenFn } from '../../src/types.js';
import type {
  IRHeadingNode, IRTextNode, IRInputTextNode, IRInputChoiceNode,
  IRSubmitNode, IRFormErrorNode, IRFieldErrorNode, IRContainerNode,
  IRInputNumberNode, IRInputDateNode,
  IRInputFileNode, IRSignatureNode, IRCustomNode, IRRepeatNode, IRRepeatItemNode,
} from '@renderly/schema';

const noChildren: RenderChildrenFn = () => ok('');

// ── renderHeading ─────────────────────────────────────────────────────────────

describe('renderHeading', () => {
  it('renders h1 as # prefix', () => {
    const node: IRHeadingNode = { type: 'heading', id: undefined, level: 1, text: 'Title', size: 'xl', children: [] };
    const r = renderHeading(node, noChildren);
    expect(isOk(r)).toBe(true);
    if (!isOk(r)) return;
    expect(r.value).toBe('# Title\n\n');
  });

  it('renders h3 as ### prefix', () => {
    const node: IRHeadingNode = { type: 'heading', id: undefined, level: 3, text: 'Sub', size: 'md', children: [] };
    const r = renderHeading(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toBe('### Sub\n\n');
  });

  it('escapes markdown special chars in heading text', () => {
    const node: IRHeadingNode = { type: 'heading', id: undefined, level: 2, text: '*Bold* & [link]', size: 'md', children: [] };
    const r = renderHeading(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).not.toContain('*Bold*');
    expect(r.value).toContain('\\*Bold\\*');
  });
});

// ── renderText ────────────────────────────────────────────────────────────────

describe('renderText', () => {
  it('renders normal text as a plain paragraph', () => {
    const node: IRTextNode = { type: 'text', id: undefined, content: 'Hello world', weight: 'normal', intent: 'default', children: [] };
    const r = renderText(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toBe('Hello world\n\n');
  });

  it('renders bold text with ** markers', () => {
    const node: IRTextNode = { type: 'text', id: undefined, content: 'Important', weight: 'bold', intent: 'default', children: [] };
    const r = renderText(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('**Important**');
  });
});

// ── renderInputText ───────────────────────────────────────────────────────────

describe('renderInputText', () => {
  it('renders label in bold with (required) badge', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'name', label: 'Full Name',
      placeholder: undefined, required: true, minLength: undefined, maxLength: undefined,
      errors: [], children: [],
    };
    const r = renderInputText(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('**Full Name**');
    expect(r.value).toContain('*(required)*');
  });

  it('includes placeholder in italic when present', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'email', label: 'Email',
      placeholder: 'user@example.com', required: false,
      minLength: undefined, maxLength: undefined, errors: [], children: [],
    };
    const r = renderInputText(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('_user@example\\.com_');
  });

  it('renders field errors as blockquotes', () => {
    const node: IRInputTextNode = {
      type: 'input-text', id: 'x', label: 'X',
      placeholder: undefined, required: false, minLength: undefined, maxLength: undefined,
      errors: ['This field is required'], children: [],
    };
    const r = renderInputText(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('> ⚠ This field is required');
  });
});

// ── renderInputChoice ─────────────────────────────────────────────────────────

describe('renderInputChoice', () => {
  it('renders options as markdown list items', () => {
    const node: IRInputChoiceNode = {
      type: 'input-choice', id: 'g', label: 'Gender',
      required: false, multiple: false,
      options: [{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }],
      errors: [], children: [],
    };
    const r = renderInputChoice(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('- Male\n');
    expect(r.value).toContain('- Female\n');
  });

  it('shows "(select all that apply)" for multiple=true', () => {
    const node: IRInputChoiceNode = {
      type: 'input-choice', id: 't', label: 'Tags',
      required: false, multiple: true,
      options: [{ value: 'a', label: 'A' }],
      errors: [], children: [],
    };
    const r = renderInputChoice(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('select all that apply');
  });
});

// ── renderSubmit ──────────────────────────────────────────────────────────────

describe('renderSubmit', () => {
  it('renders as a bold markdown link with → prefix', () => {
    const node: IRSubmitNode = { type: 'submit', id: 's', label: 'Submit', route: '/api', context: {}, children: [] };
    const r = renderSubmit(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('→ **[Submit](/api)**');
    expect(r.value).toContain('---');
  });

  it('rejects a javascript: route, falling back to a safe link destination', () => {
    const node: IRSubmitNode = {
      type: 'submit', id: 's', label: 'Submit',
      route: 'javascript:alert(document.cookie)', context: {}, children: [],
    };
    const r = renderSubmit(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).not.toContain('javascript:');
    expect(r.value).toContain('[Submit](\\#)');
  });
});

// ── renderFormError ───────────────────────────────────────────────────────────

describe('renderFormError', () => {
  it('renders as blockquote with ⚠', () => {
    const node: IRFormErrorNode = { type: 'error-form', id: undefined, message: 'Form failed', children: [] };
    const r = renderFormError(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('> ⚠ **Form error:** Form failed');
  });
});

// ── renderFieldError ──────────────────────────────────────────────────────────

describe('renderFieldError', () => {
  it('renders field id and message in blockquote', () => {
    const node: IRFieldErrorNode = { type: 'error-field', id: undefined, fieldId: 'email', message: 'Invalid', children: [] };
    const r = renderFieldError(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('> ⚠ **email:** Invalid');
  });
});

// ── renderContainer ───────────────────────────────────────────────────────────

describe('renderContainer', () => {
  it('renders children with trailing newline', () => {
    const childFn: RenderChildrenFn = () => ok('child content\n\n');
    const node: IRContainerNode = { type: 'container', id: undefined, direction: 'column', gap: 'md', cols: undefined, children: [] };
    const r = renderContainer(node, childFn);
    if (!isOk(r)) return;
    expect(r.value).toContain('child content');
    expect(r.value).toMatch(/\n$/);
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
  it('renders a bold label', () => {
    const r = renderRepeat(baseRepeat, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('**Medications**');
  });

  it('renders "### Item N" heading per item', () => {
    const r = renderRepeat(baseRepeat, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('### Item 1');
    expect(r.value).toContain('### Item 2');
  });

  it('includes child content inside each item', () => {
    let call = 0;
    const childFn: RenderChildrenFn = () => ok(`child-${call++}\n\n`);
    const r = renderRepeat(baseRepeat, childFn);
    if (!isOk(r)) return;
    expect(r.value).toContain('child-0');
    expect(r.value).toContain('child-1');
  });

  it('propagates child render failure', () => {
    const fail: RenderChildrenFn = () => ({
      ok: false, error: { code: 'UNREGISTERED_NODE_TYPE', nodeType: 'unknown' },
    });
    const r = renderRepeat(baseRepeat, fail);
    expect(r.ok).toBe(false);
  });

  it('renders errors as blockquote warnings', () => {
    const node: IRRepeatNode = { ...baseRepeat, errors: ['At least one item required'] };
    const r = renderRepeat(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('⚠');
    expect(r.value).toContain('At least one item required');
  });

  it('escapes label markdown', () => {
    const node: IRRepeatNode = { ...baseRepeat, label: '*Meds*' };
    const r = renderRepeat(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).not.toContain('**\*Meds\***');
    expect(r.value).toContain('\\*Meds\\*');
  });
});

// ── renderInputFile ───────────────────────────────────────────────────────────

const baseInputFile: IRInputFileNode = {
  type: 'input-file', id: 'doc', label: 'Upload Document',
  accept: undefined, multiple: false, required: false, errors: [], children: [],
};

describe('renderInputFile', () => {
  it('renders bold label', () => {
    const r = renderInputFile(baseInputFile, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('**Upload Document**');
  });

  it('adds "(multiple files)" hint when multiple=true', () => {
    const node: IRInputFileNode = { ...baseInputFile, multiple: true };
    const r = renderInputFile(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('_(multiple files)_');
  });

  it('includes accept filter when set', () => {
    const node: IRInputFileNode = { ...baseInputFile, accept: '.pdf,.doc' };
    const r = renderInputFile(node, noChildren);
    if (!isOk(r)) return;
    // escapeMd escapes . to \.
    expect(r.value).toContain('\\.pdf,\\.doc');
  });

  it('includes required badge when required=true', () => {
    const node: IRInputFileNode = { ...baseInputFile, required: true };
    const r = renderInputFile(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('*(required)*');
  });

  it('renders errors', () => {
    const node: IRInputFileNode = { ...baseInputFile, errors: ['Required'] };
    const r = renderInputFile(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('⚠');
    expect(r.value).toContain('Required');
  });
});

// ── renderSignature ───────────────────────────────────────────────────────────

const baseSignature: IRSignatureNode = {
  type: 'signature', id: 'sig', label: 'Sign Here',
  required: false, errors: [], children: [],
};

describe('renderSignature', () => {
  it('renders bold label and [signature field] hint', () => {
    const r = renderSignature(baseSignature, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('**Sign Here**');
    expect(r.value).toContain('_[signature field]_');
  });

  it('includes required badge when required=true', () => {
    const node: IRSignatureNode = { ...baseSignature, required: true };
    const r = renderSignature(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('*(required)*');
  });

  it('renders errors', () => {
    const node: IRSignatureNode = { ...baseSignature, errors: ['Required'] };
    const r = renderSignature(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('⚠');
  });
});

// ── renderCustom ──────────────────────────────────────────────────────────────

const baseCustom: IRCustomNode = {
  type: 'custom', id: 'w1', kind: 'rating-stars',
  label: 'Rate your experience', props: {}, errors: [], children: [],
};

describe('renderCustom', () => {
  it('renders kind in italics', () => {
    const r = renderCustom(baseCustom, noChildren);
    if (!isOk(r)) return;
    // escapeMd escapes - to \- so 'rating-stars' becomes 'rating\-stars'
    expect(r.value).toContain('_[rating\\-stars]_');
  });

  it('includes label when set', () => {
    const r = renderCustom(baseCustom, noChildren);
    if (!isOk(r)) return;
    expect(r.value).toContain('**Rate your experience**');
  });

  it('omits label prefix when label is undefined', () => {
    const node: IRCustomNode = { ...baseCustom, label: undefined };
    const r = renderCustom(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).not.toContain('**');
    expect(r.value).toContain('_[rating\\-stars]_');
  });

  it('includes child content', () => {
    const childFn: RenderChildrenFn = () => ok('child content\n\n');
    const r = renderCustom(baseCustom, childFn);
    if (!isOk(r)) return;
    expect(r.value).toContain('child content');
  });

  it('propagates child render failure', () => {
    const fail: RenderChildrenFn = () => ({
      ok: false, error: { code: 'UNREGISTERED_NODE_TYPE', nodeType: 'unknown' },
    });
    const r = renderCustom(baseCustom, fail);
    expect(r.ok).toBe(false);
  });

  it('escapes kind', () => {
    const node: IRCustomNode = { ...baseCustom, kind: '*bold*' };
    const r = renderCustom(node, noChildren);
    if (!isOk(r)) return;
    expect(r.value).not.toContain('[*bold*]');
    expect(r.value).toContain('[\\*bold\\*]');
  });
});
