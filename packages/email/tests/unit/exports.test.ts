import { describe, it, expect } from 'vitest';
import * as email from '../../src/index.js';

describe('public exports', () => {
  it('re-exports a renderer for every built-in IRNodeType, not just the first 10', () => {
    expect(typeof email.renderRepeat).toBe('function');
    expect(typeof email.renderInputFile).toBe('function');
    expect(typeof email.renderSignature).toBe('function');
    expect(typeof email.renderCustom).toBe('function');
  });
});
