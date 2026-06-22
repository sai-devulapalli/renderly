import { describe, it, expect } from 'vitest';
import type { Document } from '@renderly/schema';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument } from '@renderly/html';
import { extractFields, extractSubmit, buildPayload, applyErrors } from '../../src/index.js';

/**
 * End-to-end tests: a real form document passes through core walker → HTML
 * adapter, then through the submit module's full lifecycle — field extraction,
 * payload assembly, error application, and re-render — without any mocking.
 */

const FORM_DOC: Document = {
  version: '1',
  title: 'Registration',
  elements: [
    { type: 'input', kind: 'text', id: 'username', label: 'Username', required: true },
    { type: 'input', kind: 'text', id: 'email', label: 'Email', required: true },
    { type: 'input', kind: 'text', id: 'bio', label: 'Bio' },
    {
      type: 'input', kind: 'choice', id: 'role', label: 'Role',
      required: true,
      options: [
        { value: 'viewer', label: 'Viewer' },
        { value: 'editor', label: 'Editor' },
      ],
    },
    {
      type: 'submit', id: 'reg-submit', label: 'Register',
      route: '/api/register',
      context: { csrf: 'tok123' },
    },
  ],
};

describe('e2e: initial render', () => {
  it('walks and renders the form without errors', () => {
    const registry = createDefaultRegistry();
    const walkResult = walk(FORM_DOC, registry);
    expect(walkResult.ok).toBe(true);

    if (walkResult.ok) {
      const renderResult = renderDocument(walkResult.value);
      expect(renderResult.ok).toBe(true);
      if (renderResult.ok) {
        expect(renderResult.value).toContain('Username');
        expect(renderResult.value).toContain('Email');
        expect(renderResult.value).toContain('Register');
      }
    }
  });
});

describe('e2e: submit flow — success path', () => {
  it('builds a valid payload from extracted fields and submit element', () => {
    const fields = extractFields(FORM_DOC);
    const submit = extractSubmit(FORM_DOC)!;

    expect(submit).toBeDefined();
    expect(submit.route).toBe('/api/register');

    const values = { username: 'alice', email: 'alice@example.com', role: 'editor' };
    const result = buildPayload(fields, values, submit.route, submit.context ?? {});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.route).toBe('/api/register');
      expect(result.value.context).toEqual({ csrf: 'tok123' });
      expect(result.value.fields['username']).toBe('alice');
      expect(result.value.fields['email']).toBe('alice@example.com');
    }
  });
});

describe('e2e: submit flow — error path', () => {
  it('fails validation when required fields are missing', () => {
    const fields = extractFields(FORM_DOC);
    const submit = extractSubmit(FORM_DOC)!;
    // email and role missing
    const result = buildPayload(fields, { username: 'bob' }, submit.route);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const ids = result.error.failures.map((f) => f.fieldId);
      expect(ids).toContain('email');
      expect(ids).toContain('role');
      expect(ids).not.toContain('username');
    }
  });

  it('re-renders the form with server errors after applyErrors', () => {
    const serverErrors = {
      form: ['Username already taken'],
      fields: { email: ['Invalid email address'] },
    };
    const updatedDoc = applyErrors(FORM_DOC, serverErrors);

    const registry = createDefaultRegistry();
    const walkResult = walk(updatedDoc, registry);
    expect(walkResult.ok).toBe(true);

    if (walkResult.ok) {
      const renderResult = renderDocument(walkResult.value);
      expect(renderResult.ok).toBe(true);
      if (renderResult.ok) {
        expect(renderResult.value).toContain('Username already taken');
        expect(renderResult.value).toContain('Invalid email address');
      }
    }
  });

  it('escaped XSS in server error messages before output', () => {
    const maliciousErrors = {
      form: ['<script>alert(1)</script>'],
      fields: { username: ['<img src=x onerror=alert(1)>'] },
    };
    const updatedDoc = applyErrors(FORM_DOC, maliciousErrors);

    const registry = createDefaultRegistry();
    const walkResult = walk(updatedDoc, registry);
    if (walkResult.ok) {
      const renderResult = renderDocument(walkResult.value);
      if (renderResult.ok) {
        expect(renderResult.value).not.toContain('<script>');
        expect(renderResult.value).not.toContain('<img');
        expect(renderResult.value).toContain('&lt;script&gt;');
        expect(renderResult.value).toContain('&lt;img');
      }
    }
  });
});
