import { describe, it, expect } from 'vitest';
import type { IRNode } from '@renderly/schema';
import type { Logger, LogContext } from '@renderly/shared';
import { renderDocument, HTML_ERROR_CODES } from '../../src/index.js';

function makeLogger(): { logger: Logger; events: Array<{ level: string; msg: string; ctx?: LogContext }> } {
  const events: Array<{ level: string; msg: string; ctx?: LogContext }> = [];
  const logger: Logger = {
    debug: (msg, ctx) => events.push({ level: 'debug', msg, ctx }),
    info:  (msg, ctx) => events.push({ level: 'info',  msg, ctx }),
    warn:  (msg, ctx) => events.push({ level: 'warn',  msg, ctx }),
    error: (msg, ctx) => events.push({ level: 'error', msg, ctx }),
    withTrace: () => logger,
  };
  return { logger, events };
}

const NODES: IRNode[] = [
  { type: 'heading', id: 'h1', level: 1, size: 'xl', text: 'My Form', children: [] },
  {
    type: 'input-text',
    id: 'email',
    label: 'Email Address',
    required: true,
    placeholder: undefined,
    minLength: undefined,
    maxLength: undefined,
    errors: [],
    children: [],
  },
];

describe('renderDocument (html) — observability', () => {
  it('emits render:complete with nodeCount and durationMs on success', () => {
    const { logger, events } = makeLogger();
    renderDocument(NODES, undefined, { logger });
    const complete = events.find((e) => e.msg === 'render:complete');
    expect(complete).toBeDefined();
    expect(complete?.ctx?.['nodeCount']).toBe(2);
    expect(typeof complete?.ctx?.['durationMs']).toBe('number');
  });

  it('emits render:unregistered warning for unknown node type', () => {
    const { logger, events } = makeLogger();
    renderDocument([{ type: 'unknown-node' } as unknown as IRNode], undefined, { logger });
    const warning = events.find((e) => e.msg === 'render:unregistered');
    expect(warning).toBeDefined();
    expect(warning?.level).toBe('warn');
    expect(warning?.ctx?.['nodeType']).toBe('unknown-node');
    expect(warning?.ctx?.['code']).toBe(HTML_ERROR_CODES.UNREGISTERED_NODE_TYPE);
  });

  it('does not log user-supplied field labels or content', () => {
    const { logger, events } = makeLogger();
    renderDocument(NODES, undefined, { logger });
    const allCtx = JSON.stringify(events);
    expect(allCtx).not.toContain('Email Address');
    expect(allCtx).not.toContain('My Form');
  });

  it('accepts a custom registry as second argument without breaking', () => {
    const { logger, events } = makeLogger();
    const result = renderDocument(NODES, undefined, { logger });
    expect(result.ok).toBe(true);
    expect(events.some((e) => e.msg === 'render:complete')).toBe(true);
  });

  it('works without a logger — no errors thrown', () => {
    expect(() => renderDocument(NODES)).not.toThrow();
    expect(() => renderDocument(NODES, undefined, {})).not.toThrow();
  });

  it('HTML_ERROR_CODES constants are correct', () => {
    expect(HTML_ERROR_CODES.UNREGISTERED_NODE_TYPE).toBe('UNREGISTERED_NODE_TYPE');
    expect(HTML_ERROR_CODES.RENDER_ERROR).toBe('RENDER_ERROR');
  });
});
