export type HtmlErrorCode = 'UNREGISTERED_NODE_TYPE' | 'RENDER_ERROR';

export interface HtmlError {
  readonly code: HtmlErrorCode;
  readonly nodeType: string;
  readonly cause?: unknown;
}

export const HTML_ERROR_CODES = {
  UNREGISTERED_NODE_TYPE: 'UNREGISTERED_NODE_TYPE',
  RENDER_ERROR: 'RENDER_ERROR',
} as const satisfies Record<HtmlErrorCode, HtmlErrorCode>;
