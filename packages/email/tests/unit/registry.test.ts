import { describe, it, expect } from 'vitest';
import type { IRNodeType } from '@renderly/schema';
import { createEmailRegistry, createDefaultEmailRegistry } from '../../src/registry.js';

// Compile-time exhaustiveness check — fails to compile if a new IRNodeType is added
// but not registered in createDefaultEmailRegistry.
// NOTE: 'repeat-item' is consumed by the 'repeat' renderer directly, not registered.
type _ExhaustiveCheck = Exclude<
  IRNodeType,
  | 'container'
  | 'heading'
  | 'text'
  | 'input-text'
  | 'input-number'
  | 'input-date'
  | 'input-choice'
  | 'submit'
  | 'error-form'
  | 'error-field'
  | 'repeat'
  | 'repeat-item'
  | 'input-file'
  | 'signature'
  | 'custom'
> extends never ? true : false;
const _: _ExhaustiveCheck = true;

const ALL_NODE_TYPES: readonly IRNodeType[] = [
  'container',
  'heading',
  'text',
  'input-text',
  'input-number',
  'input-date',
  'input-choice',
  'submit',
  'error-form',
  'error-field',
  'repeat',
  'input-file',
  'signature',
  'custom',
] as const;

describe('createEmailRegistry', () => {
  it('returns an empty map', () => {
    const registry = createEmailRegistry();
    expect(registry.size).toBe(0);
  });

  it('returns a mutable Map', () => {
    const registry = createEmailRegistry();
    expect(registry).toBeInstanceOf(Map);
  });
});

describe('createDefaultEmailRegistry', () => {
  it('registers all 14 node types', () => {
    const registry = createDefaultEmailRegistry();
    expect(registry.size).toBe(ALL_NODE_TYPES.length);
  });

  it('has a renderer for every known node type', () => {
    const registry = createDefaultEmailRegistry();
    for (const type of ALL_NODE_TYPES) {
      expect(registry.has(type), `missing renderer for: ${type}`).toBe(true);
    }
  });

  it('every registered renderer is a function', () => {
    const registry = createDefaultEmailRegistry();
    for (const [type, fn] of registry) {
      expect(typeof fn, `renderer for ${type} is not a function`).toBe('function');
    }
  });

  it('has no extra node types beyond the known set', () => {
    const registry = createDefaultEmailRegistry();
    const knownSet = new Set<string>(ALL_NODE_TYPES);
    for (const type of registry.keys()) {
      expect(knownSet.has(type), `unexpected node type registered: ${type}`).toBe(true);
    }
  });
});
