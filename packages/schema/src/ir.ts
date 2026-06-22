import type {
  ColorIntent,
  Direction,
  FontWeight,
  HeadingLevel,
  Responsive,
  SpacingSize,
  TextSize,
} from './tokens.js';
import type { ChoiceOption } from './elements.js';

// ── IR nodes — all defaults resolved; text NOT yet escaped ───────────────────

export interface IRContainerNode {
  readonly type: 'container';
  readonly id: string | undefined;
  readonly direction: Responsive<Direction>;
  readonly gap: Responsive<SpacingSize>;
  /** Undefined when the author did not specify cols — output adapters use flex layout. */
  readonly cols: Responsive<number> | undefined;
  readonly children: readonly IRNode[];
}

export interface IRHeadingNode {
  readonly type: 'heading';
  readonly id: string | undefined;
  readonly level: HeadingLevel;
  readonly text: string;
  readonly size: TextSize;
  readonly children: readonly IRNode[];
}

export interface IRTextNode {
  readonly type: 'text';
  readonly id: string | undefined;
  readonly content: string;
  readonly weight: FontWeight;
  readonly intent: ColorIntent;
  readonly children: readonly IRNode[];
}

export interface IRInputTextNode {
  readonly type: 'input-text';
  readonly id: string;
  readonly label: string;
  readonly placeholder: string | undefined;
  readonly required: boolean;
  readonly minLength: number | undefined;
  readonly maxLength: number | undefined;
  readonly errors: readonly string[];
  readonly children: readonly IRNode[];
}

export interface IRInputNumberNode {
  readonly type: 'input-number';
  readonly id: string;
  readonly label: string;
  readonly placeholder: string | undefined;
  readonly required: boolean;
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly errors: readonly string[];
  readonly children: readonly IRNode[];
}

export interface IRInputDateNode {
  readonly type: 'input-date';
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly min: string | undefined;
  readonly max: string | undefined;
  readonly errors: readonly string[];
  readonly children: readonly IRNode[];
}

export interface IRInputChoiceNode {
  readonly type: 'input-choice';
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly multiple: boolean;
  readonly options: readonly ChoiceOption[];
  readonly errors: readonly string[];
  readonly children: readonly IRNode[];
  /** Selected value(s) when rendered with a values context. */
  readonly value?: string | readonly string[];
}

export interface IRSubmitNode {
  readonly type: 'submit';
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly context: Readonly<Record<string, unknown>>;
  readonly children: readonly IRNode[];
}

export interface IRFormErrorNode {
  readonly type: 'error-form';
  readonly id: undefined;
  readonly message: string;
  readonly children: readonly IRNode[];
}

export interface IRFieldErrorNode {
  readonly type: 'error-field';
  readonly id: undefined;
  readonly fieldId: string;
  readonly message: string;
  readonly children: readonly IRNode[];
}

export interface IRInputFileNode {
  readonly type: 'input-file';
  readonly id: string;
  readonly label: string;
  readonly accept: string | undefined;
  readonly multiple: boolean;
  readonly required: boolean;
  readonly errors: readonly string[];
  readonly children: readonly IRNode[];
}

export interface IRSignatureNode {
  readonly type: 'signature';
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly errors: readonly string[];
  readonly children: readonly IRNode[];
}

export interface IRCustomNode {
  readonly type: 'custom';
  readonly kind: string;
  readonly id: string;
  readonly label: string | undefined;
  readonly props: Readonly<Record<string, unknown>>;
  readonly errors: readonly string[];
  readonly children: readonly IRNode[];
}

export interface IRRepeatNode {
  readonly type: 'repeat';
  readonly id: string;
  readonly label: string;
  readonly minItems: number;
  readonly maxItems: number | undefined;
  readonly addLabel: string;
  readonly removeLabel: string;
  readonly items: readonly IRRepeatItemNode[];
  readonly errors: readonly string[];
  readonly children: readonly IRNode[];
}

export interface IRRepeatItemNode {
  readonly type: 'repeat-item';
  readonly index: number;
  readonly children: readonly IRNode[];
}

export type IRNode =
  | IRContainerNode
  | IRHeadingNode
  | IRTextNode
  | IRInputTextNode
  | IRInputNumberNode
  | IRInputDateNode
  | IRInputChoiceNode
  | IRSubmitNode
  | IRFormErrorNode
  | IRFieldErrorNode
  | IRInputFileNode
  | IRSignatureNode
  | IRCustomNode
  | IRRepeatNode
  | IRRepeatItemNode;

export type IRNodeType = IRNode['type'];

// ── IR type guards ────────────────────────────────────────────────────────────

export function isIRContainerNode(n: IRNode): n is IRContainerNode {
  return n.type === 'container';
}

export function isIRHeadingNode(n: IRNode): n is IRHeadingNode {
  return n.type === 'heading';
}

export function isIRTextNode(n: IRNode): n is IRTextNode {
  return n.type === 'text';
}

export function isIRInputNode(n: IRNode): n is IRInputTextNode | IRInputNumberNode | IRInputDateNode | IRInputChoiceNode {
  return n.type === 'input-text' || n.type === 'input-number' || n.type === 'input-date' || n.type === 'input-choice';
}

export function isIRSubmitNode(n: IRNode): n is IRSubmitNode {
  return n.type === 'submit';
}

export function isIRFormErrorNode(n: IRNode): n is IRFormErrorNode {
  return n.type === 'error-form';
}

export function isIRFieldErrorNode(n: IRNode): n is IRFieldErrorNode {
  return n.type === 'error-field';
}
