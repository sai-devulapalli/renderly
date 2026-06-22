import { describe, it, expect } from 'vitest';
import type { Logger, LogContext } from '@renderly/shared';
import { parseDocument, parseDocumentObject, INPUT_ERROR_CODES } from '../../src/index.js';

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

const VALID_JSON = JSON.stringify({
  version: '1',
  title: 'Patient Intake',
  elements: [{ type: 'input', kind: 'text', id: 'dob', label: 'Date of Birth' }],
});

describe('parseDocument — observability', () => {
  it('emits no warnings on a valid document', () => {
    const { logger, events } = makeLogger();
    parseDocument(VALID_JSON, { logger });
    expect(events.filter((e) => e.level === 'warn')).toHaveLength(0);
  });

  it('emits parse:failed warning on invalid JSON', () => {
    const { logger, events } = makeLogger();
    parseDocument('{not json}', { logger });
    const warning = events.find((e) => e.msg === 'parse:failed');
    expect(warning).toBeDefined();
    expect(warning?.level).toBe('warn');
    expect(warning?.ctx?.['code']).toBe(INPUT_ERROR_CODES.PARSE_ERROR);
  });

  it('emits parse:invalid warning with failureCount and paths on schema violation', () => {
    const { logger, events } = makeLogger();
    parseDocument(JSON.stringify({ version: '1', title: 'T', elements: [{ type: 'bad-type' }] }), { logger });
    const warning = events.find((e) => e.msg === 'parse:invalid');
    expect(warning).toBeDefined();
    expect(warning?.ctx?.['code']).toBe(INPUT_ERROR_CODES.VALIDATION_ERROR);
    expect(typeof warning?.ctx?.['failureCount']).toBe('number');
    expect(Array.isArray(warning?.ctx?.['paths'])).toBe(true);
  });

  it('CRITICAL: never logs raw document content or field values', () => {
    const { logger, events } = makeLogger();
    // Document with PHI-like content in field labels
    const phiDoc = JSON.stringify({
      version: '1',
      title: 'Intake Form - John Smith DOB 1990',
      elements: [{ type: 'input', kind: 'text', id: 'ssn', label: 'Social Security Number' }],
    });
    parseDocument(phiDoc, { logger });
    const serialised = JSON.stringify(events);
    expect(serialised).not.toContain('John Smith');
    expect(serialised).not.toContain('Social Security');
    expect(serialised).not.toContain('1990');
  });

  it('CRITICAL: paths logged do not contain field values', () => {
    const { logger, events } = makeLogger();
    parseDocument(JSON.stringify({ version: '1' }), { logger });  // missing title and elements
    const warning = events.find((e) => e.msg === 'parse:invalid');
    const paths: string[] = (warning?.ctx?.['paths'] as string[]) ?? [];
    // paths should be JSON pointer paths like '/title', not user data
    for (const path of paths) {
      expect(path).toMatch(/^[/\w-]+$/);
    }
  });

  it('parseDocumentObject emits parse:invalid on bad object', () => {
    const { logger, events } = makeLogger();
    parseDocumentObject({ version: 1 }, { logger });  // version must be string
    const warning = events.find((e) => e.msg === 'parse:invalid');
    expect(warning).toBeDefined();
  });

  it('works without a logger — no errors thrown', () => {
    expect(() => parseDocument(VALID_JSON)).not.toThrow();
    expect(() => parseDocument(VALID_JSON, {})).not.toThrow();
  });

  it('INPUT_ERROR_CODES constants are correct', () => {
    expect(INPUT_ERROR_CODES.PARSE_ERROR).toBe('PARSE_ERROR');
    expect(INPUT_ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
  });
});
