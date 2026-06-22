import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseJson } from '../../src/parse.js';
import { isOk, isErr } from '@renderly/shared';

describe('parseJson — valid JSON', () => {
  it('parses a JSON object', () => {
    const result = parseJson('{"version":"1","elements":[]}');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect((result.value as { version: string }).version).toBe('1');
  });

  it('parses a JSON array', () => {
    const result = parseJson('[1,2,3]');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toEqual([1, 2, 3]);
  });

  it('parses a JSON string', () => {
    const result = parseJson('"hello"');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe('hello');
  });

  it('parses null', () => {
    const result = parseJson('null');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBeNull();
  });
});

describe('parseJson — invalid JSON', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns PARSE_ERROR for malformed JSON', () => {
    const result = parseJson('{not valid json}');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe('PARSE_ERROR');
      expect(typeof result.error.message).toBe('string');
    }
  });

  it('returns PARSE_ERROR for empty string', () => {
    const result = parseJson('');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.code).toBe('PARSE_ERROR');
  });

  it('uses Error.message when thrown value is an Error instance', () => {
    const error = new SyntaxError('Unexpected token');
    vi.spyOn(JSON, 'parse').mockImplementationOnce(() => { throw error; });
    const result = parseJson('x');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toBe('Unexpected token');
  });

  it('uses String(e) when thrown value is not an Error instance', () => {
    vi.spyOn(JSON, 'parse').mockImplementationOnce(() => { throw 'non-error string'; });
    const result = parseJson('x');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toBe('non-error string');
  });
});
