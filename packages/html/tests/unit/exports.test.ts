import { describe, it, expect } from 'vitest';
import * as html from '../../src/index.js';

describe('public exports', () => {
  it('re-exports a renderer for every built-in IRNodeType, not just the first 10', () => {
    expect(typeof html.renderRepeat).toBe('function');
    expect(typeof html.renderInputFile).toBe('function');
    expect(typeof html.renderSignature).toBe('function');
    expect(typeof html.renderCustom).toBe('function');
  });
});
