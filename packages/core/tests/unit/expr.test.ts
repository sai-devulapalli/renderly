import { describe, it, expect } from 'vitest';
import { evaluateExpr, formatComputedValue } from '../../src/expr.js';

// ── evaluateExpr ──────────────────────────────────────────────────────────────

describe('evaluateExpr — literals', () => {
  it('evaluates a plain number literal', () => {
    expect(evaluateExpr('42', {})).toBe(42);
  });

  it('evaluates a decimal literal', () => {
    expect(evaluateExpr('3.14', {})).toBeCloseTo(3.14);
  });
});

describe('evaluateExpr — arithmetic', () => {
  it('adds two literals', () => {
    expect(evaluateExpr('2 + 3', {})).toBe(5);
  });

  it('subtracts', () => {
    expect(evaluateExpr('10 - 4', {})).toBe(6);
  });

  it('multiplies', () => {
    expect(evaluateExpr('3 * 4', {})).toBe(12);
  });

  it('divides', () => {
    expect(evaluateExpr('10 / 4', {})).toBeCloseTo(2.5);
  });

  it('modulo', () => {
    expect(evaluateExpr('10 % 3', {})).toBe(1);
  });

  it('respects precedence: multiplication before addition', () => {
    expect(evaluateExpr('2 + 3 * 4', {})).toBe(14);
  });

  it('parentheses override precedence', () => {
    expect(evaluateExpr('(2 + 3) * 4', {})).toBe(20);
  });

  it('unary negation works', () => {
    expect(evaluateExpr('-5 + 10', {})).toBe(5);
  });
});

describe('evaluateExpr — field references', () => {
  it('resolves a numeric field value', () => {
    expect(evaluateExpr('price', { price: 9.99 })).toBeCloseTo(9.99);
  });

  it('resolves a string-coerced numeric value', () => {
    expect(evaluateExpr('qty', { qty: '3' })).toBe(3);
  });

  it('computes expression using multiple fields', () => {
    expect(evaluateExpr('price * qty', { price: 5, qty: 3 })).toBe(15);
  });

  it('returns undefined when a referenced field is missing', () => {
    expect(evaluateExpr('price * qty', { price: 5 })).toBeUndefined();
  });

  it('returns undefined when field value is non-numeric string', () => {
    expect(evaluateExpr('discount', { discount: 'twenty' })).toBeUndefined();
  });
});

describe('evaluateExpr — error cases', () => {
  it('returns undefined for division by zero', () => {
    expect(evaluateExpr('10 / 0', {})).toBeUndefined();
  });

  it('returns undefined for modulo by zero', () => {
    expect(evaluateExpr('10 % 0', {})).toBeUndefined();
  });

  it('returns undefined for invalid syntax', () => {
    expect(evaluateExpr('price @@ qty', { price: 5, qty: 3 })).toBeUndefined();
  });

  it('returns undefined for empty expression', () => {
    expect(evaluateExpr('', {})).toBeUndefined();
  });

  it('returns undefined for unclosed paren', () => {
    expect(evaluateExpr('(1 + 2', {})).toBeUndefined();
  });
});

// ── formatComputedValue ───────────────────────────────────────────────────────

describe('formatComputedValue', () => {
  it('returns "—" for undefined value', () => {
    expect(formatComputedValue(undefined, 'number')).toBe('—');
    expect(formatComputedValue(undefined, 'currency')).toBe('—');
    expect(formatComputedValue(undefined, 'percent')).toBe('—');
  });

  it('formats as plain number (rounded)', () => {
    expect(formatComputedValue(42, 'number')).toBe('42');
    expect(formatComputedValue(3.14159, 'number')).toBe('3.142');
  });

  it('formats as currency with $ prefix and 2 decimals', () => {
    expect(formatComputedValue(9.99, 'currency')).toBe('$9.99');
    expect(formatComputedValue(100, 'currency')).toBe('$100.00');
  });

  it('formats as percent with 1 decimal', () => {
    expect(formatComputedValue(0.25, 'percent')).toBe('25.0%');
    expect(formatComputedValue(1, 'percent')).toBe('100.0%');
  });

  it('handles zero correctly', () => {
    expect(formatComputedValue(0, 'number')).toBe('0');
    expect(formatComputedValue(0, 'currency')).toBe('$0.00');
    expect(formatComputedValue(0, 'percent')).toBe('0.0%');
  });
});
