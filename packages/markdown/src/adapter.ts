import type { IRNode } from '@renderly/schema';
import type { Logger, Result } from '@renderly/shared';
import type { MarkdownError } from './errors.js';
import type { MarkdownRegistry } from './types.js';
import { renderNodes } from './render.js';
import { createDefaultMarkdownRegistry } from './registry.js';

export interface RenderMarkdownOptions {
  readonly logger?: Logger;
}

export function renderDocument(
  nodes: readonly IRNode[],
  registry?: MarkdownRegistry,
  opts?: RenderMarkdownOptions,
): Result<string, MarkdownError> {
  return renderNodes(nodes, registry ?? createDefaultMarkdownRegistry(), opts?.logger);
}
