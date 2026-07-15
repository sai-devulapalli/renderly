import { describe, it, expect } from 'vitest';
import { auditNodes } from '../../src/audit.js';
import type { IRNode, IRHeadingNode, IRInputChoiceNode, IRSubmitNode, IRInputTextNode, IRContainerNode, IRTextNode, IRFormErrorNode, IRFieldErrorNode } from '@renderly/schema';

// ── helpers ───────────────────────────────────────────────────────────────────

function heading(level: 1|2|3|4|5|6, id?: string): IRHeadingNode {
  return { type: 'heading', id, level, text: 'Title', size: 'md', children: [] };
}

function textInput(id: string, label = 'Full Name'): IRInputTextNode {
  return { type: 'input-text', id, label, placeholder: undefined, required: false, minLength: undefined, maxLength: undefined, errors: [], children: [] };
}

function choiceInput(id: string, optionCount = 2): IRInputChoiceNode {
  const options = Array.from({ length: optionCount }, (_, i) => ({ value: `v${i}`, label: `Option ${i}` }));
  return { type: 'input-choice', id, label: 'Choose', required: false, multiple: false, options, errors: [], children: [] };
}

function submit(id: string, label = 'Submit'): IRSubmitNode {
  return { type: 'submit', id, label, route: '/api', context: {}, children: [] };
}

function text(content = 'Some text'): IRTextNode {
  return { type: 'text', id: undefined, content, weight: 'normal', intent: 'default', children: [] };
}

function formError(message = 'Form is invalid'): IRFormErrorNode {
  return { type: 'error-form', id: undefined, message, children: [] };
}

function fieldError(fieldId: string, message = 'Field is invalid'): IRFieldErrorNode {
  return { type: 'error-field', id: undefined, fieldId, message, children: [] };
}

// ── EMPTY_FORM ────────────────────────────────────────────────────────────────

describe('auditNodes — EMPTY_FORM', () => {
  it('reports EMPTY_FORM warning for an empty node array', () => {
    const violations = auditNodes([]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.code).toBe('EMPTY_FORM');
    expect(violations[0]?.severity).toBe('warning');
  });

  it('does not report EMPTY_FORM for non-empty node arrays', () => {
    const violations = auditNodes([submit('s')]);
    const codes = violations.map((v) => v.code);
    expect(codes).not.toContain('EMPTY_FORM');
  });
});

// ── HEADING_SKIP ──────────────────────────────────────────────────────────────

describe('auditNodes — HEADING_SKIP', () => {
  it('no violation for consecutive heading levels', () => {
    const nodes: IRNode[] = [heading(1), heading(2), heading(3)];
    const violations = auditNodes(nodes);
    expect(violations.filter((v) => v.code === 'HEADING_SKIP')).toHaveLength(0);
  });

  it('violation when skipping h1 → h3', () => {
    const nodes: IRNode[] = [heading(1), heading(3)];
    const violations = auditNodes(nodes);
    expect(violations.find((v) => v.code === 'HEADING_SKIP')).toBeDefined();
  });

  it('no violation for the first heading regardless of level', () => {
    const violations = auditNodes([heading(3), submit('s')]);
    expect(violations.filter((v) => v.code === 'HEADING_SKIP')).toHaveLength(0);
  });

  it('no violation when going from h3 back to h1 (reset is allowed)', () => {
    const nodes: IRNode[] = [heading(1), heading(2), heading(3), heading(1)];
    const violations = auditNodes(nodes);
    expect(violations.filter((v) => v.code === 'HEADING_SKIP')).toHaveLength(0);
  });

  it('violation includes the heading id when present', () => {
    const nodes: IRNode[] = [heading(1, 'top'), heading(4, 'skip-me')];
    const v = auditNodes(nodes).find((x) => x.code === 'HEADING_SKIP');
    expect(v?.id).toBe('skip-me');
    expect(v?.severity).toBe('warning');
  });
});

// ── DUPLICATE_ID ──────────────────────────────────────────────────────────────

describe('auditNodes — DUPLICATE_ID', () => {
  it('no violation when all IDs are unique', () => {
    const nodes: IRNode[] = [textInput('a'), textInput('b'), submit('s')];
    expect(auditNodes(nodes).filter((v) => v.code === 'DUPLICATE_ID')).toHaveLength(0);
  });

  it('reports DUPLICATE_ID when two nodes share an id', () => {
    const nodes: IRNode[] = [textInput('name'), textInput('name'), submit('s')];
    const v = auditNodes(nodes).filter((v) => v.code === 'DUPLICATE_ID');
    expect(v).toHaveLength(1);
    expect(v[0]?.id).toBe('name');
    expect(v[0]?.severity).toBe('error');
  });

  it('detects duplicates inside a container', () => {
    const container: IRContainerNode = {
      type: 'container', id: undefined, direction: 'column', gap: 'md', cols: undefined,
      children: [textInput('field_a'), textInput('field_a')],
    };
    const v = auditNodes([container]).filter((x) => x.code === 'DUPLICATE_ID');
    expect(v).toHaveLength(1);
    expect(v[0]?.id).toBe('field_a');
  });
});

// ── EMPTY_CHOICE_OPTIONS ──────────────────────────────────────────────────────

describe('auditNodes — EMPTY_CHOICE_OPTIONS', () => {
  it('no violation when choice has options', () => {
    const violations = auditNodes([choiceInput('status', 2), submit('s')]);
    expect(violations.filter((v) => v.code === 'EMPTY_CHOICE_OPTIONS')).toHaveLength(0);
  });

  it('reports EMPTY_CHOICE_OPTIONS when options array is empty', () => {
    const empty = choiceInput('status', 0);
    const v = auditNodes([empty, submit('s')]).find((x) => x.code === 'EMPTY_CHOICE_OPTIONS');
    expect(v).toBeDefined();
    expect(v?.id).toBe('status');
    expect(v?.severity).toBe('error');
  });
});

// ── EMPTY_SUBMIT_LABEL ────────────────────────────────────────────────────────

describe('auditNodes — EMPTY_SUBMIT_LABEL', () => {
  it('no violation for submit with a label', () => {
    const violations = auditNodes([submit('s', 'Register')]);
    expect(violations.filter((v) => v.code === 'EMPTY_SUBMIT_LABEL')).toHaveLength(0);
  });

  it('reports EMPTY_SUBMIT_LABEL for empty string label', () => {
    const v = auditNodes([submit('s', '')]).find((x) => x.code === 'EMPTY_SUBMIT_LABEL');
    expect(v).toBeDefined();
    expect(v?.id).toBe('s');
    expect(v?.severity).toBe('error');
  });

  it('reports EMPTY_SUBMIT_LABEL for whitespace-only label', () => {
    const v = auditNodes([submit('s', '   ')]).find((x) => x.code === 'EMPTY_SUBMIT_LABEL');
    expect(v).toBeDefined();
  });
});

// ── MISSING_FIELD_LABEL ───────────────────────────────────────────────────────

describe('auditNodes — MISSING_FIELD_LABEL', () => {
  it('no violation for input with a label', () => {
    const violations = auditNodes([textInput('name', 'Full Name'), submit('s')]);
    expect(violations.filter((v) => v.code === 'MISSING_FIELD_LABEL')).toHaveLength(0);
  });

  it('reports MISSING_FIELD_LABEL for empty label', () => {
    const v = auditNodes([textInput('x', ''), submit('s')]).find((x) => x.code === 'MISSING_FIELD_LABEL');
    expect(v).toBeDefined();
    expect(v?.id).toBe('x');
    expect(v?.severity).toBe('error');
  });

  it('reports MISSING_FIELD_LABEL for whitespace-only label', () => {
    const v = auditNodes([textInput('x', '   ')]).find((x) => x.code === 'MISSING_FIELD_LABEL');
    expect(v).toBeDefined();
  });
});

// ── pass-through nodes ────────────────────────────────────────────────────────

describe('auditNodes — pass-through nodes', () => {
  it('produces no violations for text, error-form, and error-field nodes', () => {
    const nodes: IRNode[] = [text(), formError(), fieldError('name')];
    expect(auditNodes(nodes)).toHaveLength(0);
  });
});

// ── clean form ────────────────────────────────────────────────────────────────

describe('auditNodes — clean form', () => {
  it('returns no violations for a well-formed form', () => {
    const nodes: IRNode[] = [
      heading(1, 'h1'),
      heading(2, 'h2'),
      textInput('name', 'Full Name'),
      choiceInput('gender', 3),
      submit('s', 'Submit'),
    ];
    expect(auditNodes(nodes)).toHaveLength(0);
  });
});
