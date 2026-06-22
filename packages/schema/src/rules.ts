// ── Field values ──────────────────────────────────────────────────────────────
// Used both here (rule evaluation) and in @renderly/submit (payload building).

export type FieldValue = string | number | readonly string[];

export type FieldValues = Readonly<Record<string, FieldValue | undefined>>;

// ── Rule DSL ──────────────────────────────────────────────────────────────────

export type RuleOperator =
  | 'eq'       // field === value
  | 'neq'      // field !== value
  | 'gt'       // field > value (numbers)
  | 'gte'      // field >= value (numbers)
  | 'lt'       // field < value (numbers)
  | 'lte'      // field <= value (numbers)
  | 'in'       // field is one of the values array
  | 'nin'      // field is not one of the values array
  | 'empty'    // field is undefined / '' / []
  | 'notempty'; // field is defined and non-empty

export type RuleAction =
  | 'hide'     // exclude this element from the IR
  | 'show'     // include this element (overrides a previous hide rule)
  | 'require'  // override required = true on the IR node
  | 'optional'; // override required = false on the IR node

export interface RuleCondition {
  /** The id of the field whose current value is tested. */
  readonly field: string;
  readonly op: RuleOperator;
  /** Required for eq/neq/gt/gte/lt/lte; array required for in/nin; omit for empty/notempty. */
  readonly value?: string | number | readonly (string | number)[];
}

/** Visibility / required-override rule — controls whether the element appears in the IR. */
export interface ConditionalRule {
  readonly action: RuleAction;
  readonly when: RuleCondition;
}

/**
 * Cross-field validation rule.
 * When `when` evaluates to true, `message` is added to the field's errors array.
 * Only evaluated when a values context is present (not on initial/static render).
 *
 * Example: validate end_date > start_date on the end_date field:
 *   { action: 'error', when: { field: 'end_date', op: 'lte', value: ... }, message: '...' }
 *
 * Note: for comparisons between two fields, the condition references one field's current
 * value directly. The host application should pass pre-validated FormErrors for complex
 * server-side cross-field logic.
 */
export interface ValidationRule {
  readonly action: 'error';
  readonly when: RuleCondition;
  readonly message: string;
}

export type Rule = ConditionalRule | ValidationRule;
