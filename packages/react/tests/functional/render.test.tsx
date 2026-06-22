import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { isOk, isErr } from '@renderly/shared';
import type { IRNode, IRTextNode, IRContainerNode } from '@renderly/schema';
import { renderNodes } from '../../src/render.js';
import { createDefaultReactRegistry, createReactRegistry } from '../../src/registry.js';

const textNode = (content: string, id?: string): IRTextNode => ({
  type: 'text', id, content, weight: 'normal', intent: 'default', children: [],
});

const containerNode = (children: readonly IRNode[], id?: string): IRContainerNode => ({
  type: 'container', id, direction: 'column', gap: 'md', cols: undefined, children,
});

describe('renderNodes — empty input', () => {
  it('returns ok with empty array for empty nodes', () => {
    const result = renderNodes([], createDefaultReactRegistry());
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toHaveLength(0);
  });
});

describe('renderNodes — node with id (key source = node.id)', () => {
  it('uses node.id as the React key', () => {
    const result = renderNodes([textNode('Hi', 'my-id')], createDefaultReactRegistry());
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toHaveLength(1);
      // Key is internal to React but the element renders correctly
      const { getByText } = render(<>{result.value}</>);
      expect(getByText('Hi')).toBeTruthy();
    }
  });
});

describe('renderNodes — node without id (key source = index)', () => {
  it('falls back to array index as React key', () => {
    const result = renderNodes([textNode('No-id')], createDefaultReactRegistry());
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const { getByText } = render(<>{result.value}</>);
      expect(getByText('No-id')).toBeTruthy();
    }
  });
});

describe('renderNodes — error cases', () => {
  it('returns UNREGISTERED_NODE_TYPE for unknown node type', () => {
    const unknown = { type: 'unknown', id: undefined, children: [] } as unknown as IRNode;
    const result = renderNodes([unknown], createDefaultReactRegistry());
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('UNREGISTERED_NODE_TYPE');
      expect(result.error.nodeType).toBe('unknown');
    }
  });

  it('returns RENDER_ERROR when a renderer throws', () => {
    const reg = createReactRegistry();
    reg.set('text', () => { throw new Error('boom'); });
    const result = renderNodes([textNode('x')], reg);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('RENDER_ERROR');
      expect(result.error.cause).toBeInstanceOf(Error);
    }
  });

  it('propagates err returned by a renderer', () => {
    const reg = createReactRegistry();
    reg.set('text', () => ({ ok: false, error: { code: 'RENDER_ERROR', nodeType: 'text' } }));
    const result = renderNodes([textNode('x')], reg);
    expect(isErr(result)).toBe(true);
  });
});

describe('renderNodes — nested containers', () => {
  it('recursively renders container children', () => {
    const nodes: IRNode[] = [containerNode([textNode('deep')], 'outer')];
    const result = renderNodes(nodes, createDefaultReactRegistry());
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const { getByText } = render(<>{result.value}</>);
      expect(getByText('deep')).toBeTruthy();
    }
  });
});
