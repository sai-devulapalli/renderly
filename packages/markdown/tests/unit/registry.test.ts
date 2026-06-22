import { describe, it, expect } from 'vitest';
import type { IRNodeType } from '@renderly/schema';
import { createMarkdownRegistry, createDefaultMarkdownRegistry } from '../../src/registry.js';

// Exhaustiveness check: compile error if a new IRNodeType is added without being registered.
// NOTE: 'repeat-item' is consumed directly by 'repeat', not registered separately.
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

describe('createMarkdownRegistry', () => {
  it('returns an empty map', () => {
    expect(createMarkdownRegistry().size).toBe(0);
  });
});

describe('createDefaultMarkdownRegistry', () => {
  it('has exactly 14 entries', () => {
    expect(createDefaultMarkdownRegistry().size).toBe(14);
  });

  it('has a renderer for every IRNodeType', () => {
    const registry = createDefaultMarkdownRegistry();
    for (const type of ALL_NODE_TYPES) {
      expect(registry.has(type), `missing renderer for ${type}`).toBe(true);
    }
  });

  it('all registered values are functions', () => {
    for (const [, fn] of createDefaultMarkdownRegistry()) {
      expect(typeof fn).toBe('function');
    }
  });
});
