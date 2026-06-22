import type { ReactElement } from 'react';
import type { IRNode, IRNodeType } from '@renderly/schema';
import type { Result } from '@renderly/shared';
import type { ReactError } from './errors.js';

export interface ReactRendererContext {
  renderChildren: (nodes: readonly IRNode[]) => Result<ReactElement[], ReactError>;
}

export type ReactNodeRenderer = (
  node: IRNode,
  context: ReactRendererContext,
) => Result<ReactElement, ReactError>;

export type ReactRegistry = ReadonlyMap<IRNodeType, ReactNodeRenderer>;
