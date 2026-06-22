export type ReactErrorCode = 'UNREGISTERED_NODE_TYPE' | 'RENDER_ERROR';

export interface ReactError {
  readonly code: ReactErrorCode;
  readonly nodeType: string;
  readonly cause?: unknown;
}

export const REACT_ERROR_CODES = {
  UNREGISTERED_NODE_TYPE: 'UNREGISTERED_NODE_TYPE',
  RENDER_ERROR: 'RENDER_ERROR',
} as const satisfies Record<ReactErrorCode, ReactErrorCode>;
