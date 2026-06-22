import type { IRNode } from '@renderly/schema';
import type { Logger, Result } from '@renderly/shared';
import { ok } from '@renderly/shared';
import type { EmailError } from './errors.js';
import type { EmailRegistry } from './types.js';
import { renderNodes } from './render.js';
import { createDefaultEmailRegistry } from './registry.js';

export interface RenderEmailOptions {
  readonly logger?: Logger;
  /** Omit the outer 600px wrapper table. Useful when embedding into an existing email template. */
  readonly bare?: boolean;
}

const WRAPPER_OPEN =
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"'
  + ' style="border-collapse:collapse;background-color:#f4f4f4;">'
  + '<tr><td align="center" style="padding:24px 16px;">'
  + '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"'
  + ' style="border-collapse:collapse;max-width:600px;width:100%;'
  + 'background-color:#ffffff;border-radius:6px;'
  + 'box-shadow:0 1px 4px rgba(0,0,0,0.08);">'
  + '<tr><td style="padding:32px 36px;font-family:Arial,Helvetica,sans-serif;">';

const WRAPPER_CLOSE = '</td></tr></table></td></tr></table>';

export function renderDocument(
  nodes: readonly IRNode[],
  registry?: EmailRegistry,
  opts?: RenderEmailOptions,
): Result<string, EmailError> {
  const innerResult = renderNodes(nodes, registry ?? createDefaultEmailRegistry(), opts?.logger);
  if (!innerResult.ok) return innerResult;
  if (opts?.bare) return innerResult;
  return ok(WRAPPER_OPEN + innerResult.value + WRAPPER_CLOSE);
}
