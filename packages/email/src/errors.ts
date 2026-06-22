export type EmailErrorCode = 'UNREGISTERED_NODE_TYPE' | 'RENDER_ERROR';

export interface EmailError {
  readonly code: EmailErrorCode;
  readonly nodeType: string;
  readonly cause?: unknown;
}

export const EMAIL_ERROR_CODES = {
  UNREGISTERED_NODE_TYPE: 'UNREGISTERED_NODE_TYPE',
  RENDER_ERROR: 'RENDER_ERROR',
} as const satisfies Record<EmailErrorCode, EmailErrorCode>;
