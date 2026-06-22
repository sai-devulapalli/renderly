import { describe, it, expect } from 'vitest';
import { COLOR, FONT, HEADING_SIZE, SPACE, RADIUS, BREAKPOINT, tokens } from '../../src/tokens.js';

describe('COLOR tokens', () => {
  it('has all required color keys', () => {
    const required = [
      'text', 'textSubtle', 'textMuted',
      'accent', 'success', 'danger',
      'border', 'borderFocus',
      'bg', 'bgInput', 'bgError',
    ] as const;
    for (const key of required) {
      expect(COLOR[key], `COLOR.${key} missing`).toBeTruthy();
    }
  });

  it('all color values are valid hex strings', () => {
    for (const [key, value] of Object.entries(COLOR)) {
      expect(value, `COLOR.${key} is not a hex color`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('danger color is used for errors', () => {
    expect(COLOR.danger).toBe('#cc2200');
  });

  it('accent color is the primary interactive color', () => {
    expect(COLOR.accent).toBe('#0055cc');
  });
});

describe('FONT tokens', () => {
  it('has all required font keys', () => {
    expect(FONT.family).toBeTruthy();
    expect(FONT.sizeBase).toBeTruthy();
    expect(FONT.sizeSm).toBeTruthy();
    expect(FONT.sizeLg).toBeTruthy();
    expect(FONT.sizeXl).toBeTruthy();
    expect(FONT.lineHeight).toBeTruthy();
  });

  it('sizes are relative units (rem)', () => {
    expect(FONT.sizeBase).toMatch(/rem$/);
    expect(FONT.sizeSm).toMatch(/rem$/);
    expect(FONT.sizeLg).toMatch(/rem$/);
    expect(FONT.sizeXl).toMatch(/rem$/);
  });

  it('sm size is smaller than base', () => {
    expect(parseFloat(FONT.sizeSm)).toBeLessThan(parseFloat(FONT.sizeBase));
  });

  it('lg size is larger than base', () => {
    expect(parseFloat(FONT.sizeLg)).toBeGreaterThan(parseFloat(FONT.sizeBase));
  });

  it('xl size is larger than lg', () => {
    expect(parseFloat(FONT.sizeXl)).toBeGreaterThan(parseFloat(FONT.sizeLg));
  });
});

describe('HEADING_SIZE tokens', () => {
  it('has entries for all 6 heading levels', () => {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      expect(HEADING_SIZE[level], `HEADING_SIZE[${level}] missing`).toBeTruthy();
    }
  });

  it('sizes decrease with level (h1 > h2 > … > h6)', () => {
    for (let i = 1; i <= 5; i++) {
      const current = parseFloat(HEADING_SIZE[i as 1 | 2 | 3 | 4 | 5 | 6]);
      const next    = parseFloat(HEADING_SIZE[(i + 1) as 2 | 3 | 4 | 5 | 6]);
      expect(current).toBeGreaterThan(next);
    }
  });
});

describe('SPACE tokens', () => {
  it('has none, sm, md, lg', () => {
    expect(SPACE.none).toBe('0');
    expect(SPACE.sm).toBeTruthy();
    expect(SPACE.md).toBeTruthy();
    expect(SPACE.lg).toBeTruthy();
  });

  it('sizes are ordered sm < md < lg', () => {
    expect(parseFloat(SPACE.sm)).toBeLessThan(parseFloat(SPACE.md));
    expect(parseFloat(SPACE.md)).toBeLessThan(parseFloat(SPACE.lg));
  });
});

describe('RADIUS tokens', () => {
  it('has base and lg variants', () => {
    expect(RADIUS.base).toBeTruthy();
    expect(RADIUS.lg).toBeTruthy();
  });

  it('lg is larger than base', () => {
    expect(parseFloat(RADIUS.lg)).toBeGreaterThan(parseFloat(RADIUS.base));
  });
});

describe('BREAKPOINT tokens', () => {
  it('has sm, md, lg, xl', () => {
    expect(BREAKPOINT.sm).toBeTruthy();
    expect(BREAKPOINT.md).toBeTruthy();
    expect(BREAKPOINT.lg).toBeTruthy();
    expect(BREAKPOINT.xl).toBeTruthy();
  });

  it('breakpoints are in ascending order', () => {
    expect(parseInt(BREAKPOINT.sm)).toBeLessThan(parseInt(BREAKPOINT.md));
    expect(parseInt(BREAKPOINT.md)).toBeLessThan(parseInt(BREAKPOINT.lg));
    expect(parseInt(BREAKPOINT.lg)).toBeLessThan(parseInt(BREAKPOINT.xl));
  });

  it('sm breakpoint is 640px', () => {
    expect(BREAKPOINT.sm).toBe('640px');
  });
});

describe('tokens aggregate object', () => {
  it('re-exports all token groups', () => {
    expect(tokens.COLOR).toBe(COLOR);
    expect(tokens.FONT).toBe(FONT);
    expect(tokens.HEADING_SIZE).toBe(HEADING_SIZE);
    expect(tokens.SPACE).toBe(SPACE);
    expect(tokens.RADIUS).toBe(RADIUS);
    expect(tokens.BREAKPOINT).toBe(BREAKPOINT);
  });
});
