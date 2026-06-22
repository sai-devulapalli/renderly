import type { Rule, RuleCondition, FieldValues, ValidationRule } from '@renderly/schema';

export interface RuleEffect {
  /** Whether the element should appear in the IR output. */
  readonly visible: boolean;
  /** When defined, overrides the element's own required property. */
  readonly requiredOverride?: boolean;
  /** Validation error messages (populated by evaluateValidationRules, not applyRules). */
  readonly errors: readonly string[];
}

export function evaluateCondition(
  condition: RuleCondition,
  values: FieldValues,
): boolean {
  const raw = values[condition.field];
  const { op, value } = condition;

  switch (op) {
    case 'eq':
      return raw === value;
    case 'neq':
      return raw !== value;
    case 'gt':
      return typeof raw === 'number' && typeof value === 'number' && raw > value;
    case 'gte':
      return typeof raw === 'number' && typeof value === 'number' && raw >= value;
    case 'lt':
      return typeof raw === 'number' && typeof value === 'number' && raw < value;
    case 'lte':
      return typeof raw === 'number' && typeof value === 'number' && raw <= value;
    case 'in': {
      if (!Array.isArray(value)) return false;
      return (value as ReadonlyArray<unknown>).includes(raw);
    }
    case 'nin': {
      if (!Array.isArray(value)) return true;
      return !(value as ReadonlyArray<unknown>).includes(raw);
    }
    case 'empty':
      return raw === undefined || raw === '' || (Array.isArray(raw) && raw.length === 0);
    case 'notempty':
      return !(raw === undefined || raw === '' || (Array.isArray(raw) && raw.length === 0));
    default:
      return false;
  }
}

/**
 * Evaluates all rules in order; last matching rule for each dimension wins.
 * When values is provided, rules that reference unknown fields simply evaluate
 * to false (field is treated as empty/undefined).
 */
export function applyRules(rules: readonly Rule[], values: FieldValues): RuleEffect {
  let visible = true;
  let requiredOverride: boolean | undefined;

  for (const rule of rules) {
    if (evaluateCondition(rule.when, values)) {
      if (rule.action === 'hide')     visible = false;
      if (rule.action === 'show')     visible = true;
      if (rule.action === 'require')  requiredOverride = true;
      if (rule.action === 'optional') requiredOverride = false;
    }
  }

  return { visible, requiredOverride, errors: [] };
}

/**
 * Evaluates ValidationRules (action: 'error') on an element's rule list.
 * Returns the error messages for all rules whose condition is currently true.
 * Only call this when a values context is available — skip on static renders.
 */
export function evaluateValidationRules(
  rules: readonly Rule[],
  values: FieldValues,
): readonly string[] {
  const errors: string[] = [];
  for (const rule of rules) {
    if (rule.action === 'error' && evaluateCondition(rule.when, values)) {
      errors.push((rule as ValidationRule).message);
    }
  }
  return errors;
}
