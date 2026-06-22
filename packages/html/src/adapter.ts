import type { IRNode } from '@renderly/schema';
import type { Logger, Result } from '@renderly/shared';
import type { HtmlError } from './errors.js';
import type { HtmlRegistry } from './types.js';
import { renderNodes } from './render.js';
import { createDefaultHtmlRegistry } from './registry.js';

export interface RenderDocumentOptions {
  readonly logger?: Logger;
}

export function renderDocument(
  nodes: readonly IRNode[],
  registry?: HtmlRegistry,
  opts?: RenderDocumentOptions,
): Result<string, HtmlError> {
  return renderNodes(nodes, registry ?? createDefaultHtmlRegistry(), opts?.logger);
}
