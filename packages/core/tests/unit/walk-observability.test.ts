import { describe, it, expect } from 'vitest';
import type { Document } from '@renderly/schema';
import type { Logger, LogContext } from '@renderly/shared';
import { walk, createDefaultRegistry, createRegistry, WALK_ERROR_CODES } from '../../src/index.js';

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

const SIMPLE_DOC: Document = {
  version: '1',
  title: 'Test',
  elements: [
    { type: 'text', content: 'Hello' },
    { type: 'input', kind: 'text', id: 'name', label: 'Name' },
  ],
};

describe('walk — observability', () => {
  it('emits walk:start with elementCount', () => {
    const { logger, events } = makeLogger();
    walk(SIMPLE_DOC, createDefaultRegistry(), { logger });
    const start = events.find((e) => e.msg === 'walk:start');
    expect(start).toBeDefined();
    expect(start?.ctx?.['elementCount']).toBe(2);
  });

  it('emits walk:element for each top-level element', () => {
    const { logger, events } = makeLogger();
    walk(SIMPLE_DOC, createDefaultRegistry(), { logger });
    const elementEvents = events.filter((e) => e.msg === 'walk:element');
    expect(elementEvents).toHaveLength(2);
    expect(elementEvents.map((e) => e.ctx?.['type'])).toEqual(['text', 'input:text']);
  });

  it('emits walk:complete with nodeCount and durationMs', () => {
    const { logger, events } = makeLogger();
    walk(SIMPLE_DOC, createDefaultRegistry(), { logger });
    const complete = events.find((e) => e.msg === 'walk:complete');
    expect(complete).toBeDefined();
    expect(typeof complete?.ctx?.['nodeCount']).toBe('number');
    expect(typeof complete?.ctx?.['durationMs']).toBe('number');
  });

  it('durationMs is a finite non-negative number', () => {
    const { logger, events } = makeLogger();
    walk(SIMPLE_DOC, createDefaultRegistry(), { logger });
    const complete = events.find((e) => e.msg === 'walk:complete');
    const durationMs = complete?.ctx?.['durationMs'] as number;
    expect(Number.isFinite(durationMs)).toBe(true);
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });

  it('emits walk:unregistered warning on unknown element type', () => {
    const { logger, events } = makeLogger();
    const doc = {
      version: '1',
      title: 'Bad',
      elements: [{ type: 'unknown-widget', id: 'x' }],
    } as unknown as Document;
    walk(doc, createDefaultRegistry(), { logger });
    const warning = events.find((e) => e.msg === 'walk:unregistered');
    expect(warning).toBeDefined();
    expect(warning?.level).toBe('warn');
    expect(warning?.ctx?.['elementType']).toBe('unknown-widget');
    expect(warning?.ctx?.['code']).toBe(WALK_ERROR_CODES.UNREGISTERED_ELEMENT_TYPE);
  });

  it('does not log any field values — only structural metadata', () => {
    const { logger, events } = makeLogger();
    const doc: Document = {
      version: '1',
      title: 'PHI Form',
      elements: [
        { type: 'input', kind: 'text', id: 'first_name', label: 'First Name', required: true },
      ],
    };
    walk(doc, createDefaultRegistry(), { logger });
    const allCtx = JSON.stringify(events);
    expect(allCtx).not.toContain('First Name');
    expect(allCtx).not.toContain('first_name');
  });

  it('works without a logger — no errors thrown', () => {
    expect(() => walk(SIMPLE_DOC, createDefaultRegistry())).not.toThrow();
    expect(() => walk(SIMPLE_DOC, createDefaultRegistry(), {})).not.toThrow();
  });

  it('emits walk:handler-failed warning when a handler returns err', () => {
    const { logger, events } = makeLogger();
    const failingRegistry = createRegistry();
    failingRegistry.register('heading', () => ({
      ok: false,
      error: { code: 'HANDLER_FAILED', elementType: 'heading' },
    }));
    const doc: Document = {
      version: '1',
      title: 'Bad',
      elements: [{ type: 'heading', level: 1, text: 'H' }],
    };
    walk(doc, failingRegistry, { logger });
    const warning = events.find((e) => e.msg === 'walk:handler-failed');
    expect(warning).toBeDefined();
    expect(warning?.level).toBe('warn');
    expect(warning?.ctx?.['code']).toBe(WALK_ERROR_CODES.HANDLER_FAILED);
    expect(warning?.ctx?.['elementType']).toBe('heading');
  });

  it('WALK_ERROR_CODES constants match the WalkErrorCode union', () => {
    expect(WALK_ERROR_CODES.UNREGISTERED_ELEMENT_TYPE).toBe('UNREGISTERED_ELEMENT_TYPE');
    expect(WALK_ERROR_CODES.HANDLER_FAILED).toBe('HANDLER_FAILED');
  });
});
