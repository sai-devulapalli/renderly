import type { IRNode } from '@renderly/schema';
import { ok, err } from '@renderly/shared';
import type { Logger, Result } from '@renderly/shared';
import type { PdfError } from './errors.js';
import type { PdfDoc, PdfRegistry, RenderChildrenFn } from './types.js';

export function renderNodes(
  nodes: readonly IRNode[],
  doc: PdfDoc,
  registry: PdfRegistry,
  logger?: Logger,
): Result<void, PdfError> {
  const t0 = Date.now();

  for (const node of nodes) {
    const renderer = registry.get(node.type);
    if (renderer === undefined) {
      logger?.warn('render:unregistered', { code: 'UNREGISTERED_NODE_TYPE', nodeType: node.type });
      return err<PdfError>({ code: 'UNREGISTERED_NODE_TYPE', nodeType: node.type });
    }
    const renderChildrenFn: RenderChildrenFn = (children, d) =>
      renderNodes(children, d, registry, logger);
    let result: Result<void, PdfError>;
    try {
      result = renderer(node, doc, renderChildrenFn);
    } catch (cause) {
      logger?.error('render:exception', { code: 'RENDER_ERROR', nodeType: node.type });
      return err<PdfError>({ code: 'RENDER_ERROR', nodeType: node.type, cause });
    }
    if (!result.ok) return result;
  }

  logger?.debug('render:complete', { nodeCount: nodes.length, durationMs: Date.now() - t0 });
  return ok(undefined);
}
