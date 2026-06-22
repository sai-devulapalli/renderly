import type { IRNode } from '@renderly/schema';
import { ok, err } from '@renderly/shared';
import type { Logger, Result } from '@renderly/shared';
import type { MarkdownError } from './errors.js';
import type { MarkdownRegistry, RenderChildrenFn } from './types.js';

export function renderNodes(
  nodes: readonly IRNode[],
  registry: MarkdownRegistry,
  logger?: Logger,
): Result<string, MarkdownError> {
  const t0 = Date.now();
  let md = '';

  for (const node of nodes) {
    const renderer = registry.get(node.type);
    if (renderer === undefined) {
      logger?.warn('render:unregistered', { code: 'UNREGISTERED_NODE_TYPE', nodeType: node.type });
      return err<MarkdownError>({ code: 'UNREGISTERED_NODE_TYPE', nodeType: node.type });
    }
    const renderChildrenFn: RenderChildrenFn = (children) =>
      renderNodes(children, registry, logger);
    let result: Result<string, MarkdownError>;
    try {
      result = renderer(node, renderChildrenFn);
    } catch (cause) {
      logger?.error('render:exception', { code: 'RENDER_ERROR', nodeType: node.type });
      return err<MarkdownError>({ code: 'RENDER_ERROR', nodeType: node.type, cause });
    }
    if (!result.ok) return result;
    md += result.value;
  }

  logger?.debug('render:complete', { nodeCount: nodes.length, durationMs: Date.now() - t0 });
  return ok(md);
}
