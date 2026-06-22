import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr } from '@renderly/shared';
import type { RenderChildrenFn } from '../../src/types.js';
import type { HtmlError } from '../../src/errors.js';
import {
  renderContainer, renderHeading, renderText,
  renderInputText, renderInputNumber, renderInputDate, renderInputChoice,
  renderSubmit, renderFormError, renderFieldError,
} from '../../src/renderers.js';
import type {
  IRContainerNode, IRHeadingNode, IRTextNode,
  IRInputTextNode, IRInputNumberNode, IRInputDateNode, IRInputChoiceNode,
  IRSubmitNode, IRFormErrorNode, IRFieldErrorNode,
} from '@renderly/schema';

const noopChildren: RenderChildrenFn = (_) => ok('');
const failChildren: RenderChildrenFn = (_) => err<HtmlError>({ code: 'RENDER_ERROR', nodeType: 'test' });
const childHtml: RenderChildrenFn = (_) => ok('<p>child</p>');

// ── container ────────────────────────────────────────────────────────────────

const baseContainer: IRContainerNode = {
  type: 'container', id: undefined,
  direction: 'column', gap: 'md', cols: undefined, children: [],
};

describe('renderContainer', () => {
  it('renders without id', () => {
    const result = renderContainer(baseContainer, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe('<div data-direction="column" data-gap="md"></div>');
    }
  });

  it('renders with id (escaped)', () => {
    const node: IRContainerNode = { ...baseContainer, id: 'row<1>' };
    const result = renderContainer(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toContain('id="row&lt;1&gt;"');
  });

  it('includes rendered children in output', () => {
    const result = renderContainer(baseContainer, childHtml);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toContain('<p>child</p>');
  });

  it('propagates renderChildren error', () => {
    const result = renderContainer(baseContainer, failChildren);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('RENDER_ERROR');
  });

  it('emits responsive direction attributes', () => {
    const node: IRContainerNode = {
      ...baseContainer,
      direction: { default: 'column', md: 'row' },
    };
    const result = renderContainer(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('data-direction="column"');
      expect(result.value).toContain('data-md-direction="row"');
    }
  });

  it('emits responsive gap attributes', () => {
    const node: IRContainerNode = {
      ...baseContainer,
      gap: { default: 'sm', lg: 'lg' },
    };
    const result = renderContainer(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('data-gap="sm"');
      expect(result.value).toContain('data-lg-gap="lg"');
    }
  });

  it('emits scalar cols attribute', () => {
    const node: IRContainerNode = { ...baseContainer, cols: 2 };
    const result = renderContainer(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toContain('data-cols="2"');
  });

  it('emits responsive cols attributes', () => {
    const node: IRContainerNode = {
      ...baseContainer,
      cols: { default: 1, md: 2, lg: 3 },
    };
    const result = renderContainer(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('data-cols="1"');
      expect(result.value).toContain('data-md-cols="2"');
      expect(result.value).toContain('data-lg-cols="3"');
    }
  });

  it('omits data-cols attribute when cols is undefined', () => {
    const result = renderContainer(baseContainer, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).not.toContain('data-cols');
  });

  it('responsive object with no default key emits only breakpoint attrs', () => {
    const node: IRContainerNode = {
      ...baseContainer,
      direction: { md: 'row' },
    };
    const result = renderContainer(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).not.toContain('data-direction="');
      expect(result.value).toContain('data-md-direction="row"');
    }
  });
});

// ── heading ──────────────────────────────────────────────────────────────────

const baseHeading: IRHeadingNode = {
  type: 'heading', id: undefined,
  level: 2, text: 'Hello', size: 'lg', children: [],
};

describe('renderHeading', () => {
  it('renders without id', () => {
    const result = renderHeading(baseHeading, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe('<h2 data-size="lg">Hello</h2>');
  });

  it('renders with id', () => {
    const node: IRHeadingNode = { ...baseHeading, id: 'title' };
    const result = renderHeading(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe('<h2 id="title" data-size="lg">Hello</h2>');
  });

  it('escapes text content', () => {
    const node: IRHeadingNode = { ...baseHeading, text: 'A <b>bold</b> & "brave"' };
    const result = renderHeading(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('A &lt;b&gt;bold&lt;/b&gt; &amp; &quot;brave&quot;');
    }
  });
});

// ── text ─────────────────────────────────────────────────────────────────────

const baseText: IRTextNode = {
  type: 'text', id: undefined,
  content: 'Read me', weight: 'normal', intent: 'default', children: [],
};

describe('renderText', () => {
  it('renders without id', () => {
    const result = renderText(baseText, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe('<p data-weight="normal" data-intent="default">Read me</p>');
    }
  });

  it('renders with id', () => {
    const node: IRTextNode = { ...baseText, id: 'intro' };
    const result = renderText(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toContain('id="intro"');
  });

  it('escapes content', () => {
    const node: IRTextNode = { ...baseText, content: '<script>' };
    const result = renderText(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toContain('&lt;script&gt;');
  });
});

// ── input-text ────────────────────────────────────────────────────────────────

const baseInputText: IRInputTextNode = {
  type: 'input-text', id: 'name', label: 'Full Name',
  placeholder: undefined, required: false,
  minLength: undefined, maxLength: undefined, errors: [], children: [],
};

describe('renderInputText', () => {
  it('renders minimal (no optional attrs, no errors)', () => {
    const result = renderInputText(baseInputText, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const html = result.value;
      expect(html).toContain('type="text"');
      expect(html).toContain('id="name"');
      expect(html).not.toContain('required');
      expect(html).not.toContain('placeholder');
      expect(html).not.toContain('minlength');
      expect(html).not.toContain('maxlength');
      expect(html).not.toContain('field-error');
    }
  });

  it('renders full (required, placeholder, minLength, maxLength, errors)', () => {
    const node: IRInputTextNode = {
      ...baseInputText,
      required: true, placeholder: 'Enter name',
      minLength: 2, maxLength: 100,
      errors: ['Too short', '<b>invalid</b>'],
    };
    const result = renderInputText(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const html = result.value;
      expect(html).toContain(' required');
      expect(html).toContain('placeholder="Enter name"');
      expect(html).toContain('minlength="2"');
      expect(html).toContain('maxlength="100"');
      expect(html).toContain('Too short');
      expect(html).toContain('&lt;b&gt;invalid&lt;/b&gt;');
      expect(html).toContain('field-errors');
    }
  });
});

  it('escapes XSS in label', () => {
    const node: IRInputTextNode = { ...baseInputText, label: '<b>Full</b> "Name"' };
    const result = renderInputText(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('&lt;b&gt;Full&lt;/b&gt;');
      expect(result.value).toContain('&quot;Name&quot;');
      expect(result.value).not.toContain('<b>Full</b>');
    }
  });

  it('escapes XSS in placeholder', () => {
    const node: IRInputTextNode = { ...baseInputText, placeholder: '"><script>alert(1)</script>' };
    const result = renderInputText(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      // Raw <script> tag must not appear
      expect(result.value).not.toContain('<script>');
      expect(result.value).toContain('&lt;script&gt;');
      // " and > are escaped — attribute injection is neutralised
      expect(result.value).toContain('&quot;&gt;');
    }
  });

  it('escapes backtick in label — regression guard for ADR-0001', () => {
    const node: IRInputTextNode = { ...baseInputText, label: '`template`' };
    const result = renderInputText(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).not.toContain('`');
      expect(result.value).toContain('&#x60;');
    }
  });

// ── input-number ──────────────────────────────────────────────────────────────

const baseInputNumber: IRInputNumberNode = {
  type: 'input-number', id: 'age', label: 'Age',
  placeholder: undefined, required: false,
  min: undefined, max: undefined, errors: [], children: [],
};

describe('renderInputNumber', () => {
  it('renders minimal', () => {
    const result = renderInputNumber(baseInputNumber, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('type="number"');
      expect(result.value).not.toContain('min=');
      expect(result.value).not.toContain('max=');
    }
  });

  it('renders full (required, placeholder, min, max, errors)', () => {
    const node: IRInputNumberNode = {
      ...baseInputNumber, required: true,
      placeholder: '0–120', min: 0, max: 120,
      errors: ['Must be ≥ 0'],
    };
    const result = renderInputNumber(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const html = result.value;
      expect(html).toContain(' required');
      expect(html).toContain('placeholder="0–120"');
      expect(html).toContain('min="0"');
      expect(html).toContain('max="120"');
      expect(html).toContain('field-errors');
    }
  });
});

// ── input-date ───────────────────────────────────────────────────────────────

const baseInputDate: IRInputDateNode = {
  type: 'input-date', id: 'dob', label: 'Date of Birth',
  required: false, min: undefined, max: undefined, errors: [], children: [],
};

describe('renderInputDate', () => {
  it('renders minimal', () => {
    const result = renderInputDate(baseInputDate, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('type="date"');
      expect(result.value).not.toContain('min=');
    }
  });

  it('renders full (required, min, max, errors)', () => {
    const node: IRInputDateNode = {
      ...baseInputDate, required: true,
      min: '2000-01-01', max: '2030-12-31',
      errors: ['Invalid date'],
    };
    const result = renderInputDate(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const html = result.value;
      expect(html).toContain(' required');
      expect(html).toContain('min="2000-01-01"');
      expect(html).toContain('max="2030-12-31"');
      expect(html).toContain('field-errors');
    }
  });
});

// ── input-choice ──────────────────────────────────────────────────────────────

const baseInputChoice: IRInputChoiceNode = {
  type: 'input-choice', id: 'blood', label: 'Blood Type',
  required: false, multiple: false,
  options: [
    { value: 'A+', label: 'A+' },
    { value: 'O-', label: 'O-' },
    { value: '<special>', label: '"quoted"' },
  ],
  errors: [], children: [],
};

describe('renderInputChoice', () => {
  it('renders minimal (not required, single-select, no errors)', () => {
    const result = renderInputChoice(baseInputChoice, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const html = result.value;
      expect(html).toContain('<fieldset');
      expect(html).toContain('type="radio"');
      expect(html).not.toContain(' required');
      expect(html).not.toContain('type="checkbox"');
      expect(html).toContain('value="A+"');
      expect(html).toContain('&lt;special&gt;');
      expect(html).toContain('&quot;quoted&quot;');
    }
  });

  it('renders full (required, multiple/checkbox, errors)', () => {
    const node: IRInputChoiceNode = {
      ...baseInputChoice, required: true, multiple: true,
      errors: ['Select one'],
    };
    const result = renderInputChoice(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const html = result.value;
      expect(html).toContain('type="checkbox"');
      expect(html).toContain(' required');
      expect(html).toContain('field-errors');
    }
  });
});

// ── submit ────────────────────────────────────────────────────────────────────

describe('renderSubmit', () => {
  it('renders submit button with escaped route and label', () => {
    const node: IRSubmitNode = {
      type: 'submit', id: 'sub1',
      label: 'Save & Continue',
      route: '/api/submit?t=1&v=2',
      context: {}, children: [],
    };
    const result = renderSubmit(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const html = result.value;
      expect(html).toContain('type="submit"');
      expect(html).toContain('id="sub1"');
      expect(html).toContain('data-route="/api/submit?t=1&amp;v=2"');
      expect(html).toContain('Save &amp; Continue');
    }
  });
});

// ── error-form ────────────────────────────────────────────────────────────────

describe('renderFormError', () => {
  it('renders form-level error with escaped message', () => {
    const node: IRFormErrorNode = {
      type: 'error-form', id: undefined,
      message: '<b>Form</b> is invalid', children: [],
    };
    const result = renderFormError(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('role="alert"');
      expect(result.value).toContain('error--form');
      expect(result.value).toContain('&lt;b&gt;Form&lt;/b&gt;');
    }
  });
});

// ── error-field ───────────────────────────────────────────────────────────────

describe('renderFieldError', () => {
  it('renders field-level error with escaped fieldId and message', () => {
    const node: IRFieldErrorNode = {
      type: 'error-field', id: undefined,
      fieldId: 'first<name>', message: 'Required field',
      children: [],
    };
    const result = renderFieldError(node, noopChildren);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('data-field-id="first&lt;name&gt;"');
      expect(result.value).toContain('error--field');
      expect(result.value).toContain('Required field');
    }
  });
});
