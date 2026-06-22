/**
 * Stylesheet coverage tests.
 *
 * These verify that every class name and data-attribute selector produced by
 * the HTML renderer is present in the stylesheet, and that the CSS custom
 * properties are defined. Tests are purely string-based — no browser needed.
 */
import { describe, it, expect } from 'vitest';
import { css } from '../../src/stylesheet.js';
import { COLOR, FONT, SPACE, RADIUS, BREAKPOINT } from '../../src/tokens.js';

// ── Basics ────────────────────────────────────────────────────────────────────

describe('stylesheet basics', () => {
  it('is a non-empty string', () => {
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('starts with a comment header', () => {
    expect(css.trimStart()).toMatch(/^\/\*/);
  });

  it('defines :root custom properties', () => {
    expect(css).toContain(':root {');
  });
});

// ── CSS custom properties ─────────────────────────────────────────────────────

describe('CSS custom properties — presence', () => {
  const required = [
    '--renderly-color-text',
    '--renderly-color-text-subtle',
    '--renderly-color-text-muted',
    '--renderly-color-accent',
    '--renderly-color-success',
    '--renderly-color-danger',
    '--renderly-color-border',
    '--renderly-color-border-focus',
    '--renderly-color-bg',
    '--renderly-color-bg-input',
    '--renderly-color-bg-error',
    '--renderly-font-family',
    '--renderly-font-size',
    '--renderly-font-size-sm',
    '--renderly-font-size-lg',
    '--renderly-font-size-xl',
    '--renderly-line-height',
    '--renderly-h1-size',
    '--renderly-h6-size',
    '--renderly-space-none',
    '--renderly-space-sm',
    '--renderly-space-md',
    '--renderly-space-lg',
    '--renderly-radius',
    '--renderly-radius-lg',
    '--renderly-border-width',
    '--renderly-field-gap',
    '--renderly-input-padding',
  ] as const;

  for (const prop of required) {
    it(`defines ${prop}`, () => {
      expect(css).toContain(prop);
    });
  }
});

describe('CSS custom properties — token values match JS tokens', () => {
  it('danger color value matches COLOR.danger', () => {
    expect(css).toContain(`--renderly-color-danger:       ${COLOR.danger}`);
  });

  it('accent color value matches COLOR.accent', () => {
    expect(css).toContain(`--renderly-color-accent:       ${COLOR.accent}`);
  });

  it('font-size-sm value matches FONT.sizeSm', () => {
    expect(css).toContain(`--renderly-font-size-sm:  ${FONT.sizeSm}`);
  });

  it('space-md value matches SPACE.md', () => {
    expect(css).toContain(`--renderly-space-md:   ${SPACE.md}`);
  });

  it('radius value matches RADIUS.base', () => {
    expect(css).toContain(`--renderly-radius:       ${RADIUS.base}`);
  });
});

// ── Layout selectors ──────────────────────────────────────────────────────────

describe('container layout selectors', () => {
  it('targets [data-direction]', () => {
    expect(css).toContain('[data-direction]');
  });

  it('targets [data-direction="row"]', () => {
    expect(css).toContain('[data-direction="row"]');
  });

  it('targets [data-direction="column"]', () => {
    expect(css).toContain('[data-direction="column"]');
  });

  it('targets [data-gap="none"]', () => {
    expect(css).toContain('[data-gap="none"]');
  });

  it('targets [data-gap="sm"]', () => {
    expect(css).toContain('[data-gap="sm"]');
  });

  it('targets [data-gap="md"]', () => {
    expect(css).toContain('[data-gap="md"]');
  });

  it('targets [data-gap="lg"]', () => {
    expect(css).toContain('[data-gap="lg"]');
  });

  it('targets [data-cols="2"]', () => {
    expect(css).toContain('[data-cols="2"]');
  });
});

// ── Responsive breakpoints ────────────────────────────────────────────────────

describe('responsive breakpoints', () => {
  it('includes sm breakpoint media query', () => {
    expect(css).toContain(`min-width: ${BREAKPOINT.sm}`);
  });

  it('includes md breakpoint media query', () => {
    expect(css).toContain(`min-width: ${BREAKPOINT.md}`);
  });

  it('includes lg breakpoint media query', () => {
    expect(css).toContain(`min-width: ${BREAKPOINT.lg}`);
  });

  it('includes xl breakpoint media query', () => {
    expect(css).toContain(`min-width: ${BREAKPOINT.xl}`);
  });

  it('includes responsive direction selectors for md', () => {
    expect(css).toContain('[data-md-direction="row"]');
  });

  it('includes responsive gap selectors for lg', () => {
    expect(css).toContain('[data-lg-gap="md"]');
  });

  it('includes responsive cols selectors for sm', () => {
    expect(css).toContain('[data-sm-cols="2"]');
  });
});

// ── Typography selectors ──────────────────────────────────────────────────────

describe('typography selectors', () => {
  it('styles heading elements', () => {
    expect(css).toContain('h1, h2, h3, h4, h5, h6');
  });

  it('targets [data-size="sm"]', () => {
    expect(css).toContain('[data-size="sm"]');
  });

  it('targets [data-size="xl"]', () => {
    expect(css).toContain('[data-size="xl"]');
  });

  it('targets [data-weight="normal"]', () => {
    expect(css).toContain('[data-weight="normal"]');
  });

  it('targets [data-weight="bold"]', () => {
    expect(css).toContain('[data-weight="bold"]');
  });

  it('targets [data-intent="default"]', () => {
    expect(css).toContain('[data-intent="default"]');
  });

  it('targets [data-intent="danger"]', () => {
    expect(css).toContain('[data-intent="danger"]');
  });

  it('targets [data-intent="muted"]', () => {
    expect(css).toContain('[data-intent="muted"]');
  });
});

// ── Field classes ─────────────────────────────────────────────────────────────

describe('field classes', () => {
  it('defines .field', () => {
    expect(css).toContain('.field {');
  });

  it('styles .field label', () => {
    expect(css).toContain('.field label');
  });

  it('styles .field input', () => {
    expect(css).toContain('.field input');
  });

  it('styles .field select', () => {
    expect(css).toContain('.field select');
  });

  it('defines .choice-group', () => {
    expect(css).toContain('.choice-group');
  });

  it('defines .choice-option', () => {
    expect(css).toContain('.choice-option');
  });
});

// ── Error classes ─────────────────────────────────────────────────────────────

describe('error classes', () => {
  it('defines .error--form', () => {
    expect(css).toContain('.error--form');
  });

  it('defines .error--field', () => {
    expect(css).toContain('.error--field');
  });

  it('defines .field-errors', () => {
    expect(css).toContain('.field-errors');
  });

  it('defines .field-error', () => {
    expect(css).toContain('.field-error');
  });
});

// ── Repeat component classes ──────────────────────────────────────────────────

describe('repeat component classes', () => {
  it('defines .renderly-repeat', () => {
    expect(css).toContain('.renderly-repeat {');
  });

  it('defines .renderly-repeat__item', () => {
    expect(css).toContain('.renderly-repeat__item');
  });

  it('defines .renderly-repeat__add', () => {
    expect(css).toContain('.renderly-repeat__add');
  });

  it('defines .renderly-repeat__remove', () => {
    expect(css).toContain('.renderly-repeat__remove');
  });
});

// ── Signature component classes ───────────────────────────────────────────────

describe('signature component classes', () => {
  it('defines .renderly-signature', () => {
    expect(css).toContain('.renderly-signature');
  });

  it('defines .renderly-signature__pad', () => {
    expect(css).toContain('.renderly-signature__pad');
  });

  it('signature pad uses dashed border', () => {
    expect(css).toContain('dashed');
  });

  it('signature pad sets cursor to crosshair', () => {
    expect(css).toContain('cursor: crosshair');
  });
});

// ── Custom element classes ────────────────────────────────────────────────────

describe('custom element classes', () => {
  it('defines .renderly-custom', () => {
    expect(css).toContain('.renderly-custom {');
  });

  it('defines .renderly-custom__label', () => {
    expect(css).toContain('.renderly-custom__label');
  });
});
