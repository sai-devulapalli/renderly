import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DIRECTION,
  DEFAULT_GAP,
  DEFAULT_TEXT_SIZE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_COLOR_INTENT,
  DEFAULT_HEADING_SIZE,
} from '../../src/tokens.js';

describe('semantic token defaults', () => {
  it('DEFAULT_DIRECTION is column', () => expect(DEFAULT_DIRECTION).toBe('column'));
  it('DEFAULT_GAP is md', () => expect(DEFAULT_GAP).toBe('md'));
  it('DEFAULT_TEXT_SIZE is md', () => expect(DEFAULT_TEXT_SIZE).toBe('md'));
  it('DEFAULT_FONT_WEIGHT is normal', () => expect(DEFAULT_FONT_WEIGHT).toBe('normal'));
  it('DEFAULT_COLOR_INTENT is default', () => expect(DEFAULT_COLOR_INTENT).toBe('default'));
  it('DEFAULT_HEADING_SIZE is lg', () => expect(DEFAULT_HEADING_SIZE).toBe('lg'));
});
