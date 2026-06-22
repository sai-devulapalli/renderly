import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, mapOk, mapErr, unwrapOr } from '../../src/result/result.js';

describe('ok', () => {
  it('creates an Ok result', () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(42);
  });

  it('works with undefined', () => {
    const result = ok(undefined);
    expect(result.ok).toBe(true);
    expect(result.value).toBeUndefined();
  });
});

describe('err', () => {
  it('creates an Err result', () => {
    const result = err(new Error('boom'));
    expect(result.ok).toBe(false);
    expect(result.error.message).toBe('boom');
  });

  it('works with string errors', () => {
    const result = err('something went wrong');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('something went wrong');
  });
});

describe('isOk', () => {
  it('returns true for Ok', () => {
    expect(isOk(ok('hello'))).toBe(true);
  });

  it('returns false for Err', () => {
    expect(isOk(err('oops'))).toBe(false);
  });
});

describe('isErr', () => {
  it('returns true for Err', () => {
    expect(isErr(err('fail'))).toBe(true);
  });

  it('returns false for Ok', () => {
    expect(isErr(ok(1))).toBe(false);
  });
});

describe('mapOk', () => {
  it('transforms the value when Ok', () => {
    const result = mapOk(ok(2), (n) => n * 3);
    expect(result).toEqual(ok(6));
  });

  it('passes through Err unchanged', () => {
    const original = err('e');
    const result = mapOk(original, (n: number) => n * 3);
    expect(result).toBe(original);
  });
});

describe('mapErr', () => {
  it('transforms the error when Err', () => {
    const result = mapErr(err('raw'), (e) => ({ message: e }));
    expect(result).toEqual(err({ message: 'raw' }));
  });

  it('passes through Ok unchanged', () => {
    const original = ok(10);
    const result = mapErr(original, () => 'new error');
    expect(result).toBe(original);
  });
});

describe('unwrapOr', () => {
  it('returns the value when Ok', () => {
    expect(unwrapOr(ok(5), 0)).toBe(5);
  });

  it('returns the fallback when Err', () => {
    expect(unwrapOr(err('e'), 99)).toBe(99);
  });
});
