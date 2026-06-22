import type { IRNode, IRNodeType } from '@renderly/schema';
import type { Result } from '@renderly/shared';
import type { EmailError } from './errors.js';

export type RenderChildrenFn = (nodes: readonly IRNode[]) => Result<string, EmailError>;
export type EmailNodeRenderer = (node: IRNode, renderChildren: RenderChildrenFn) => Result<string, EmailError>;
export type EmailRegistry = ReadonlyMap<IRNodeType, EmailNodeRenderer>;
