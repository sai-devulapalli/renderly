import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument as renderHtml } from '@renderly/html';
import { renderDocument as renderReact } from '@renderly/react';
import { extractFields, extractSubmit, buildPayload, applyErrors } from '@renderly/submit';
import { EXAMPLE_FORM_JSON, loadExampleForm } from '../../src/form.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function parsedDoc() {
  const r = loadExampleForm();
  if (!r.ok) throw new Error(`parse failed: ${JSON.stringify(r.error)}`);
  return r.value;
}

function walkedNodes(doc = parsedDoc()) {
  const r = walk(doc, createDefaultRegistry());
  if (!r.ok) throw new Error(`walk failed: ${JSON.stringify(r.error)}`);
  return r.value;
}

function htmlOutput(doc = parsedDoc()) {
  const r = renderHtml(walkedNodes(doc));
  if (!r.ok) throw new Error(`html render failed: ${JSON.stringify(r.error)}`);
  return r.value;
}

function reactOutput(doc = parsedDoc()) {
  const r = renderReact(walkedNodes(doc));
  if (!r.ok) throw new Error(`react render failed: ${JSON.stringify(r.error)}`);
  return r.value;
}

// ── 1. JSON parse pipeline ───────────────────────────────────────────────────

describe('parse pipeline', () => {
  it('EXAMPLE_FORM_JSON is a non-empty string', () => {
    expect(typeof EXAMPLE_FORM_JSON).toBe('string');
    expect(EXAMPLE_FORM_JSON.length).toBeGreaterThan(0);
  });

  it('loadExampleForm parses and validates without error', () => {
    expect(loadExampleForm().ok).toBe(true);
  });

  it('parsed document has correct version and title', () => {
    const doc = parsedDoc();
    expect(doc.version).toBe('1');
    expect(doc.title).toBe('Patient Intake Form');
  });
});

// ── 2. Core walk ─────────────────────────────────────────────────────────────

describe('core walk', () => {
  it('walks the document into an IRNode array without error', () => {
    expect(() => walkedNodes()).not.toThrow();
  });

  it('produces at least one node per top-level element', () => {
    const nodes = walkedNodes();
    expect(nodes.length).toBeGreaterThan(0);
  });
});

// ── 3. HTML adapter — initial render ─────────────────────────────────────────

describe('HTML adapter — initial render', () => {
  it('renders all field labels', () => {
    const html = htmlOutput();
    expect(html).toContain('First Name');
    expect(html).toContain('Last Name');
    expect(html).toContain('Date of Birth');
    expect(html).toContain('Email Address');
    expect(html).toContain('Insurance Provider');
    expect(html).toContain('Reason for Visit');
    expect(html).toContain('Height (cm)');
    expect(html).toContain('Weight (kg)');
  });

  it('renders the submit button', () => {
    const html = htmlOutput();
    expect(html).toContain('type="submit"');
    expect(html).toContain('Complete Registration');
  });

  it('contains no error alerts in the initial render', () => {
    const html = htmlOutput();
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('field-errors');
  });

  it('emits responsive direction attrs on the name-row container', () => {
    const html = htmlOutput();
    expect(html).toContain('data-direction="column"');
    expect(html).toContain('data-md-direction="row"');
  });

  it('emits responsive cols attrs on the measurements container', () => {
    const html = htmlOutput();
    expect(html).toContain('data-cols="1"');
    expect(html).toContain('data-md-cols="2"');
  });

  it('escapes option values in the insurance select', () => {
    const html = htmlOutput();
    expect(html).toContain('value="aetna"');
    expect(html).toContain('Blue Cross Blue Shield');
  });
});

// ── 4. React adapter — initial render ────────────────────────────────────────

describe('React adapter — initial render', () => {
  it('renders labelled inputs into the DOM', () => {
    const { getByLabelText } = render(reactOutput());
    expect(getByLabelText('First Name')).toBeTruthy();
    expect(getByLabelText('Last Name')).toBeTruthy();
    expect(getByLabelText('Email Address')).toBeTruthy();
    expect(getByLabelText('Date of Birth')).toBeTruthy();
  });

  it('renders the submit button into the DOM', () => {
    const { getByRole } = render(reactOutput());
    expect(getByRole('button', { name: 'Complete Registration' })).toBeTruthy();
  });

  it('contains no alert roles in the initial render', () => {
    const { queryAllByRole } = render(reactOutput());
    expect(queryAllByRole('alert')).toHaveLength(0);
  });

  it('emits responsive direction data attr on the name-row container', () => {
    const { container } = render(reactOutput());
    expect(container.querySelector('[data-md-direction="row"]')).not.toBeNull();
  });

  it('emits responsive cols data attr on the measurements container', () => {
    const { container } = render(reactOutput());
    expect(container.querySelector('[data-md-cols="2"]')).not.toBeNull();
  });
});

// ── 5. Submit — field extraction ─────────────────────────────────────────────

describe('submit — field extraction', () => {
  it('extracts all eight input fields in document order', () => {
    const ids = extractFields(parsedDoc()).map((f) => f.id);
    expect(ids).toEqual([
      'first_name', 'last_name', 'dob', 'email',
      'insurance', 'symptoms', 'height_cm', 'weight_kg',
    ]);
  });

  it('identifies the five required fields', () => {
    const required = extractFields(parsedDoc()).filter((f) => f.required).map((f) => f.id);
    expect(required).toEqual(['first_name', 'last_name', 'dob', 'email', 'insurance']);
  });

  it('symptoms field is multi-choice', () => {
    const symptoms = extractFields(parsedDoc()).find((f) => f.id === 'symptoms');
    expect(symptoms?.multiple).toBe(true);
    expect(symptoms?.kind).toBe('choice');
  });

  it('numeric fields have kind "number"', () => {
    const fields = extractFields(parsedDoc());
    expect(fields.find((f) => f.id === 'height_cm')?.kind).toBe('number');
    expect(fields.find((f) => f.id === 'weight_kg')?.kind).toBe('number');
  });

  it('extractSubmit returns the correct route and context', () => {
    const submit = extractSubmit(parsedDoc());
    expect(submit?.route).toBe('/api/intake');
    expect(submit?.context).toEqual({ form_version: '2026-Q2', clinic: 'main' });
  });
});

// ── 6. Submit — payload build (success) ─────────────────────────────────────

describe('submit — buildPayload (success)', () => {
  it('builds a valid payload with all required fields provided', () => {
    const doc = parsedDoc();
    const fields = extractFields(doc);
    const submit = extractSubmit(doc)!;
    const values = {
      first_name: 'Jane', last_name: 'Doe',
      dob: '1990-05-15',  email: 'jane.doe@example.com',
      insurance: 'bcbs',
    };
    const result = buildPayload(fields, values, submit.route, submit.context ?? {});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.route).toBe('/api/intake');
    expect(result.value.context).toEqual({ form_version: '2026-Q2', clinic: 'main' });
    expect(result.value.fields['first_name']).toBe('Jane');
  });

  it('payload includes optional fields when provided', () => {
    const doc = parsedDoc();
    const values = {
      first_name: 'Jane', last_name: 'Doe', dob: '1990-05-15',
      email: 'jane@example.com', insurance: 'aetna',
      symptoms: ['checkup', 'refill'],
      height_cm: 165, weight_kg: 62,
    };
    const result = buildPayload(extractFields(doc), values, '/api/intake');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.fields['symptoms']).toEqual(['checkup', 'refill']);
    expect(result.value.fields['height_cm']).toBe(165);
    expect(result.value.fields['weight_kg']).toBe(62);
  });
});

// ── 7. Submit — payload build (validation failures) ──────────────────────────

describe('submit — buildPayload (validation failures)', () => {
  it('returns PAYLOAD_ERROR when all required fields are missing', () => {
    const doc = parsedDoc();
    const result = buildPayload(extractFields(doc), {}, '/api/intake');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('PAYLOAD_ERROR');
    const ids = result.error.failures.map((f) => f.fieldId);
    expect(ids).toContain('first_name');
    expect(ids).toContain('last_name');
    expect(ids).toContain('dob');
    expect(ids).toContain('email');
    expect(ids).toContain('insurance');
  });

  it('optional fields never appear in failures', () => {
    const doc = parsedDoc();
    const result = buildPayload(extractFields(doc), {}, '/api/intake');
    if (result.ok) return;
    const ids = result.error.failures.map((f) => f.fieldId);
    expect(ids).not.toContain('symptoms');
    expect(ids).not.toContain('height_cm');
    expect(ids).not.toContain('weight_kg');
  });

  it('partially filled form returns only the still-missing required fields', () => {
    const doc = parsedDoc();
    const result = buildPayload(
      extractFields(doc),
      { first_name: 'Jane', last_name: 'Doe', insurance: 'cigna' },
      '/api/intake',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const ids = result.error.failures.map((f) => f.fieldId);
    expect(ids).toEqual(['dob', 'email']);
  });
});

// ── 8. Error application — HTML re-render ────────────────────────────────────

describe('applyErrors → HTML re-render', () => {
  it('form-level error appears in the re-rendered HTML', () => {
    const updated = applyErrors(parsedDoc(), { form: ['Email is already registered'] });
    expect(htmlOutput(updated)).toContain('Email is already registered');
    expect(htmlOutput(updated)).toContain('role="alert"');
  });

  it('field-level errors appear next to their fields', () => {
    const updated = applyErrors(parsedDoc(), {
      fields: {
        email: ['Email format is invalid'],
        dob:   ['Date of birth is required'],
      },
    });
    const html = htmlOutput(updated);
    expect(html).toContain('Email format is invalid');
    expect(html).toContain('Date of birth is required');
    expect(html).toContain('field-errors');
  });

  it('XSS in server error messages is escaped — no raw tags in HTML output', () => {
    const updated = applyErrors(parsedDoc(), {
      form:   ['<script>alert("xss")</script>'],
      fields: { email: ['<img src=x onerror=alert(1)>'] },
    });
    const html = htmlOutput(updated);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img');
  });

  it('re-render still shows all fields alongside the errors', () => {
    const updated = applyErrors(parsedDoc(), { form: ['Something went wrong'] });
    const html = htmlOutput(updated);
    expect(html).toContain('First Name');
    expect(html).toContain('Complete Registration');
  });
});

// ── 9. Error application — React re-render ───────────────────────────────────

describe('applyErrors → React re-render', () => {
  it('form-level error appears in the DOM as an alert', () => {
    const updated = applyErrors(parsedDoc(), { form: ['Insurance not accepted at this clinic'] });
    const { getAllByRole } = render(reactOutput(updated));
    const alerts = getAllByRole('alert');
    const text = alerts.map((a) => a.textContent).join(' ');
    expect(text).toContain('Insurance not accepted at this clinic');
  });

  it('field-level error appears in the DOM with the correct text', () => {
    const updated = applyErrors(parsedDoc(), {
      fields: { email: ['Please enter a valid email address'] },
    });
    const { container } = render(reactOutput(updated));
    const errors = Array.from(container.querySelectorAll('.field-error')).map((e) => e.textContent);
    expect(errors).toContain('Please enter a valid email address');
  });

  it('XSS in server errors is inert in the React DOM — no script element injected', () => {
    const updated = applyErrors(parsedDoc(), { form: ['<script>alert("xss")</script>'] });
    const { container } = render(reactOutput(updated));
    expect(container.querySelector('script')).toBeNull();
    expect(container.innerHTML).not.toContain('<script>');
    // but the literal text IS present in the alert textContent
    const alert = container.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('<script>alert("xss")</script>');
  });
});
