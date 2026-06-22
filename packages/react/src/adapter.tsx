import { Fragment } from 'react';
import type { ReactElement } from 'react';
import type { IRNode } from '@renderly/schema';
import type { Logger, Result } from '@renderly/shared';
import { ok } from '@renderly/shared';
import type { ReactError } from './errors.js';
import type { ReactRegistry } from './types.js';
import { renderNodes } from './render.js';
import { createDefaultReactRegistry } from './registry.js';

export interface RenderDocumentOptions {
  readonly logger?: Logger;
}

export function renderDocument(
  nodes: readonly IRNode[],
  registry?: ReactRegistry,
  opts?: RenderDocumentOptions,
): Result<ReactElement, ReactError> {
  const result = renderNodes(nodes, registry ?? createDefaultReactRegistry(), opts?.logger);
  if (!result.ok) return result;
  return ok(<Fragment>{result.value}</Fragment>);
}
