import { describe, it, expect } from 'vitest';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument } from '@renderly/html';
import { localizeDocument } from '../../src/index.js';
import type { LocaleMap } from '../../src/index.js';

const FORM_JSON = JSON.stringify({
  version: '1.0',
  title: 'Sign Up',
  elements: [
    { type: 'heading', id: 'h1', level: 1, text: 'Sign Up' },
    { type: 'input', kind: 'text', id: 'email', label: 'Email', placeholder: 'you@example.com' },
    { type: 'submit', id: 'go', label: 'Submit', route: '/api/signup' },
  ],
});

const LOCALES: LocaleMap = {
  es: {
    'form.title': 'Regístrate',
    'heading.h1.text': 'Regístrate',
    'email.label': 'Correo electrónico',
    'email.placeholder': 'tu@ejemplo.com',
    'submit.go.label': 'Enviar',
  },
};

describe('i18n e2e — parseDocument → localizeDocument → walk → renderDocument(html)', () => {
  it('flows Spanish translations all the way into the rendered HTML', () => {
    const parsed = parseDocument(FORM_JSON);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const localized = localizeDocument(parsed.value, LOCALES, 'es');
    expect(localized.title).toBe('Regístrate');

    const walked = walk(localized, createDefaultRegistry());
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const rendered = renderDocument(walked.value);
    expect(rendered.ok).toBe(true);
    if (!rendered.ok) return;

    expect(rendered.value).toContain('Regístrate');
    expect(rendered.value).toContain('Correo electrónico');
    expect(rendered.value).toContain('tu@ejemplo.com');
    expect(rendered.value).toContain('Enviar');
    expect(rendered.value).not.toContain('Sign Up');
    expect(rendered.value).not.toContain('Submit');
  });

  it('falls back to the original English strings for an unknown locale, still rendering correctly', () => {
    const parsed = parseDocument(FORM_JSON);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const localized = localizeDocument(parsed.value, LOCALES, 'fr');
    const walked = walk(localized, createDefaultRegistry());
    expect(walked.ok).toBe(true);
    if (!walked.ok) return;

    const rendered = renderDocument(walked.value);
    expect(rendered.ok).toBe(true);
    if (!rendered.ok) return;
    expect(rendered.value).toContain('Sign Up');
    expect(rendered.value).toContain('Submit');
  });
});
