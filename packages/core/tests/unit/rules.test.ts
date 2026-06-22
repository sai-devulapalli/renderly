import { describe, it, expect } from 'vitest';
import type { Rule, FieldValues } from '@renderly/schema';
import { evaluateCondition, applyRules } from '../../src/rules.js';

// ── evaluateCondition ─────────────────────────────────────────────────────────

describe('evaluateCondition — eq / neq', () => {
  it('eq: true when values match', () => {
    expect(evaluateCondition({ field: 'x', op: 'eq', value: 'yes' }, { x: 'yes' })).toBe(true);
  });
  it('eq: false when values differ', () => {
    expect(evaluateCondition({ field: 'x', op: 'eq', value: 'yes' }, { x: 'no' })).toBe(false);
  });
  it('eq: false when field is missing from values', () => {
    expect(evaluateCondition({ field: 'x', op: 'eq', value: 'yes' }, {})).toBe(false);
  });
  it('eq: works with numbers', () => {
    expect(evaluateCondition({ field: 'age', op: 'eq', value: 18 }, { age: 18 })).toBe(true);
  });
  it('neq: true when values differ', () => {
    expect(evaluateCondition({ field: 'x', op: 'neq', value: 'no' }, { x: 'yes' })).toBe(true);
  });
  it('neq: false when values match', () => {
    expect(evaluateCondition({ field: 'x', op: 'neq', value: 'yes' }, { x: 'yes' })).toBe(false);
  });
});

describe('evaluateCondition — numeric comparisons', () => {
  const values: FieldValues = { age: 17 };

  it('gt: true when field > value', () => {
    expect(evaluateCondition({ field: 'age', op: 'gt', value: 16 }, values)).toBe(true);
  });
  it('gt: false when field === value', () => {
    expect(evaluateCondition({ field: 'age', op: 'gt', value: 17 }, values)).toBe(false);
  });
  it('gte: true when field === value', () => {
    expect(evaluateCondition({ field: 'age', op: 'gte', value: 17 }, values)).toBe(true);
  });
  it('gte: false when field < value', () => {
    expect(evaluateCondition({ field: 'age', op: 'gte', value: 18 }, values)).toBe(false);
  });
  it('lt: true when field < value', () => {
    expect(evaluateCondition({ field: 'age', op: 'lt', value: 18 }, values)).toBe(true);
  });
  it('lt: false when field > value', () => {
    expect(evaluateCondition({ field: 'age', op: 'lt', value: 16 }, values)).toBe(false);
  });
  it('lte: true when field === value', () => {
    expect(evaluateCondition({ field: 'age', op: 'lte', value: 17 }, values)).toBe(true);
  });
  it('lte: false when field > value', () => {
    expect(evaluateCondition({ field: 'age', op: 'lte', value: 16 }, values)).toBe(false);
  });
  it('numeric ops return false when field is a string', () => {
    expect(evaluateCondition({ field: 'x', op: 'gt', value: 10 }, { x: 'hello' })).toBe(false);
  });
});

describe('evaluateCondition — in / nin', () => {
  it('in: true when field value is in the list', () => {
    expect(evaluateCondition(
      { field: 'status', op: 'in', value: ['active', 'pending'] },
      { status: 'active' },
    )).toBe(true);
  });
  it('in: false when field value is not in the list', () => {
    expect(evaluateCondition(
      { field: 'status', op: 'in', value: ['active', 'pending'] },
      { status: 'closed' },
    )).toBe(false);
  });
  it('in: false when value is not an array', () => {
    expect(evaluateCondition(
      { field: 'x', op: 'in', value: 'notanarray' as unknown as string[] },
      { x: 'notanarray' },
    )).toBe(false);
  });
  it('nin: true when field value is not in the list', () => {
    expect(evaluateCondition(
      { field: 'status', op: 'nin', value: ['closed', 'cancelled'] },
      { status: 'active' },
    )).toBe(true);
  });
  it('nin: false when field value is in the list', () => {
    expect(evaluateCondition(
      { field: 'status', op: 'nin', value: ['closed', 'cancelled'] },
      { status: 'closed' },
    )).toBe(false);
  });
});

describe('evaluateCondition — empty / notempty', () => {
  it('empty: true for undefined field', () => {
    expect(evaluateCondition({ field: 'x', op: 'empty' }, {})).toBe(true);
  });
  it('empty: true for empty string', () => {
    expect(evaluateCondition({ field: 'x', op: 'empty' }, { x: '' })).toBe(true);
  });
  it('empty: true for empty array', () => {
    expect(evaluateCondition({ field: 'x', op: 'empty' }, { x: [] })).toBe(true);
  });
  it('empty: false for non-empty string', () => {
    expect(evaluateCondition({ field: 'x', op: 'empty' }, { x: 'hello' })).toBe(false);
  });
  it('empty: false for zero (0 is a valid number, not empty)', () => {
    expect(evaluateCondition({ field: 'x', op: 'empty' }, { x: 0 })).toBe(false);
  });
  it('notempty: true for non-empty string', () => {
    expect(evaluateCondition({ field: 'x', op: 'notempty' }, { x: 'hello' })).toBe(true);
  });
  it('notempty: false for empty string', () => {
    expect(evaluateCondition({ field: 'x', op: 'notempty' }, { x: '' })).toBe(false);
  });
  it('notempty: false for undefined field', () => {
    expect(evaluateCondition({ field: 'x', op: 'notempty' }, {})).toBe(false);
  });
});

// ── applyRules ────────────────────────────────────────────────────────────────

describe('applyRules — visibility', () => {
  it('returns visible=true when no rules match', () => {
    const rules: Rule[] = [{ action: 'hide', when: { field: 'x', op: 'eq', value: 'yes' } }];
    expect(applyRules(rules, { x: 'no' }).visible).toBe(true);
  });

  it('returns visible=false when a hide rule matches', () => {
    const rules: Rule[] = [{ action: 'hide', when: { field: 'x', op: 'eq', value: 'yes' } }];
    expect(applyRules(rules, { x: 'yes' }).visible).toBe(false);
  });

  it('show rule overrides a preceding hide rule', () => {
    const rules: Rule[] = [
      { action: 'hide', when: { field: 'x', op: 'eq', value: 'yes' } },
      { action: 'show', when: { field: 'y', op: 'eq', value: 'override' } },
    ];
    expect(applyRules(rules, { x: 'yes', y: 'override' }).visible).toBe(true);
  });

  it('last matching hide wins over an earlier show', () => {
    const rules: Rule[] = [
      { action: 'show', when: { field: 'x', op: 'eq', value: 'yes' } },
      { action: 'hide', when: { field: 'x', op: 'eq', value: 'yes' } },
    ];
    expect(applyRules(rules, { x: 'yes' }).visible).toBe(false);
  });

  it('returns visible=true with empty rules array', () => {
    expect(applyRules([], {}).visible).toBe(true);
  });
});

describe('applyRules — required override', () => {
  it('requiredOverride is undefined when no require/optional rules match', () => {
    const rules: Rule[] = [{ action: 'hide', when: { field: 'x', op: 'eq', value: 'yes' } }];
    expect(applyRules(rules, { x: 'no' }).requiredOverride).toBeUndefined();
  });

  it('require rule sets requiredOverride=true', () => {
    const rules: Rule[] = [{ action: 'require', when: { field: 'x', op: 'eq', value: 'yes' } }];
    expect(applyRules(rules, { x: 'yes' }).requiredOverride).toBe(true);
  });

  it('optional rule sets requiredOverride=false', () => {
    const rules: Rule[] = [{ action: 'optional', when: { field: 'x', op: 'eq', value: 'yes' } }];
    expect(applyRules(rules, { x: 'yes' }).requiredOverride).toBe(false);
  });

  it('last matching required rule wins', () => {
    const rules: Rule[] = [
      { action: 'require', when: { field: 'x', op: 'eq', value: 'yes' } },
      { action: 'optional', when: { field: 'x', op: 'eq', value: 'yes' } },
    ];
    expect(applyRules(rules, { x: 'yes' }).requiredOverride).toBe(false);
  });

  it('visibility and required are independent dimensions', () => {
    const rules: Rule[] = [
      { action: 'hide', when: { field: 'x', op: 'eq', value: 'yes' } },
      { action: 'require', when: { field: 'x', op: 'eq', value: 'yes' } },
    ];
    const effect = applyRules(rules, { x: 'yes' });
    expect(effect.visible).toBe(false);
    expect(effect.requiredOverride).toBe(true);
  });
});
