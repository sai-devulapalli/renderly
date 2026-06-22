import PDFDocument from 'pdfkit';
import type { IRNode } from '@renderly/schema';
import { ok } from '@renderly/shared';
import type { Logger, Result } from '@renderly/shared';
import type { PdfError } from './errors.js';
import type { PdfRegistry } from './types.js';
import { renderNodes } from './render.js';
import { createDefaultPdfRegistry } from './registry.js';

export interface RenderPdfOptions {
  readonly logger?: Logger;
  /** PDF document title (embedded in metadata). */
  readonly title?: string;
  /** Page margins in points. Defaults to 48. */
  readonly margin?: number;
}

/**
 * Render an IR node array to a PDF Buffer.
 *
 * Returns `Promise<Result<Buffer, PdfError>>`. The resolved buffer contains
 * a valid, self-contained PDF. The Promise rejects only on unexpected stream
 * errors; all domain errors are encoded in the Result type.
 */
export function renderDocument(
  nodes: readonly IRNode[],
  registry?: PdfRegistry,
  opts?: RenderPdfOptions,
): Promise<Result<Buffer, PdfError>> {
  return new Promise((resolve) => {
    const margin = opts?.margin ?? 48;
    const doc = new PDFDocument({
      margin,
      info: { Title: opts?.title ?? 'Form', Creator: 'Renderly' },
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(ok(Buffer.concat(chunks))));

    try {
      doc.font('Helvetica').initForm();
      // We supply explicit AP streams on every radio/checkbox widget, so viewers
      // must use them rather than generating their own appearances.
      type DocWithAcroForm = { _root: { data: { AcroForm: { data: Record<string, unknown> } } } };
      (doc as unknown as DocWithAcroForm)._root.data.AcroForm.data.NeedAppearances = false;

      const result = renderNodes(nodes, doc, registry ?? createDefaultPdfRegistry(), opts?.logger);
      if (!result.ok) {
        doc.end();
        resolve(result);
        return;
      }

    } catch (e) {
      resolve({ ok: false, error: { code: 'RENDER_ERROR', nodeType: 'unknown', cause: e } });
      doc.end();
      return;
    }

    doc.end();
  });
}
