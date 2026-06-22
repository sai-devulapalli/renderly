import { describe, it, expect } from 'vitest';
import { createRegistry, elementKey } from '../../src/registry.js';
import { ok } from '@renderly/shared';
import type { Element } from '@renderly/schema';
import type { ElementHandler } from '../../src/types.js';

const noop: ElementHandler = (el) => ok({ type: 'text', id: undefined, content: '', weight: 'normal', intent: 'default', children: [] });

describe('elementKey', () => {
  it('returns the type for non-input elements', () => {
    expect(elementKey({ type: 'container', children: [] })).toBe('container');
    expect(elementKey({ type: 'heading', level: 1, text: 'T' })).toBe('heading');
    expect(elementKey({ type: 'text', content: 'c' })).toBe('text');
    expect(elementKey({ type: 'submit', id: 's', label: 'Go', route: '/' })).toBe('submit');
  });

  it('returns input:<kind> for input elements', () => {
    const base = { type: 'input' as const, id: 'f', label: 'L' };
    expect(elementKey({ ...base, kind: 'text' })).toBe('input:text');
    expect(elementKey({ ...base, kind: 'number' })).toBe('input:number');
    expect(elementKey({ ...base, kind: 'date' })).toBe('input:date');
    expect(elementKey({ ...base, kind: 'choice', options: [] })).toBe('input:choice');
  });
});

describe('createRegistry', () => {
  it('resolve returns err for an unregistered element', () => {
    const registry = createRegistry();
    const result = registry.resolve({ type: 'heading', level: 1, text: 'T' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNREGISTERED_ELEMENT_TYPE');
      expect(result.error.elementType).toBe('heading');
    }
  });

  it('resolve returns ok after registering a handler', () => {
    const registry = createRegistry();
    registry.register('heading', noop);
    const result = registry.resolve({ type: 'heading', level: 1, text: 'T' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(noop);
    }
  });

  it('resolve returns err for unregistered input kind', () => {
    const registry = createRegistry();
    const el: Element = { type: 'input', kind: 'text', id: 'f', label: 'L' };
    const result = registry.resolve(el);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.elementType).toBe('input:text');
    }
  });

  it('resolve returns ok for registered input kind', () => {
    const registry = createRegistry();
    registry.register('input:text', noop);
    const el: Element = { type: 'input', kind: 'text', id: 'f', label: 'L' };
    const result = registry.resolve(el);
    expect(result.ok).toBe(true);
  });

  it('overwriting a handler replaces the previous one', () => {
    const registry = createRegistry();
    const handler2: ElementHandler = (el) => ok({ type: 'text', id: undefined, content: 'new', weight: 'normal', intent: 'default', children: [] });
    registry.register('heading', noop);
    registry.register('heading', handler2);
    const result = registry.resolve({ type: 'heading', level: 1, text: 'T' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(handler2);
  });
});
