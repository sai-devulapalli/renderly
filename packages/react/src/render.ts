import { cloneElement } from 'react';
import type { ReactElement } from 'react';
import { ok, err } from '@renderly/shared';
import type { Logger, Result } from '@renderly/shared';
import type { IRNode } from '@renderly/schema';
import type { ReactError } from './errors.js';
import type { ReactRegistry, ReactRendererContext } from './types.js';

export function renderNodes(
  nodes: readonly IRNode[],
  registry: ReactRegistry,
  logger?: Logger,
): Result<ReactElement[], ReactError> {
  const t0 = Date.now();
  const elements: ReactElement[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const renderer = registry.get(node.type);
    if (renderer === undefined) {
      logger?.warn('render:unregistered', { code: 'UNREGISTERED_NODE_TYPE', nodeType: node.type });
      return err<ReactError>({ code: 'UNREGISTERED_NODE_TYPE', nodeType: node.type });
    }
    const context: ReactRendererContext = {
      renderChildren: (children) => renderNodes(children, registry, logger),
    };
    let result: Result<ReactElement, ReactError>;
    try {
      result = renderer(node, context);
    } catch (cause) {
      logger?.error('render:exception', { code: 'RENDER_ERROR', nodeType: node.type });
      return err<ReactError>({ code: 'RENDER_ERROR', nodeType: node.type, cause });
    }
    if (!result.ok) return result;
    elements.push(cloneElement(result.value, { key: node.id ?? i }));
  }

  logger?.debug('render:complete', { nodeCount: nodes.length, durationMs: Date.now() - t0 });
  return ok(elements);
}
