import { describe, it, expect } from 'vitest';
import * as react from '../../src/index.js';

describe('public exports', () => {
  it('re-exports a renderer for every built-in IRNodeType, not just the first 10', () => {
    expect(typeof react.renderRepeat).toBe('function');
    expect(typeof react.renderInputFile).toBe('function');
    expect(typeof react.renderSignature).toBe('function');
    expect(typeof react.renderCustom).toBe('function');
  });
});
