import type {
  ContainerElement,
  HeadingElement,
  TextElement,
  TextInputElement,
  NumberInputElement,
  DateInputElement,
  ChoiceInputElement,
  SubmitElement,
  RepeatElement,
  FileInputElement,
  SignatureElement,
  CustomElement,
  IRContainerNode,
  IRHeadingNode,
  IRTextNode,
  IRInputTextNode,
  IRInputNumberNode,
  IRInputDateNode,
  IRInputChoiceNode,
  IRSubmitNode,
  IRFormErrorNode,
  IRFieldErrorNode,
  IRRepeatNode,
  IRRepeatItemNode,
  IRNode,
  IRInputFileNode,
  IRSignatureNode,
  IRCustomNode,
} from '@renderly/schema';
import {
  DEFAULT_DIRECTION,
  DEFAULT_GAP,
  DEFAULT_HEADING_SIZE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_COLOR_INTENT,
} from '@renderly/schema';

export function buildContainerNode(
  el: ContainerElement,
  children: readonly IRNode[],
): IRContainerNode {
  return {
    type: 'container',
    id: el.id,
    direction: el.direction ?? DEFAULT_DIRECTION,
    gap: el.gap ?? DEFAULT_GAP,
    cols: el.cols,
    children,
  };
}

export function buildHeadingNode(el: HeadingElement): IRHeadingNode {
  return {
    type: 'heading',
    id: el.id,
    level: el.level,
    text: el.text,
    size: el.size ?? DEFAULT_HEADING_SIZE,
    children: [],
  };
}

export function buildTextNode(el: TextElement): IRTextNode {
  return {
    type: 'text',
    id: el.id,
    content: el.content,
    weight: el.weight ?? DEFAULT_FONT_WEIGHT,
    intent: el.intent ?? DEFAULT_COLOR_INTENT,
    children: [],
  };
}

export function buildInputTextNode(
  el: TextInputElement,
  errors: readonly string[],
): IRInputTextNode {
  return {
    type: 'input-text',
    id: el.id,
    label: el.label,
    placeholder: el.placeholder,
    required: el.required ?? false,
    minLength: el.minLength,
    maxLength: el.maxLength,
    errors,
    children: [],
  };
}

export function buildInputNumberNode(
  el: NumberInputElement,
  errors: readonly string[],
): IRInputNumberNode {
  return {
    type: 'input-number',
    id: el.id,
    label: el.label,
    placeholder: el.placeholder,
    required: el.required ?? false,
    min: el.min,
    max: el.max,
    errors,
    children: [],
  };
}

export function buildInputDateNode(
  el: DateInputElement,
  errors: readonly string[],
): IRInputDateNode {
  return {
    type: 'input-date',
    id: el.id,
    label: el.label,
    required: el.required ?? false,
    min: el.min,
    max: el.max,
    errors,
    children: [],
  };
}

export function buildInputChoiceNode(
  el: ChoiceInputElement,
  errors: readonly string[],
  value?: string | readonly string[],
): IRInputChoiceNode {
  return {
    type: 'input-choice',
    id: el.id,
    label: el.label,
    required: el.required ?? false,
    multiple: el.multiple ?? false,
    options: el.options,
    errors,
    children: [],
    ...(value !== undefined ? { value } : {}),
  };
}

export function buildSubmitNode(el: SubmitElement): IRSubmitNode {
  return {
    type: 'submit',
    id: el.id,
    label: el.label,
    route: el.route,
    context: el.context ?? {},
    children: [],
  };
}

export function buildFormErrorNode(message: string): IRFormErrorNode {
  return { type: 'error-form', id: undefined, message, children: [] };
}

export function buildFieldErrorNode(fieldId: string, message: string): IRFieldErrorNode {
  return { type: 'error-field', id: undefined, fieldId, message, children: [] };
}

export function buildRepeatNode(
  el: RepeatElement,
  items: readonly IRRepeatItemNode[],
  errors: readonly string[],
): IRRepeatNode {
  return {
    type: 'repeat',
    id: el.id,
    label: el.label,
    minItems: el.minItems ?? 1,
    maxItems: el.maxItems,
    addLabel: el.addLabel ?? 'Add item',
    removeLabel: el.removeLabel ?? 'Remove',
    items,
    errors,
    children: [],
  };
}

export function buildRepeatItemNode(
  index: number,
  children: readonly IRNode[],
): IRRepeatItemNode {
  return { type: 'repeat-item', index, children };
}

export function buildInputFileNode(
  el: FileInputElement,
  errors: readonly string[],
): IRInputFileNode {
  return {
    type: 'input-file',
    id: el.id,
    label: el.label,
    accept: el.accept,
    multiple: el.multiple ?? false,
    required: el.required ?? false,
    errors,
    children: [],
  };
}

export function buildSignatureNode(
  el: SignatureElement,
  errors: readonly string[],
): IRSignatureNode {
  return {
    type: 'signature',
    id: el.id,
    label: el.label,
    required: el.required ?? false,
    errors,
    children: [],
  };
}

export function buildCustomNode(
  el: CustomElement,
  errors: readonly string[],
): IRCustomNode {
  return {
    type: 'custom',
    kind: el.kind,
    id: el.id,
    label: el.label,
    props: el.props ?? {},
    errors,
    children: [],
  };
}
