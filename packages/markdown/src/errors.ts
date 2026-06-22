export type MarkdownErrorCode = 'UNREGISTERED_NODE_TYPE' | 'RENDER_ERROR';

export interface MarkdownError {
  readonly code: MarkdownErrorCode;
  readonly nodeType: string;
  readonly cause?: unknown;
}

export const MARKDOWN_ERROR_CODES = {
  UNREGISTERED_NODE_TYPE: 'UNREGISTERED_NODE_TYPE',
  RENDER_ERROR: 'RENDER_ERROR',
} as const satisfies Record<MarkdownErrorCode, MarkdownErrorCode>;
