import { describe, it, expect } from 'vitest';
import type { IRNodeType } from '@renderly/schema';
import { createReactRegistry, createDefaultReactRegistry } from '../../src/registry.js';

// Exhaustiveness check: if a new type is added to IRNodeType this line fails at compile time.
// NOTE: 'repeat-item' is consumed directly by the 'repeat' renderer, not registered separately.
type _ExhaustiveCheck = Exclude<IRNodeType,
  | 'container' | 'heading' | 'text'
  | 'input-text' | 'input-number' | 'input-date' | 'input-choice'
  | 'submit' | 'error-form' | 'error-field'
  | 'repeat' | 'repeat-item'
  | 'input-file' | 'signature' | 'custom'
> extends never ? true : false;
const _exhaustive: _ExhaustiveCheck = true;
void _exhaustive;

const ALL_NODE_TYPES: readonly IRNodeType[] = [
  'container', 'heading', 'text',
  'input-text', 'input-number', 'input-date', 'input-choice',
  'submit', 'error-form', 'error-field',
  'repeat', 'input-file', 'signature', 'custom',
];

describe('createReactRegistry', () => {
  it('returns an empty map', () => {
    expect(createReactRegistry().size).toBe(0);
  });

  it('returns a mutable map that accepts entries', () => {
    const reg = createReactRegistry();
    reg.set('text', () => ({ ok: true, value: null as never }));
    expect(reg.size).toBe(1);
  });
});

describe('createDefaultReactRegistry', () => {
  it('has exactly 14 entries', () => {
    expect(createDefaultReactRegistry().size).toBe(14);
  });

  it('has a renderer for every IRNodeType', () => {
    const reg = createDefaultReactRegistry();
    for (const type of ALL_NODE_TYPES) {
      expect(reg.has(type), `missing renderer for ${type}`).toBe(true);
    }
  });

  it('all registered values are functions', () => {
    for (const [, fn] of createDefaultReactRegistry()) {
      expect(typeof fn).toBe('function');
    }
  });
});
