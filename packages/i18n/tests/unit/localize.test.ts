import { describe, it, expect } from 'vitest';
import type { Document } from '@renderly/schema';
import type { LocaleMap } from '../../src/types.js';
import { localizeDocument, localizeErrors, resolve } from '../../src/index.js';

// ── resolve ───────────────────────────────────────────────────────────────────

describe('resolve', () => {
  const map: LocaleMap = {
    en: { 'name.label': 'Full Name', 'name.placeholder': 'Enter your name' },
    es: { 'name.label': 'Nombre Completo' },
  };

  it('returns the translation when key exists', () => {
    expect(resolve(map, 'en', 'name.label', 'Full Name')).toBe('Full Name');
  });

  it('returns fallback string when key is missing from locale', () => {
    expect(resolve(map, 'en', 'missing.key', 'Default')).toBe('Default');
  });

  it('returns fallback string when locale is unknown', () => {
    expect(resolve(map, 'fr', 'name.label', 'Full Name')).toBe('Full Name');
  });

  it('uses fallbackLocale when primary locale is missing the key', () => {
    // es has 'name.label' but not 'name.placeholder' — fall back to en
    expect(resolve(map, 'es', 'name.placeholder', 'Enter name', { fallbackLocale: 'en' }))
      .toBe('Enter your name');
  });

  it('does not use fallbackLocale when primary locale has the key', () => {
    expect(resolve(map, 'es', 'name.label', 'X', { fallbackLocale: 'en' }))
      .toBe('Nombre Completo');
  });
});

// ── localizeDocument — labels ─────────────────────────────────────────────────

describe('localizeDocument — input labels', () => {
  const doc: Document = {
    version: '1',
    elements: [
      { type: 'input', kind: 'text', id: 'full_name', label: 'Full Name', placeholder: 'Enter name' },
      { type: 'input', kind: 'number', id: 'age', label: 'Age' },
      { type: 'submit', id: 's', label: 'Submit', route: '/api' },
    ],
  };

  const map: LocaleMap = {
    es: {
      'full_name.label':       'Nombre Completo',
      'full_name.placeholder': 'Escribe tu nombre',
      'age.label':             'Edad',
      'submit.s.label':        'Enviar',
    },
  };

  it('localizes text input label and placeholder', () => {
    const localized = localizeDocument(doc, map, 'es');
    const el = localized.elements[0] as { label: string; placeholder?: string };
    expect(el.label).toBe('Nombre Completo');
    expect(el.placeholder).toBe('Escribe tu nombre');
  });

  it('localizes number input label', () => {
    const localized = localizeDocument(doc, map, 'es');
    const el = localized.elements[1] as { label: string };
    expect(el.label).toBe('Edad');
  });

  it('localizes submit button label', () => {
    const localized = localizeDocument(doc, map, 'es');
    const el = localized.elements[2] as { label: string };
    expect(el.label).toBe('Enviar');
  });

  it('preserves original label when key is missing', () => {
    const localized = localizeDocument(doc, {}, 'es');
    const el = localized.elements[0] as { label: string };
    expect(el.label).toBe('Full Name');
  });
});

// ── localizeDocument — headings and text ──────────────────────────────────────

describe('localizeDocument — headings and text nodes', () => {
  const doc: Document = {
    version: '1',
    elements: [
      { type: 'heading', id: 'h1', level: 1, text: 'Patient Form' },
      { type: 'text', id: 'intro', content: 'Please complete all fields.' },
      { type: 'submit', id: 's', label: 'Submit', route: '/api' },
    ],
  };

  const map: LocaleMap = {
    fr: {
      'heading.h1.text':    'Formulaire Patient',
      'text.intro.content': 'Veuillez remplir tous les champs.',
    },
  };

  it('localizes heading text', () => {
    const localized = localizeDocument(doc, map, 'fr');
    const h = localized.elements[0] as { text: string };
    expect(h.text).toBe('Formulaire Patient');
  });

  it('localizes text content', () => {
    const localized = localizeDocument(doc, map, 'fr');
    const t = localized.elements[1] as { content: string };
    expect(t.content).toBe('Veuillez remplir tous les champs.');
  });
});

// ── localizeDocument — choice options ─────────────────────────────────────────

describe('localizeDocument — choice options', () => {
  const doc: Document = {
    version: '1',
    elements: [
      {
        type: 'input', kind: 'choice', id: 'gender', label: 'Gender',
        options: [
          { value: 'm', label: 'Male' },
          { value: 'f', label: 'Female' },
          { value: 'nb', label: 'Non-binary' },
        ],
      },
      { type: 'submit', id: 's', label: 'Submit', route: '/api' },
    ],
  };

  const map: LocaleMap = {
    es: {
      'gender.label':         'Género',
      'gender.option.m':      'Masculino',
      'gender.option.f':      'Femenino',
      'gender.option.nb':     'No binario',
    },
  };

  it('localizes choice label and option labels', () => {
    const localized = localizeDocument(doc, map, 'es');
    const el = localized.elements[0] as { label: string; options: { value: string; label: string }[] };
    expect(el.label).toBe('Género');
    expect(el.options[0]?.label).toBe('Masculino');
    expect(el.options[1]?.label).toBe('Femenino');
    expect(el.options[2]?.label).toBe('No binario');
  });
});

// ── localizeDocument — container recursion ────────────────────────────────────

describe('localizeDocument — nested container', () => {
  const doc: Document = {
    version: '1',
    elements: [
      {
        type: 'container',
        children: [
          { type: 'input', kind: 'text', id: 'street', label: 'Street' },
          { type: 'input', kind: 'text', id: 'city', label: 'City' },
        ],
      },
      { type: 'submit', id: 's', label: 'Submit', route: '/api' },
    ],
  };

  const map: LocaleMap = {
    de: {
      'street.label': 'Straße',
      'city.label':   'Stadt',
    },
  };

  it('localizes inputs nested inside a container', () => {
    const localized = localizeDocument(doc, map, 'de');
    const container = localized.elements[0] as { children: { label: string }[] };
    expect(container.children[0]?.label).toBe('Straße');
    expect(container.children[1]?.label).toBe('Stadt');
  });
});

// ── localizeDocument — document title ─────────────────────────────────────────

describe('localizeDocument — document title', () => {
  it('localizes the document title when present', () => {
    const doc: Document = {
      version: '1', title: 'Patient Form',
      elements: [{ type: 'submit', id: 's', label: 'Submit', route: '/api' }],
    };
    const map: LocaleMap = { es: { 'form.title': 'Formulario del Paciente' } };
    const localized = localizeDocument(doc, map, 'es');
    expect(localized.title).toBe('Formulario del Paciente');
  });

  it('leaves title unchanged when no translation key exists', () => {
    const doc: Document = {
      version: '1', title: 'Patient Form',
      elements: [{ type: 'submit', id: 's', label: 'Submit', route: '/api' }],
    };
    const localized = localizeDocument(doc, {}, 'es');
    expect(localized.title).toBe('Patient Form');
  });
});

// ── localizeErrors ────────────────────────────────────────────────────────────

describe('localizeErrors', () => {
  const map: LocaleMap = {
    es: {
      'error.form.Server error':           'Error del servidor',
      'error.field.email.Invalid email':   'Correo electrónico inválido',
    },
  };

  it('localizes form-level error messages', () => {
    const errors = localizeErrors({ form: ['Server error'] }, map, 'es');
    expect(errors.form?.[0]).toBe('Error del servidor');
  });

  it('localizes field-level error messages', () => {
    const errors = localizeErrors({ fields: { email: ['Invalid email'] } }, map, 'es');
    expect(errors.fields?.email?.[0]).toBe('Correo electrónico inválido');
  });

  it('falls back to original message when key is missing', () => {
    const errors = localizeErrors({ form: ['Unknown error'] }, map, 'es');
    expect(errors.form?.[0]).toBe('Unknown error');
  });
});
