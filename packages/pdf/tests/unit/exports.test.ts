import { describe, it, expect } from 'vitest';
import * as pdf from '../../src/index.js';

describe('public exports', () => {
  it('re-exports a renderer for every built-in IRNodeType, not just the first 10', () => {
    expect(typeof pdf.renderRepeat).toBe('function');
    expect(typeof pdf.renderInputFile).toBe('function');
    expect(typeof pdf.renderSignature).toBe('function');
    expect(typeof pdf.renderCustom).toBe('function');
  });
});
