import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RenderlyFormElement } from '../../src/element.js';

// Register once for the test suite
if (!customElements.get('renderly-form')) {
  customElements.define('renderly-form', RenderlyFormElement);
}

const SIMPLE_SCHEMA = JSON.stringify({
  version: '1.0',
  elements: [
    { type: 'heading', level: 1, text: 'Sign Up' },
    { type: 'input', kind: 'text', id: 'email', label: 'Email', required: true },
    { type: 'input', kind: 'choice', id: 'role', label: 'Role',
      options: [{ value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' }] },
    { type: 'submit', id: 'sub', label: 'Submit', route: '/api/signup' },
  ],
});

const INVALID_JSON = '{ not valid json }';

const SCHEMA_WITH_ERRORS = JSON.stringify({
  version: '1.0',
  elements: [
    { type: 'input', kind: 'text', id: 'email', label: 'Email', required: true },
    { type: 'submit', id: 'sub', label: 'Submit', route: '/api' },
  ],
  errors: {
    form: ['Submission failed — please review.'],
    fields: { email: ['Email is required'] },
  },
});

function mount(attrs: Record<string, string> = {}): RenderlyFormElement {
  const el = document.createElement('renderly-form') as RenderlyFormElement;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

function unmount(el: RenderlyFormElement) {
  el.remove();
}

describe('RenderlyFormElement — registration', () => {
  it('is registered as renderly-form', () => {
    expect(customElements.get('renderly-form')).toBe(RenderlyFormElement);
  });

  it('instanceof HTMLElement', () => {
    const el = mount();
    expect(el instanceof HTMLElement).toBe(true);
    unmount(el);
  });
});

describe('RenderlyFormElement — rendering', () => {
  let el: RenderlyFormElement;

  beforeEach(() => { el = mount({ schema: SIMPLE_SCHEMA }); });
  afterEach(() => unmount(el));

  it('renders a heading from schema', () => {
    expect(el.innerHTML).toContain('Sign Up');
  });

  it('renders text input for the email field', () => {
    expect(el.innerHTML).toContain('type="text"');
    expect(el.innerHTML).toContain('name="email"');
  });

  it('renders radio inputs for choice field', () => {
    expect(el.innerHTML).toContain('type="radio"');
    expect(el.innerHTML).toContain('name="role"');
  });

  it('renders a submit button', () => {
    expect(el.innerHTML).toContain('Submit');
  });

  it('wraps content in a <form>', () => {
    expect(el.querySelector('form')).not.toBeNull();
  });
});

describe('RenderlyFormElement — schema property', () => {
  let el: RenderlyFormElement;
  afterEach(() => unmount(el));

  it('accepts schema as an attribute', () => {
    el = mount({ schema: SIMPLE_SCHEMA });
    expect(el.innerHTML).toContain('Sign Up');
  });

  it('accepts schema as a string property', () => {
    el = mount();
    el.schema = SIMPLE_SCHEMA;
    expect(el.innerHTML).toContain('Sign Up');
  });

  it('accepts schema as an object property', () => {
    el = mount();
    el.schema = JSON.parse(SIMPLE_SCHEMA);
    expect(el.innerHTML).toContain('Sign Up');
  });

  it('clears rendered content when schema attribute is removed', () => {
    el = mount({ schema: SIMPLE_SCHEMA });
    el.removeAttribute('schema');
    // Container div stays in the DOM but its content is wiped
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('h1')).toBeNull();
  });
});

describe('RenderlyFormElement — values', () => {
  let el: RenderlyFormElement;

  beforeEach(() => { el = mount({ schema: SIMPLE_SCHEMA }); });
  afterEach(() => unmount(el));

  it('re-renders when values are updated', () => {
    // IRInputTextNode does not carry a value field through the IR, so
    // text input pre-fill is not supported yet. Choice inputs (radio/checkbox)
    // do carry value and update the checked attribute — verified separately.
    const before = el.innerHTML;
    el.values = { role: 'admin' };
    expect(el.innerHTML).not.toBe(before);
  });

  it('marks matching radio option as checked', () => {
    el.values = { role: 'admin' };
    const adminInput = el.querySelector('input[value="admin"]') as HTMLInputElement;
    expect(adminInput?.checked).toBe(true);
  });

  it('getter returns the last set values', () => {
    el.values = { email: 'a@b.com' };
    expect(el.values).toEqual({ email: 'a@b.com' });
  });
});

describe('RenderlyFormElement — errors', () => {
  let el: RenderlyFormElement;
  afterEach(() => unmount(el));

  it('renders form-level errors from schema', () => {
    el = mount({ schema: SCHEMA_WITH_ERRORS });
    expect(el.innerHTML).toContain('Submission failed');
  });

  it('renders field-level errors from schema', () => {
    el = mount({ schema: SCHEMA_WITH_ERRORS });
    expect(el.innerHTML).toContain('Email is required');
  });

  it('renders errors injected via .errors property', () => {
    el = mount({ schema: SIMPLE_SCHEMA });
    el.errors = { form: ['Server error'], fields: { email: ['Invalid email'] } };
    expect(el.innerHTML).toContain('Server error');
    expect(el.innerHTML).toContain('Invalid email');
  });

  it('clears errors when .errors is set to null', () => {
    el = mount({ schema: SIMPLE_SCHEMA });
    el.errors = { form: ['Server error'], fields: {} };
    el.errors = null;
    expect(el.innerHTML).not.toContain('Server error');
  });
});

describe('RenderlyFormElement — renderly-submit event', () => {
  let el: RenderlyFormElement;

  beforeEach(() => { el = mount({ schema: SIMPLE_SCHEMA }); });
  afterEach(() => unmount(el));

  it('dispatches renderly-submit when form is submitted', () => {
    return new Promise<void>((resolve) => {
      el.addEventListener('renderly-submit', (e) => {
        expect((e as CustomEvent).detail).toHaveProperty('values');
        resolve();
      });
      el.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }));
    });
  });

  it('submit detail contains field values typed into the form', () => {
    return new Promise<void>((resolve) => {
      const input = el.querySelector('input[name="email"]') as HTMLInputElement;
      input.value = 'jane@example.com';

      el.addEventListener('renderly-submit', (e) => {
        const { values } = (e as CustomEvent<{ values: Record<string, unknown> }>).detail;
        expect(values['email']).toBe('jane@example.com');
        resolve();
      });

      el.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }));
    });
  });

  it('does not navigate (submit is prevented)', () => {
    let defaultPrevented = false;
    const form = el.querySelector('form')!;
    form.addEventListener('submit', (e) => { defaultPrevented = e.defaultPrevented; });
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(defaultPrevented).toBe(true);
  });
});

describe('RenderlyFormElement — renderly-error event', () => {
  it('dispatches renderly-error for invalid JSON schema', () => {
    return new Promise<void>((resolve) => {
      const el = mount();
      el.addEventListener('renderly-error', (e) => {
        expect((e as CustomEvent).detail.code).toBe('PARSE_ERROR');
        unmount(el);
        resolve();
      });
      el.setAttribute('schema', INVALID_JSON);
    });
  });
});
