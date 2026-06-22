export type PdfErrorCode = 'UNREGISTERED_NODE_TYPE' | 'RENDER_ERROR';

export interface PdfError {
  readonly code: PdfErrorCode;
  readonly nodeType: string;
  readonly cause?: unknown;
}

export const PDF_ERROR_CODES = {
  UNREGISTERED_NODE_TYPE: 'UNREGISTERED_NODE_TYPE',
  RENDER_ERROR: 'RENDER_ERROR',
} as const satisfies Record<PdfErrorCode, PdfErrorCode>;
