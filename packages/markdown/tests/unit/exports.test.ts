import { describe, it, expect } from 'vitest';
import * as markdown from '../../src/index.js';

describe('public exports', () => {
  it('re-exports a renderer for every built-in IRNodeType, not just the first 10', () => {
    expect(typeof markdown.renderRepeat).toBe('function');
    expect(typeof markdown.renderInputFile).toBe('function');
    expect(typeof markdown.renderSignature).toBe('function');
    expect(typeof markdown.renderCustom).toBe('function');
  });
});
