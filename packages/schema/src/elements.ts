import type {
  ColorIntent,
  Direction,
  FontWeight,
  HeadingLevel,
  InputKind,
  Responsive,
  SpacingSize,
  TextSize,
} from './tokens.js';
import type { Rule } from './rules.js';

// ── Layout elements ──────────────────────────────────────────────────────────

export interface ContainerElement {
  readonly type: 'container';
  readonly id?: string;
  readonly direction?: Responsive<Direction>;
  readonly gap?: Responsive<SpacingSize>;
  /** Number of grid columns. When set, the container switches from flex to grid layout. */
  readonly cols?: Responsive<number>;
  readonly children: readonly Element[];
  readonly rules?: readonly Rule[];
}

export interface HeadingElement {
  readonly type: 'heading';
  readonly id?: string;
  readonly level: HeadingLevel;
  readonly text: string;
  readonly size?: TextSize;
  readonly rules?: readonly Rule[];
}

export interface TextElement {
  readonly type: 'text';
  readonly id?: string;
  readonly content: string;
  readonly weight?: FontWeight;
  readonly intent?: ColorIntent;
  readonly rules?: readonly Rule[];
}

// ── Input elements ────────────────────────────────────────────────────────────

export interface TextInputElement {
  readonly type: 'input';
  readonly kind: 'text';
  readonly id: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly rules?: readonly Rule[];
}

export interface NumberInputElement {
  readonly type: 'input';
  readonly kind: 'number';
  readonly id: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly rules?: readonly Rule[];
}

export interface DateInputElement {
  readonly type: 'input';
  readonly kind: 'date';
  readonly id: string;
  readonly label: string;
  readonly required?: boolean;
  readonly min?: string;
  readonly max?: string;
  readonly rules?: readonly Rule[];
}

export interface ChoiceOption {
  readonly value: string;
  readonly label: string;
}

export interface ChoiceInputElement {
  readonly type: 'input';
  readonly kind: 'choice';
  readonly id: string;
  readonly label: string;
  readonly required?: boolean;
  readonly multiple?: boolean;
  readonly options: readonly ChoiceOption[];
  readonly rules?: readonly Rule[];
}

export interface FileInputElement {
  readonly type: 'input';
  readonly kind: 'file';
  readonly id: string;
  readonly label: string;
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly required?: boolean;
  readonly rules?: readonly Rule[];
}

export type InputElement =
  | TextInputElement
  | NumberInputElement
  | DateInputElement
  | ChoiceInputElement
  | FileInputElement;

// ── Submit action ─────────────────────────────────────────────────────────────

export interface SubmitElement {
  readonly type: 'submit';
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly context?: Record<string, unknown>;
  readonly rules?: readonly Rule[];
}

// ── Computed / derived field ──────────────────────────────────────────────────

/** Supported output formats for a computed field value. */
export type ComputedFormat = 'number' | 'currency' | 'percent';

/**
 * A read-only field whose value is derived from other fields via a safe
 * arithmetic expression evaluated at walk time.
 *
 * Expression syntax: numeric literals, field references (bare identifiers),
 * +  -  *  /  %  operators, and parentheses.
 *
 * Example: `{ type: 'computed', id: 'bmi', label: 'BMI', expr: 'weight / (height * height)' }`
 */
export interface ComputedElement {
  readonly type: 'computed';
  readonly id: string;
  readonly label: string;
  readonly expr: string;
  readonly format?: ComputedFormat;
  readonly rules?: readonly Rule[];
}

// ── Repeat / array field ─────────────────────────────────────────────────────

/**
 * Renders its `template` N times, once per item.
 * Sub-field values are keyed as `id[index].subFieldId`.
 * Item count is read from `id.__items` in FieldValues, or derived by scanning
 * existing `id[N].*` keys — whichever is larger than minItems.
 */
export interface RepeatElement {
  readonly type: 'repeat';
  readonly id: string;
  readonly label: string;
  readonly template: readonly Element[];
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly addLabel?: string;
  readonly removeLabel?: string;
  readonly rules?: readonly Rule[];
}

/**
 * A canvas-based signature capture widget.
 * The HTML renderer outputs a placeholder div that host JavaScript enhances
 * into an interactive signature pad. The signed value is stored in a hidden input.
 */
export interface SignatureElement {
  readonly type: 'signature';
  readonly id: string;
  readonly label: string;
  readonly required?: boolean;
  readonly rules?: readonly Rule[];
}

/**
 * An escape hatch for field types not built into Renderly.
 * The core walker passes this through as an IRCustomNode; output adapters must
 * register a renderer keyed on `'custom'` to handle it. The default renderers
 * produce a minimal placeholder so the document still renders without errors.
 */
export interface CustomElement {
  readonly type: 'custom';
  readonly kind: string;
  readonly id: string;
  readonly label?: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly rules?: readonly Rule[];
}

// ── Top-level union ───────────────────────────────────────────────────────────

export type Element =
  | ContainerElement
  | HeadingElement
  | TextElement
  | InputElement
  | SubmitElement
  | ComputedElement
  | RepeatElement
  | SignatureElement
  | CustomElement;

export type ElementType = Element['type'];

// ── Type guards ───────────────────────────────────────────────────────────────

export function isContainerElement(el: Element): el is ContainerElement {
  return el.type === 'container';
}

export function isHeadingElement(el: Element): el is HeadingElement {
  return el.type === 'heading';
}

export function isTextElement(el: Element): el is TextElement {
  return el.type === 'text';
}

export function isInputElement(el: Element): el is InputElement {
  return el.type === 'input';
}

export function isSubmitElement(el: Element): el is SubmitElement {
  return el.type === 'submit';
}

export function isTextInput(el: InputElement): el is TextInputElement {
  return el.kind === 'text';
}

export function isNumberInput(el: InputElement): el is NumberInputElement {
  return el.kind === 'number';
}

export function isDateInput(el: InputElement): el is DateInputElement {
  return el.kind === 'date';
}

export function isChoiceInput(el: InputElement): el is ChoiceInputElement {
  return el.kind === 'choice';
}

export function isRepeatElement(el: Element): el is RepeatElement {
  return el.type === 'repeat';
}

export function isSignatureElement(el: Element): el is SignatureElement {
  return el.type === 'signature';
}

export function isCustomElement(el: Element): el is CustomElement {
  return el.type === 'custom';
}

export function isFileInput(el: InputElement): el is FileInputElement {
  return el.kind === 'file';
}

export function inputKindOf(el: InputElement): InputKind {
  return el.kind;
}
