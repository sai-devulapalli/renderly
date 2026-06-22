import { describe, it, expect } from 'vitest';
import type { Document } from '@renderly/schema';
import { extractFields, extractSubmit } from '../../src/extract.js';
import { buildPayload } from '../../src/build.js';
import { applyErrors } from '../../src/apply.js';

/**
 * Functional tests: the submit module's public API working together on a
 * realistic multi-element document. Each test exercises a meaningful user
 * scenario rather than an isolated unit.
 */

const REALISTIC_DOC: Document = {
  version: '1',
  title: 'Contact Us',
  elements: [
    { type: 'heading', level: 1, text: 'Contact Us' },
    { type: 'text', content: 'Fill out the form below.' },
    {
      type: 'container',
      direction: 'row',
      children: [
        { type: 'input', kind: 'text', id: 'first_name', label: 'First Name', required: true },
        { type: 'input', kind: 'text', id: 'last_name', label: 'Last Name', required: true },
      ],
    },
    { type: 'input', kind: 'text', id: 'email', label: 'Email', required: true },
    { type: 'input', kind: 'text', id: 'subject', label: 'Subject' },
    {
      type: 'input', kind: 'choice', id: 'category', label: 'Category',
      required: true,
      options: [
        { value: 'support', label: 'Support' },
        { value: 'sales', label: 'Sales' },
      ],
    },
    {
      type: 'input', kind: 'choice', id: 'tags', label: 'Tags',
      multiple: true,
      options: [
        { value: 'urgent', label: 'Urgent' },
        { value: 'followup', label: 'Follow-up' },
      ],
    },
    { type: 'submit', id: 'submit', label: 'Send', route: '/api/contact', context: { version: 2 } },
  ],
};

describe('extract + build: happy path', () => {
  it('extracts the correct number of fields from a nested document', () => {
    const fields = extractFields(REALISTIC_DOC);
    // first_name, last_name, email, subject, category, tags = 6
    expect(fields).toHaveLength(6);
  });

  it('extracts fields in document order including those in containers', () => {
    const ids = extractFields(REALISTIC_DOC).map((f) => f.id);
    expect(ids).toEqual(['first_name', 'last_name', 'email', 'subject', 'category', 'tags']);
  });

  it('correctly identifies required vs optional fields', () => {
    const fields = extractFields(REALISTIC_DOC);
    const required = fields.filter((f) => f.required).map((f) => f.id);
    const optional = fields.filter((f) => !f.required).map((f) => f.id);
    expect(required).toEqual(['first_name', 'last_name', 'email', 'category']);
    expect(optional).toEqual(['subject', 'tags']);
  });

  it('correctly identifies multiple:true only for multi-choice fields', () => {
    const fields = extractFields(REALISTIC_DOC);
    const tagsField = fields.find((f) => f.id === 'tags');
    const categoryField = fields.find((f) => f.id === 'category');
    expect(tagsField?.multiple).toBe(true);
    expect(categoryField?.multiple).toBe(false);
  });

  it('extracts the submit element with correct route and context', () => {
    const submit = extractSubmit(REALISTIC_DOC);
    expect(submit).toBeDefined();
    expect(submit?.route).toBe('/api/contact');
    expect(submit?.context).toEqual({ version: 2 });
  });

  it('builds a valid payload when all required fields are provided', () => {
    const fields = extractFields(REALISTIC_DOC);
    const submit = extractSubmit(REALISTIC_DOC)!;
    const values = {
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice@example.com',
      category: 'support',
    };
    const result = buildPayload(fields, values, submit.route, submit.context ?? {});
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.route).toBe('/api/contact');
      expect(result.value.context).toEqual({ version: 2 });
      expect(result.value.fields['email']).toBe('alice@example.com');
    }
  });
});

describe('extract + build: validation failures', () => {
  it('returns failures for every missing required field', () => {
    const fields = extractFields(REALISTIC_DOC);
    const submit = extractSubmit(REALISTIC_DOC)!;
    // Provide only last_name — first_name, email, category are missing
    const result = buildPayload(fields, { last_name: 'Smith' }, submit.route);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const failedIds = result.error.failures.map((f) => f.fieldId);
      expect(failedIds).toContain('first_name');
      expect(failedIds).toContain('email');
      expect(failedIds).toContain('category');
      expect(failedIds).not.toContain('last_name');
      expect(failedIds).not.toContain('subject');
      expect(failedIds).not.toContain('tags');
    }
  });

  it('does not count optional missing fields as errors', () => {
    const fields = extractFields(REALISTIC_DOC);
    const submit = extractSubmit(REALISTIC_DOC)!;
    const values = {
      first_name: 'Bob',
      last_name: 'Jones',
      email: 'bob@example.com',
      category: 'sales',
      // subject and tags omitted — both optional
    };
    const result = buildPayload(fields, values, submit.route);
    expect(result.ok).toBe(true);
  });
});

describe('applyErrors: round-trip error state', () => {
  it('returns a document with field errors that can be queried by id', () => {
    const errors = {
      fields: {
        email: ['Email is already registered'],
        first_name: ['Must be at least 2 characters'],
      },
    };
    const updated = applyErrors(REALISTIC_DOC, errors);
    expect(updated.errors?.fields?.['email']).toEqual(['Email is already registered']);
    expect(updated.errors?.fields?.['first_name']).toEqual(['Must be at least 2 characters']);
  });

  it('preserves the original document — applyErrors returns a new object', () => {
    const errors = { form: ['Something broke'] };
    applyErrors(REALISTIC_DOC, errors);
    expect(REALISTIC_DOC.errors).toBeUndefined();
  });

  it('adds form-level errors for non-field failures', () => {
    const errors = { form: ['CSRF token expired'] };
    const updated = applyErrors(REALISTIC_DOC, errors);
    expect(updated.errors?.form).toEqual(['CSRF token expired']);
  });
});
