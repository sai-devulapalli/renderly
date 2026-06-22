export type ColorIntent = 'default' | 'accent' | 'good' | 'danger' | 'muted';
export type TextSize = 'sm' | 'md' | 'lg' | 'xl';
export type FontWeight = 'normal' | 'medium' | 'bold';
export type SpacingSize = 'none' | 'sm' | 'md' | 'lg';
export type Direction = 'row' | 'column';
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type InputKind = 'text' | 'number' | 'date' | 'choice' | 'file';

/** Named breakpoints, mobile-first (640 / 768 / 1024 / 1280 px). */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';
export const BREAKPOINTS: readonly Breakpoint[] = ['sm', 'md', 'lg', 'xl'];

/** Breakpoint-keyed responsive object — each key is optional. */
export interface ResponsiveValue<T> {
  readonly default?: T;
  readonly sm?: T;
  readonly md?: T;
  readonly lg?: T;
  readonly xl?: T;
}

/**
 * A value that is either a plain scalar or a breakpoint-keyed object.
 * Scalar = applies at all breakpoints. Object = mobile-first overrides.
 * T must be a string or number — never an object — so typeof guards are safe.
 */
export type Responsive<T> = T | ResponsiveValue<T>;

export const DEFAULT_DIRECTION: Direction = 'column';
export const DEFAULT_GAP: SpacingSize = 'md';
export const DEFAULT_TEXT_SIZE: TextSize = 'md';
export const DEFAULT_FONT_WEIGHT: FontWeight = 'normal';
export const DEFAULT_COLOR_INTENT: ColorIntent = 'default';
export const DEFAULT_HEADING_SIZE: TextSize = 'lg';
