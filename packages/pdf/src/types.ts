import type PDFDocument from 'pdfkit';
import type { IRNode, IRNodeType } from '@renderly/schema';
import type { Result } from '@renderly/shared';
import type { PdfError } from './errors.js';

export type { PdfError };
export type PdfDoc = InstanceType<typeof PDFDocument>;
export type PdfNodeRenderer = (node: IRNode, doc: PdfDoc, renderChildren: RenderChildrenFn) => Result<void, PdfError>;
export type PdfRegistry = ReadonlyMap<IRNodeType, PdfNodeRenderer>;
export type RenderChildrenFn = (nodes: readonly IRNode[], doc: PdfDoc) => Result<void, PdfError>;
