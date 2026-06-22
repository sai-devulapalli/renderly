export type WcErrorCode = 'PARSE_ERROR' | 'WALK_ERROR' | 'RENDER_ERROR';

export interface WcError {
  readonly code: WcErrorCode;
  readonly cause?: unknown;
}
