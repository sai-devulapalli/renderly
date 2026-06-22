import type { IRNode, IRNodeType } from '@renderly/schema';
import type { Result } from '@renderly/shared';
import type { HtmlError } from './errors.js';

export type RenderChildrenFn = (nodes: readonly IRNode[]) => Result<string, HtmlError>;
export type HtmlNodeRenderer = (node: IRNode, renderChildren: RenderChildrenFn) => Result<string, HtmlError>;
export type HtmlRegistry = ReadonlyMap<IRNodeType, HtmlNodeRenderer>;
