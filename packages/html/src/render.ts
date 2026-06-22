import type { IRNode } from '@renderly/schema';
import { ok, err } from '@renderly/shared';
import type { Logger, Result } from '@renderly/shared';
import type { HtmlError } from './errors.js';
import type { HtmlRegistry, RenderChildrenFn } from './types.js';

export function renderNodes(
  nodes: readonly IRNode[],
  registry: HtmlRegistry,
  logger?: Logger,
): Result<string, HtmlError> {
  const t0 = Date.now();
  let html = '';

  for (const node of nodes) {
    const renderer = registry.get(node.type);
    if (renderer === undefined) {
      logger?.warn('render:unregistered', { code: 'UNREGISTERED_NODE_TYPE', nodeType: node.type });
      return err<HtmlError>({ code: 'UNREGISTERED_NODE_TYPE', nodeType: node.type });
    }
    const renderChildrenFn: RenderChildrenFn = (children) =>
      renderNodes(children, registry, logger);
    let result: Result<string, HtmlError>;
    try {
      result = renderer(node, renderChildrenFn);
    } catch (cause) {
      logger?.error('render:exception', { code: 'RENDER_ERROR', nodeType: node.type });
      return err<HtmlError>({ code: 'RENDER_ERROR', nodeType: node.type, cause });
    }
    if (!result.ok) return result;
    html += result.value;
  }

  logger?.debug('render:complete', { nodeCount: nodes.length, durationMs: Date.now() - t0 });
  return ok(html);
}
