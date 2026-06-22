import type { IRNode, IRNodeType } from '@renderly/schema';
import type { Result } from '@renderly/shared';
import type { MarkdownError } from './errors.js';

export type RenderChildrenFn = (nodes: readonly IRNode[]) => Result<string, MarkdownError>;
export type MarkdownNodeRenderer = (node: IRNode, renderChildren: RenderChildrenFn) => Result<string, MarkdownError>;
export type MarkdownRegistry = ReadonlyMap<IRNodeType, MarkdownNodeRenderer>;
