import { describe, it, expect } from 'vitest';
import { isOk, isErr } from '@renderly/shared';
import { renderNodes } from '../../src/render.js';
import { createDefaultHtmlRegistry, createHtmlRegistry } from '../../src/registry.js';
import type { IRNode, IRTextNode, IRContainerNode } from '@renderly/schema';

const textNode = (content: string, id?: string): IRTextNode => ({
  type: 'text', id, content, weight: 'normal', intent: 'default', children: [],
});

const containerNode = (children: readonly IRNode[], id?: string): IRContainerNode => ({
  type: 'container', id, direction: 'column', gap: 'md', cols: undefined, children,
});

describe('renderNodes — empty input', () => {
  it('returns ok empty string for an empty nodes array', () => {
    const result = renderNodes([], createDefaultHtmlRegistry());
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe('');
  });
});

describe('renderNodes — single node', () => {
  it('renders a text node via the default registry', () => {
    const result = renderNodes([textNode('Hello')], createDefaultHtmlRegistry());
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toContain('Hello');
  });
});

describe('renderNodes — error cases', () => {
  it('returns UNREGISTERED_NODE_TYPE for an unknown node type', () => {
    const unknownNode = { type: 'unknown', id: undefined, children: [] } as unknown as IRNode;
    const result = renderNodes([unknownNode], createDefaultHtmlRegistry());
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('UNREGISTERED_NODE_TYPE');
      expect(result.error.nodeType).toBe('unknown');
    }
  });

  it('returns RENDER_ERROR when a renderer throws', () => {
    const registry = createHtmlRegistry();
    registry.set('text', () => { throw new Error('boom'); });
    const result = renderNodes([textNode('x')], registry);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('RENDER_ERROR');
      expect(result.error.nodeType).toBe('text');
    }
  });

  it('propagates err returned by a renderer', () => {
    const registry = createHtmlRegistry();
    registry.set('text', () => ({ ok: false, error: { code: 'RENDER_ERROR', nodeType: 'text' } }));
    const result = renderNodes([textNode('x')], registry);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('RENDER_ERROR');
  });
});

describe('renderNodes — nested containers', () => {
  it('recursively renders children', () => {
    const nodes: IRNode[] = [
      containerNode([
        textNode('inner'),
      ], 'outer'),
    ];
    const result = renderNodes(nodes, createDefaultHtmlRegistry());
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toContain('inner');
      expect(result.value).toContain('outer');
    }
  });
});
