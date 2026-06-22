import { describe, it, expect } from 'vitest';
import type { Rule, RuleOperator, RuleAction } from '../../src/rules.js';

describe('Rule types — structural contracts', () => {
  it('Rule with hide action and eq condition compiles', () => {
    const rule: Rule = {
      action: 'hide',
      when: { field: 'consent', op: 'eq', value: 'yes' },
    };
    expect(rule.action).toBe('hide');
    expect(rule.when.op).toBe('eq');
  });

  it('Rule with require action compiles', () => {
    const rule: Rule = {
      action: 'require',
      when: { field: 'age', op: 'lt', value: 18 },
    };
    expect(rule.action).toBe('require');
  });

  it('Rule with in operator and value array compiles', () => {
    const rule: Rule = {
      action: 'hide',
      when: { field: 'status', op: 'in', value: ['a', 'b'] },
    };
    expect(Array.isArray(rule.when.value)).toBe(true);
  });

  it('Rule with empty operator (no value) compiles', () => {
    const rule: Rule = {
      action: 'show',
      when: { field: 'notes', op: 'empty' },
    };
    expect(rule.when.value).toBeUndefined();
  });
});

describe('RuleOperator — all values', () => {
  const operators: RuleOperator[] = [
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'empty', 'notempty',
  ];
  it('has 10 operators', () => {
    expect(operators).toHaveLength(10);
  });
  it('each operator is a string', () => {
    for (const op of operators) {
      expect(typeof op).toBe('string');
    }
  });
});

describe('RuleAction — all values', () => {
  const actions: RuleAction[] = ['hide', 'show', 'require', 'optional'];
  it('has 4 actions', () => {
    expect(actions).toHaveLength(4);
  });
});
