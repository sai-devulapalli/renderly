import { describe, it, expect } from 'vitest';
import type { IRNodeType } from '@renderly/schema';
import { createHtmlRegistry, createDefaultHtmlRegistry } from '../../src/registry.js';

// Exhaustiveness check: if a new renderable type is added to IRNodeType this line fails at compile time.
// NOTE: 'repeat-item' is intentionally excluded — it is consumed by the 'repeat' renderer directly.
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
  'submit', 'error-form', 'error-field', 'repeat',
  'input-file', 'signature', 'custom',
];

describe('createHtmlRegistry', () => {
  it('returns an empty map', () => {
    const registry = createHtmlRegistry();
    expect(registry.size).toBe(0);
  });

  it('returns a mutable Map (allows adding entries)', () => {
    const registry = createHtmlRegistry();
    registry.set('heading', () => ({ ok: true, value: '' }));
    expect(registry.size).toBe(1);
  });
});

describe('createDefaultHtmlRegistry', () => {
  it('has exactly 14 entries', () => {
    expect(createDefaultHtmlRegistry().size).toBe(14);
  });

  it('has a renderer for every IRNodeType', () => {
    const registry = createDefaultHtmlRegistry();
    for (const type of ALL_NODE_TYPES) {
      expect(registry.has(type), `missing renderer for ${type}`).toBe(true);
    }
  });

  it('all registered values are functions', () => {
    const registry = createDefaultHtmlRegistry();
    for (const [, renderer] of registry) {
      expect(typeof renderer).toBe('function');
    }
  });
});
