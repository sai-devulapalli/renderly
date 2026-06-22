import { describe, it, expect } from 'vitest';
import type { Rule, FieldValues, ValidationRule } from '@renderly/schema';
import type { Document } from '@renderly/schema';
import { isOk } from '@renderly/shared';
import { evaluateCondition, applyRules, evaluateValidationRules } from '../../src/rules.js';
import { textInputHandler } from '../../src/handlers.js';
import type { HandlerContext } from '../../src/types.js';
import type { IRNode } from '@renderly/schema';
import { walk, createDefaultRegistry } from '../../src/index.js';

// ── evaluateValidationRules ───────────────────────────────────────────────────

describe('evaluateValidationRules — no rules', () => {
  it('returns [] when rules array is empty', () => {
    expect(evaluateValidationRules([], { end_date: '2024-01-01' })).toEqual([]);
  });

  it('returns [] when rules array has no ValidationRule (only ConditionalRules)', () => {
    const rules: Rule[] = [
      { action: 'hide', when: { field: 'x', op: 'eq', value: 'yes' } },
      { action: 'require', when: { field: 'x', op: 'eq', value: 'yes' } },
    ];
    expect(evaluateValidationRules(rules, { x: 'yes' })).toEqual([]);
  });
});

describe('evaluateValidationRules — condition is false', () => {
  it('returns [] when the ValidationRule condition does not match', () => {
    const rules: Rule[] = [
      {
        action: 'error',
        when: { field: 'end_date', op: 'lte', value: 5 },
        message: 'End date must be after start date',
      } as ValidationRule,
    ];
    // end_date = 10, threshold = 5: 10 lte 5 is false
    expect(evaluateValidationRules(rules, { end_date: 10 })).toEqual([]);
  });

  it('returns [] when field is missing and op is eq', () => {
    const rules: Rule[] = [
      { action: 'error', when: { field: 'end_date', op: 'eq', value: 'bad' }, message: 'Invalid' } as ValidationRule,
    ];
    expect(evaluateValidationRules(rules, {})).toEqual([]);
  });
});

describe('evaluateValidationRules — condition is true', () => {
  it('returns message when a single ValidationRule condition matches', () => {
    const rules: Rule[] = [
      {
        action: 'error',
        when: { field: 'end_date', op: 'lte', value: 5 },
        message: 'End date must be after start date',
      } as ValidationRule,
    ];
    // end_date = 3, threshold = 5: 3 lte 5 is true
    const result = evaluateValidationRules(rules, { end_date: 3 });
    expect(result).toEqual(['End date must be after start date']);
  });

  it('returns message when condition uses eq and matches', () => {
    const rules: Rule[] = [
      { action: 'error', when: { field: 'status', op: 'eq', value: 'invalid' }, message: 'Status is invalid' } as ValidationRule,
    ];
    expect(evaluateValidationRules(rules, { status: 'invalid' })).toEqual(['Status is invalid']);
  });
});

describe('evaluateValidationRules — multiple rules', () => {
  it('returns multiple messages when multiple ValidationRule conditions all match', () => {
    const rules: Rule[] = [
      {
        action: 'error',
        when: { field: 'end_date', op: 'lte', value: 0 },
        message: 'End date must be positive',
      } as ValidationRule,
      {
        action: 'error',
        when: { field: 'end_date', op: 'lt', value: 10 },
        message: 'End date must be at least 10',
      } as ValidationRule,
    ];
    // end_date = -1: both conditions are true
    const result = evaluateValidationRules(rules, { end_date: -1 });
    expect(result).toEqual(['End date must be positive', 'End date must be at least 10']);
  });

  it('returns only matching messages when some rules match and some do not', () => {
    const rules: Rule[] = [
      {
        action: 'error',
        when: { field: 'score', op: 'lt', value: 0 },
        message: 'Score cannot be negative',
      } as ValidationRule,
      {
        action: 'error',
        when: { field: 'score', op: 'gt', value: 100 },
        message: 'Score cannot exceed 100',
      } as ValidationRule,
    ];
    // score = -5: first matches (lt 0), second does not
    const result = evaluateValidationRules(rules, { score: -5 });
    expect(result).toEqual(['Score cannot be negative']);
  });

  it('preserves message order matching rule declaration order', () => {
    const rules: Rule[] = [
      { action: 'error', when: { field: 'x', op: 'eq', value: 'bad' }, message: 'First error' } as ValidationRule,
      { action: 'error', when: { field: 'x', op: 'eq', value: 'bad' }, message: 'Second error' } as ValidationRule,
      { action: 'error', when: { field: 'x', op: 'eq', value: 'bad' }, message: 'Third error' } as ValidationRule,
    ];
    const result = evaluateValidationRules(rules, { x: 'bad' });
    expect(result).toEqual(['First error', 'Second error', 'Third error']);
  });
});

// ── applyRules ignores ValidationRule ────────────────────────────────────────

describe('applyRules — ignores ValidationRule', () => {
  it('does not change visible when only ValidationRules are present', () => {
    const rules: Rule[] = [
      { action: 'error', when: { field: 'x', op: 'eq', value: 'bad' }, message: 'Error!' } as ValidationRule,
    ];
    const effect = applyRules(rules, { x: 'bad' });
    expect(effect.visible).toBe(true);
  });

  it('does not set requiredOverride when only ValidationRules are present', () => {
    const rules: Rule[] = [
      { action: 'error', when: { field: 'x', op: 'eq', value: 'bad' }, message: 'Error!' } as ValidationRule,
    ];
    const effect = applyRules(rules, { x: 'bad' });
    expect(effect.requiredOverride).toBeUndefined();
  });

  it('does not affect visible or requiredOverride when ValidationRule is mixed with ConditionalRules', () => {
    const rules: Rule[] = [
      { action: 'hide', when: { field: 'x', op: 'eq', value: 'hide_me' } },
      { action: 'error', when: { field: 'x', op: 'eq', value: 'bad' }, message: 'Error!' } as ValidationRule,
    ];
    // 'bad' triggers the ValidationRule but not the hide rule
    const effect = applyRules(rules, { x: 'bad' });
    expect(effect.visible).toBe(true);
    expect(effect.requiredOverride).toBeUndefined();
  });

  it('ConditionalRule still works alongside a ValidationRule', () => {
    const rules: Rule[] = [
      { action: 'hide', when: { field: 'x', op: 'eq', value: 'hide_me' } },
      { action: 'error', when: { field: 'x', op: 'eq', value: 'hide_me' }, message: 'Also an error' } as ValidationRule,
    ];
    // hide rule matches, ValidationRule also matches — but applyRules only handles visibility
    const effect = applyRules(rules, { x: 'hide_me' });
    expect(effect.visible).toBe(false);
    expect(effect.requiredOverride).toBeUndefined();
  });
});

// ── textInputHandler merges formErrors and ruleErrors ─────────────────────────

function makeContext(overrides: Partial<HandlerContext> = {}): HandlerContext {
  return {
    errors: undefined,
    values: undefined,
    walkChildren: (children) => {
      const nodes: IRNode[] = children.map(() => ({
        type: 'text' as const,
        id: undefined,
        content: 'child',
        weight: 'normal' as const,
        intent: 'default' as const,
        children: [],
      }));
      return { ok: true, value: nodes };
    },
    ...overrides,
  };
}

describe('textInputHandler — merges formErrors and ruleErrors', () => {
  it('produces no errors when neither formErrors nor values are present', () => {
    const el = { type: 'input' as const, kind: 'text' as const, id: 'end_date', label: 'End Date' };
    const result = textInputHandler(el, makeContext());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as { errors: string[] }).errors).toEqual([]);
    }
  });

  it('produces only formErrors when values are absent', () => {
    const el = { type: 'input' as const, kind: 'text' as const, id: 'end_date', label: 'End Date',
      rules: [
        { action: 'error' as const, when: { field: 'end_date', op: 'eq' as const, value: 'bad' }, message: 'Rule error' },
      ],
    };
    const result = textInputHandler(el, makeContext({
      errors: { fields: { end_date: ['Form error'] } },
      values: undefined,
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as { errors: string[] }).errors).toEqual(['Form error']);
    }
  });

  it('produces only ruleErrors when formErrors are absent', () => {
    const el = { type: 'input' as const, kind: 'text' as const, id: 'end_date', label: 'End Date',
      rules: [
        { action: 'error' as const, when: { field: 'end_date', op: 'eq' as const, value: 'bad' }, message: 'Rule error' },
      ],
    };
    const result = textInputHandler(el, makeContext({
      errors: undefined,
      values: { end_date: 'bad' },
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as { errors: string[] }).errors).toEqual(['Rule error']);
    }
  });

  it('merges formErrors before ruleErrors', () => {
    const el = { type: 'input' as const, kind: 'text' as const, id: 'end_date', label: 'End Date',
      rules: [
        { action: 'error' as const, when: { field: 'end_date', op: 'eq' as const, value: 'bad' }, message: 'Rule error' },
      ],
    };
    const result = textInputHandler(el, makeContext({
      errors: { fields: { end_date: ['Form error'] } },
      values: { end_date: 'bad' },
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as { errors: string[] }).errors).toEqual(['Form error', 'Rule error']);
    }
  });

  it('produces no ruleErrors when rule condition does not match', () => {
    const el = { type: 'input' as const, kind: 'text' as const, id: 'end_date', label: 'End Date',
      rules: [
        { action: 'error' as const, when: { field: 'end_date', op: 'eq' as const, value: 'bad' }, message: 'Rule error' },
      ],
    };
    const result = textInputHandler(el, makeContext({
      errors: undefined,
      values: { end_date: 'good' },
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as { errors: string[] }).errors).toEqual([]);
    }
  });
});

// ── End-to-end: ValidationRule in walk IR ────────────────────────────────────

const registry = createDefaultRegistry();

describe('end-to-end: ValidationRule produces errors in IR', () => {
  const doc: Document = {
    version: '1',
    elements: [
      {
        type: 'input', kind: 'date', id: 'start_date', label: 'Start Date',
      },
      {
        type: 'input', kind: 'date', id: 'end_date', label: 'End Date',
        rules: [
          {
            action: 'error',
            when: { field: 'end_date', op: 'lte', value: 5 },
            message: 'End date must be after start date',
          } as ValidationRule,
        ],
      },
      { type: 'submit', id: 's', label: 'Submit', route: '/api' },
    ],
  };

  it('produces error on end_date node when end_date lte threshold', () => {
    // end_date = 3, threshold = 5: condition 3 lte 5 is true -> error
    const result = walk(doc, registry, { values: { start_date: 1, end_date: 3 } });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const endDateNode = result.value.find(
      (n): n is { id: string; errors: string[] } => 'id' in n && n.id === 'end_date',
    );
    expect(endDateNode).toBeDefined();
    expect(endDateNode?.errors).toContain('End date must be after start date');
  });

  it('produces no error on end_date node when end_date gt threshold', () => {
    // end_date = 10, threshold = 5: condition 10 lte 5 is false -> no error
    const result = walk(doc, registry, { values: { start_date: 1, end_date: 10 } });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const endDateNode = result.value.find(
      (n): n is { id: string; errors: string[] } => 'id' in n && n.id === 'end_date',
    );
    expect(endDateNode).toBeDefined();
    expect(endDateNode?.errors).toEqual([]);
  });

  it('does not hide end_date when ValidationRule fires (ValidationRule does not affect visibility)', () => {
    const result = walk(doc, registry, { values: { start_date: 1, end_date: 3 } });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const ids = result.value
      .filter((n): n is { id: string } => 'id' in n)
      .map((n) => n.id);
    expect(ids).toContain('end_date');
  });
});

// ── ValidationRule is NOT evaluated when no values context (static render) ───

describe('ValidationRule not evaluated without values context', () => {
  const doc: Document = {
    version: '1',
    elements: [
      {
        type: 'input', kind: 'text', id: 'end_date', label: 'End Date',
        rules: [
          {
            action: 'error',
            when: { field: 'end_date', op: 'lte', value: 5 },
            message: 'End date must be after start date',
          } as ValidationRule,
        ],
      },
    ],
  };

  it('produces no errors on static render (no values)', () => {
    const result = walk(doc, registry);
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;

    const endDateNode = result.value.find(
      (n): n is { id: string; errors: string[] } => 'id' in n && n.id === 'end_date',
    );
    expect(endDateNode).toBeDefined();
    expect(endDateNode?.errors).toEqual([]);
  });

  it('produces no errors via textInputHandler when values is undefined', () => {
    const el = {
      type: 'input' as const,
      kind: 'text' as const,
      id: 'end_date',
      label: 'End Date',
      rules: [
        { action: 'error' as const, when: { field: 'end_date', op: 'lte' as const, value: 5 }, message: 'End date error' },
      ],
    };
    const result = textInputHandler(el, makeContext({ values: undefined }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as { errors: string[] }).errors).toEqual([]);
    }
  });

  it('produces no errors via textInputHandler when rules array is empty', () => {
    const el = {
      type: 'input' as const,
      kind: 'text' as const,
      id: 'end_date',
      label: 'End Date',
      rules: [],
    };
    const result = textInputHandler(el, makeContext({ values: { end_date: 'anything' } }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect((result.value as { errors: string[] }).errors).toEqual([]);
    }
  });
});
