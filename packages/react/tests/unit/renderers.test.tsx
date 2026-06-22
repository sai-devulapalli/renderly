import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { isOk, isErr, ok, err } from '@renderly/shared';
import type { ReactRendererContext } from '../../src/types.js';
import type { ReactError } from '../../src/errors.js';
import {
  renderContainer, renderHeading, renderText,
  renderInputText, renderInputNumber, renderInputDate, renderInputChoice,
  renderSubmit, renderFormError, renderFieldError,
  renderRepeat, renderInputFile, renderSignature, renderCustom,
} from '../../src/renderers.js';
import type {
  IRContainerNode, IRHeadingNode, IRTextNode,
  IRInputTextNode, IRInputNumberNode, IRInputDateNode, IRInputChoiceNode,
  IRSubmitNode, IRFormErrorNode, IRFieldErrorNode,
  IRInputFileNode, IRSignatureNode, IRCustomNode, IRRepeatNode, IRRepeatItemNode,
} from '@renderly/schema';

const noopCtx: ReactRendererContext = { renderChildren: (_) => ok([]) };
const failCtx: ReactRendererContext = {
  renderChildren: (_) => err<ReactError>({ code: 'RENDER_ERROR', nodeType: 'test' }),
};

// ── container ────────────────────────────────────────────────────────────────

const baseContainer: IRContainerNode = {
  type: 'container', id: undefined,
  direction: 'column', gap: 'md', cols: undefined, children: [],
};

describe('renderContainer', () => {
  it('renders div without id when id is undefined', () => {
    const result = renderContainer(baseContainer, noopCtx);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const div = container.firstElementChild as HTMLElement;
    expect(div.tagName).toBe('DIV');
    expect(div.hasAttribute('id')).toBe(false);
    expect(div.getAttribute('data-direction')).toBe('column');
    expect(div.getAttribute('data-gap')).toBe('md');
  });

  it('renders div with id when id is set', () => {
    const node: IRContainerNode = { ...baseContainer, id: 'row-1' };
    const result = renderContainer(node, noopCtx);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.firstElementChild?.getAttribute('id')).toBe('row-1');
  });

  it('includes rendered children', () => {
    const ctx: ReactRendererContext = {
      renderChildren: (_) => ok([<span key="c">child</span>]),
    };
    const result = renderContainer(baseContainer, ctx);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const { getByText } = render(result.value);
    expect(getByText('child')).toBeTruthy();
  });

  it('propagates renderChildren error', () => {
    const result = renderContainer(baseContainer, failCtx);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('RENDER_ERROR');
  });

  it('emits responsive direction data attributes', () => {
    const node: IRContainerNode = {
      ...baseContainer,
      direction: { default: 'column', md: 'row' },
    };
    const result = renderContainer(node, noopCtx);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const div = container.firstElementChild as HTMLElement;
    expect(div.getAttribute('data-direction')).toBe('column');
    expect(div.getAttribute('data-md-direction')).toBe('row');
  });

  it('emits responsive gap data attributes', () => {
    const node: IRContainerNode = {
      ...baseContainer,
      gap: { default: 'sm', lg: 'lg' },
    };
    const result = renderContainer(node, noopCtx);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const div = container.firstElementChild as HTMLElement;
    expect(div.getAttribute('data-gap')).toBe('sm');
    expect(div.getAttribute('data-lg-gap')).toBe('lg');
  });

  it('emits scalar cols data attribute', () => {
    const node: IRContainerNode = { ...baseContainer, cols: 2 };
    const result = renderContainer(node, noopCtx);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect((container.firstElementChild as HTMLElement).getAttribute('data-cols')).toBe('2');
  });

  it('emits responsive cols data attributes', () => {
    const node: IRContainerNode = {
      ...baseContainer,
      cols: { default: 1, md: 2, lg: 3 },
    };
    const result = renderContainer(node, noopCtx);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const div = container.firstElementChild as HTMLElement;
    expect(div.getAttribute('data-cols')).toBe('1');
    expect(div.getAttribute('data-md-cols')).toBe('2');
    expect(div.getAttribute('data-lg-cols')).toBe('3');
  });

  it('omits data-cols when cols is undefined', () => {
    const result = renderContainer(baseContainer, noopCtx);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect((container.firstElementChild as HTMLElement).hasAttribute('data-cols')).toBe(false);
  });
});

// ── heading ──────────────────────────────────────────────────────────────────

describe('renderHeading', () => {
  it.each([1, 2, 3, 4, 5, 6] as const)('renders h%i', (level) => {
    const node: IRHeadingNode = {
      type: 'heading', id: undefined, level, text: `H${level}`, size: 'lg', children: [],
    };
    const result = renderHeading(node, noopCtx);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const el = container.querySelector(`h${level}`);
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe(`H${level}`);
  });

  it('renders with id attribute', () => {
    const node: IRHeadingNode = {
      type: 'heading', id: 'title', level: 1, text: 'Title', size: 'xl', children: [],
    };
    const result = renderHeading(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelector('h1')?.id).toBe('title');
  });

  it('text content is rendered safely (React escapes automatically)', () => {
    const node: IRHeadingNode = {
      type: 'heading', id: undefined, level: 1, text: '<script>alert(1)</script>', size: 'lg', children: [],
    };
    const result = renderHeading(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.querySelector('h1')?.textContent).toBe('<script>alert(1)</script>');
  });
});

// ── text ─────────────────────────────────────────────────────────────────────

describe('renderText', () => {
  it('renders paragraph with data attributes', () => {
    const node: IRTextNode = {
      type: 'text', id: undefined, content: 'Info', weight: 'bold', intent: 'accent', children: [],
    };
    const result = renderText(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const p = container.querySelector('p');
    expect(p?.textContent).toBe('Info');
    expect(p?.getAttribute('data-weight')).toBe('bold');
    expect(p?.getAttribute('data-intent')).toBe('accent');
  });

  it('renders with id when present', () => {
    const node: IRTextNode = {
      type: 'text', id: 'intro', content: 'X', weight: 'normal', intent: 'default', children: [],
    };
    const result = renderText(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelector('p')?.id).toBe('intro');
  });
});

// ── input-text ────────────────────────────────────────────────────────────────

const baseInputText: IRInputTextNode = {
  type: 'input-text', id: 'name', label: 'Full Name',
  placeholder: undefined, required: false,
  minLength: undefined, maxLength: undefined, errors: [], children: [],
};

describe('renderInputText', () => {
  it('renders minimal input (no optional attrs, no errors)', () => {
    const result = renderInputText(baseInputText, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.id).toBe('name');
    expect(input.required).toBe(false);
    expect(input.placeholder).toBe('');
    expect(container.querySelector('.field-errors')).toBeNull();
  });

  it('renders full input (required, placeholder, minLength, maxLength, errors)', () => {
    const node: IRInputTextNode = {
      ...baseInputText, required: true,
      placeholder: 'Enter name', minLength: 2, maxLength: 50,
      errors: ['Too short', '<b>bad</b>'],
    };
    const result = renderInputText(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.placeholder).toBe('Enter name');
    expect(input.minLength).toBe(2);
    expect(input.maxLength).toBe(50);
    const errors = container.querySelectorAll('.field-error');
    expect(errors).toHaveLength(2);
    expect(errors[0]?.textContent).toBe('Too short');
    expect(errors[1]?.textContent).toBe('<b>bad</b>');
  });
});

// ── input-number ──────────────────────────────────────────────────────────────

const baseInputNumber: IRInputNumberNode = {
  type: 'input-number', id: 'age', label: 'Age',
  placeholder: undefined, required: false,
  min: undefined, max: undefined, errors: [], children: [],
};

describe('renderInputNumber', () => {
  it('renders minimal number input', () => {
    const result = renderInputNumber(baseInputNumber, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const input = container.querySelector('input[type="number"]');
    expect(input).not.toBeNull();
    expect(input?.getAttribute('min')).toBeNull();
    expect(container.querySelector('.field-errors')).toBeNull();
  });

  it('renders number input with min, max, required, placeholder, errors', () => {
    const node: IRInputNumberNode = {
      ...baseInputNumber, required: true, placeholder: '0-120',
      min: 0, max: 120, errors: ['Must be positive'],
    };
    const result = renderInputNumber(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.getAttribute('min')).toBe('0');
    expect(input.getAttribute('max')).toBe('120');
    expect(container.querySelectorAll('.field-error')).toHaveLength(1);
  });
});

// ── input-date ───────────────────────────────────────────────────────────────

const baseInputDate: IRInputDateNode = {
  type: 'input-date', id: 'dob', label: 'DOB',
  required: false, min: undefined, max: undefined, errors: [], children: [],
};

describe('renderInputDate', () => {
  it('renders minimal date input', () => {
    const result = renderInputDate(baseInputDate, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelector('input[type="date"]')).not.toBeNull();
    expect(container.querySelector('.field-errors')).toBeNull();
  });

  it('renders date input with required, min, max, errors', () => {
    const node: IRInputDateNode = {
      ...baseInputDate, required: true,
      min: '1900-01-01', max: '2099-12-31', errors: ['Invalid date'],
    };
    const result = renderInputDate(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.getAttribute('min')).toBe('1900-01-01');
    expect(input.getAttribute('max')).toBe('2099-12-31');
    expect(container.querySelectorAll('.field-error')).toHaveLength(1);
  });
});

// ── input-choice ──────────────────────────────────────────────────────────────

const baseInputChoice: IRInputChoiceNode = {
  type: 'input-choice', id: 'blood', label: 'Blood Type',
  required: false, multiple: false,
  options: [{ value: 'A+', label: 'A+' }, { value: 'O-', label: 'O-' }],
  errors: [], children: [],
};

describe('renderInputChoice', () => {
  it('renders select with options, not required, not multiple, no errors', () => {
    const result = renderInputChoice(baseInputChoice, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.required).toBe(false);
    expect(select.multiple).toBe(false);
    expect(select.options).toHaveLength(2);
    expect(select.options[0]?.value).toBe('A+');
    expect(container.querySelector('.field-errors')).toBeNull();
  });

  it('renders select with required, multiple, errors', () => {
    const node: IRInputChoiceNode = {
      ...baseInputChoice, required: true, multiple: true,
      errors: ['Select at least one'],
    };
    const result = renderInputChoice(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.required).toBe(true);
    expect(select.multiple).toBe(true);
    expect(container.querySelectorAll('.field-error')).toHaveLength(1);
  });
});

// ── submit ────────────────────────────────────────────────────────────────────

describe('renderSubmit', () => {
  it('renders submit button with route and label', () => {
    const node: IRSubmitNode = {
      type: 'submit', id: 'sub', label: 'Save & Go', route: '/api/save', context: {}, children: [],
    };
    const result = renderSubmit(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn.type).toBe('submit');
    expect(btn.id).toBe('sub');
    expect(btn.getAttribute('data-route')).toBe('/api/save');
    // React safely renders the & in text content
    expect(btn.textContent).toBe('Save & Go');
  });
});

// ── error-form ────────────────────────────────────────────────────────────────

describe('renderFormError', () => {
  it('renders alert div with form-level error message', () => {
    const node: IRFormErrorNode = {
      type: 'error-form', id: undefined, message: 'Submission failed <script>', children: [],
    };
    const result = renderFormError(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const div = container.querySelector('[role="alert"]') as HTMLElement;
    expect(div.className).toContain('error--form');
    expect(div.textContent).toBe('Submission failed <script>');
    expect(container.innerHTML).not.toContain('<script>');
  });
});

// ── error-field ───────────────────────────────────────────────────────────────

describe('renderFieldError', () => {
  it('renders field error with data-field-id', () => {
    const node: IRFieldErrorNode = {
      type: 'error-field', id: undefined,
      fieldId: 'first-name', message: 'Required', children: [],
    };
    const result = renderFieldError(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const div = container.querySelector('[role="alert"]') as HTMLElement;
    expect(div.getAttribute('data-field-id')).toBe('first-name');
    expect(div.className).toContain('error--field');
    expect(div.textContent).toBe('Required');
  });
});

// ── input-file ────────────────────────────────────────────────────────────────

const baseInputFile: IRInputFileNode = {
  type: 'input-file', id: 'doc', label: 'Upload Document',
  accept: undefined, multiple: false, required: false, errors: [], children: [],
};

describe('renderInputFile', () => {
  it('renders file input with label', () => {
    const result = renderInputFile(baseInputFile, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
    expect(container.querySelector('label')?.textContent).toBe('Upload Document');
  });

  it('sets accept and multiple attributes', () => {
    const node: IRInputFileNode = { ...baseInputFile, accept: '.pdf,.doc', multiple: true };
    const result = renderInputFile(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.accept).toBe('.pdf,.doc');
    expect(input.multiple).toBe(true);
  });

  it('renders errors', () => {
    const node: IRInputFileNode = { ...baseInputFile, errors: ['File too large'] };
    const result = renderInputFile(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelectorAll('.field-error')).toHaveLength(1);
    expect(container.querySelector('.field-error')?.textContent).toBe('File too large');
  });
});

// ── signature ─────────────────────────────────────────────────────────────────

const baseSignature: IRSignatureNode = {
  type: 'signature', id: 'sig', label: 'Sign Here',
  required: false, errors: [], children: [],
};

describe('renderSignature', () => {
  it('renders canvas with data-signature attribute', () => {
    const result = renderSignature(baseSignature, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).not.toBeNull();
    expect(canvas.hasAttribute('data-signature')).toBe(true);
    expect(canvas.id).toBe('sig');
  });

  it('renders errors', () => {
    const node: IRSignatureNode = { ...baseSignature, errors: ['Signature required'] };
    const result = renderSignature(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelectorAll('.field-error')).toHaveLength(1);
  });
});

// ── custom ────────────────────────────────────────────────────────────────────

const baseCustom: IRCustomNode = {
  type: 'custom', id: 'widget-1', kind: 'rating-stars',
  label: 'Rate your experience', props: { maxStars: 5 },
  errors: [], children: [],
};

describe('renderCustom', () => {
  it('renders div with data-custom-kind', () => {
    const result = renderCustom(baseCustom, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const div = container.querySelector('[data-custom-kind]') as HTMLElement;
    expect(div).not.toBeNull();
    expect(div.getAttribute('data-custom-kind')).toBe('rating-stars');
    expect(div.getAttribute('aria-label')).toBe('Rate your experience');
  });

  it('omits aria-label when label is undefined', () => {
    const node: IRCustomNode = { ...baseCustom, label: undefined };
    const result = renderCustom(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect((container.firstElementChild as HTMLElement).hasAttribute('aria-label')).toBe(false);
  });

  it('renders children', () => {
    const ctx: ReactRendererContext = {
      renderChildren: (_) => ok([<span key="c">child content</span>]),
    };
    const result = renderCustom(baseCustom, ctx);
    if (!isOk(result)) return;
    const { getByText } = render(result.value);
    expect(getByText('child content')).toBeTruthy();
  });

  it('propagates renderChildren error', () => {
    const result = renderCustom(baseCustom, failCtx);
    expect(isErr(result)).toBe(true);
  });
});

// ── repeat ────────────────────────────────────────────────────────────────────

function makeRepeatItem(index: number): IRRepeatItemNode {
  return { type: 'repeat-item', index, children: [] };
}

const baseRepeat: IRRepeatNode = {
  type: 'repeat', id: 'medications', label: 'Medications',
  minItems: 1, maxItems: 5,
  addLabel: 'Add medication', removeLabel: 'Remove',
  items: [makeRepeatItem(0), makeRepeatItem(1)],
  errors: [], children: [],
};

describe('renderRepeat', () => {
  it('renders a fieldset per item', () => {
    const result = renderRepeat(baseRepeat, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelectorAll('fieldset')).toHaveLength(2);
  });

  it('each fieldset has data-repeat-item index', () => {
    const result = renderRepeat(baseRepeat, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const sets = container.querySelectorAll('fieldset');
    expect(sets[0]?.getAttribute('data-repeat-item')).toBe('0');
    expect(sets[1]?.getAttribute('data-repeat-item')).toBe('1');
  });

  it('renders add button when under maxItems', () => {
    const result = renderRepeat(baseRepeat, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    const addBtn = container.querySelector('[data-action="repeat-add"]') as HTMLButtonElement;
    expect(addBtn).not.toBeNull();
    expect(addBtn.textContent).toBe('Add medication');
  });

  it('hides add button when at maxItems', () => {
    const node: IRRepeatNode = {
      ...baseRepeat, maxItems: 2,
    };
    const result = renderRepeat(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelector('[data-action="repeat-add"]')).toBeNull();
  });

  it('shows remove button when above minItems', () => {
    const result = renderRepeat(baseRepeat, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    // 2 items, minItems=1, so remove buttons should appear
    expect(container.querySelectorAll('[data-action="repeat-remove"]')).toHaveLength(2);
  });

  it('hides remove button when at minItems', () => {
    const node: IRRepeatNode = { ...baseRepeat, items: [makeRepeatItem(0)], minItems: 1 };
    const result = renderRepeat(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelector('[data-action="repeat-remove"]')).toBeNull();
  });

  it('propagates item renderChildren error', () => {
    const result = renderRepeat(baseRepeat, failCtx);
    expect(isErr(result)).toBe(true);
  });

  it('renders errors', () => {
    const node: IRRepeatNode = { ...baseRepeat, errors: ['At least one item required'] };
    const result = renderRepeat(node, noopCtx);
    if (!isOk(result)) return;
    const { container } = render(result.value);
    expect(container.querySelectorAll('.field-error')).toHaveLength(1);
  });
});
