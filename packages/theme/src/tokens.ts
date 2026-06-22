// Single source of truth for all design token values.
// The stylesheet.ts file builds CSS custom-property declarations from these.

export const COLOR = {
  text:        '#1a1a1a',
  textSubtle:  '#555555',
  textMuted:   '#888888',
  accent:      '#0055cc',
  success:     '#1a7a1a',
  danger:      '#cc2200',
  border:      '#cccccc',
  borderFocus: '#0055cc',
  bg:          '#ffffff',
  bgInput:     '#f9f9f9',
  bgError:     '#fff0ee',
} as const;

export const FONT = {
  family:     'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  sizeBase:   '1rem',
  sizeSm:     '0.875rem',
  sizeLg:     '1.125rem',
  sizeXl:     '1.25rem',
  lineHeight: '1.5',
} as const;

export const HEADING_SIZE: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: '2rem',
  2: '1.75rem',
  3: '1.5rem',
  4: '1.25rem',
  5: '1.125rem',
  6: '1rem',
};

export const SPACE = {
  none: '0',
  sm:   '0.5rem',
  md:   '1rem',
  lg:   '1.5rem',
} as const;

export const RADIUS = {
  base: '4px',
  lg:   '8px',
} as const;

export const BREAKPOINT = {
  sm:  '640px',
  md:  '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

export const tokens = { COLOR, FONT, HEADING_SIZE, SPACE, RADIUS, BREAKPOINT } as const;
export type Tokens = typeof tokens;
