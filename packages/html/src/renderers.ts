import type {
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
  IRInputFileNode,
  IRSignatureNode,
  IRCustomNode,
  Responsive,
  ResponsiveValue,
} from '@renderly/schema';
import { BREAKPOINTS } from '@renderly/schema';
import { ok } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import { escapeHtml } from './escape.js';
import type { HtmlError } from './errors.js';
import type { RenderChildrenFn } from './types.js';

function responsiveAttr<T extends string | number>(name: string, value: Responsive<T>): string {
  if (typeof value !== 'object' || value === null) {
    return ` data-${name}="${escapeHtml(String(value))}"`;
  }
  const obj = value as ResponsiveValue<T>;
  const parts: string[] = [];
  if (obj.default !== undefined) parts.push(` data-${name}="${escapeHtml(String(obj.default))}"`);
  for (const bp of BREAKPOINTS) {
    const v = obj[bp];
    if (v !== undefined) parts.push(` data-${bp}-${name}="${escapeHtml(String(v))}"`);
  }
  return parts.join('');
}

function renderErrors(errors: readonly string[]): string {
  if (errors.length === 0) return '';
  const items = errors.map((e) => `<li class="field-error">${escapeHtml(e)}</li>`).join('');
  return `<ul class="field-errors" aria-live="polite">${items}</ul>`;
}

export function renderContainer(
  node: IRContainerNode,
  renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const childrenResult = renderChildren(node.children);
  if (!childrenResult.ok) return childrenResult;
  const id = node.id !== undefined ? ` id="${escapeHtml(node.id)}"` : '';
  const direction = responsiveAttr('direction', node.direction);
  const gap = responsiveAttr('gap', node.gap);
  const cols = node.cols !== undefined ? responsiveAttr('cols', node.cols) : '';
  return ok(`<div${id}${direction}${gap}${cols}>${childrenResult.value}</div>`);
}

export function renderHeading(
  node: IRHeadingNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const id = node.id !== undefined ? ` id="${escapeHtml(node.id)}"` : '';
  return ok(`<h${node.level}${id} data-size="${node.size}">${escapeHtml(node.text)}</h${node.level}>`);
}

export function renderText(
  node: IRTextNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const id = node.id !== undefined ? ` id="${escapeHtml(node.id)}"` : '';
  return ok(`<p${id} data-weight="${node.weight}" data-intent="${node.intent}">${escapeHtml(node.content)}</p>`);
}

export function renderInputText(
  node: IRInputTextNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const required = node.required ? ' required' : '';
  const placeholder = node.placeholder !== undefined
    ? ` placeholder="${escapeHtml(node.placeholder)}"` : '';
  const minLength = node.minLength !== undefined ? ` minlength="${node.minLength}"` : '';
  const maxLength = node.maxLength !== undefined ? ` maxlength="${node.maxLength}"` : '';
  return ok(
    `<div class="field" id="field-${escapeHtml(node.id)}">` +
    `<label for="${escapeHtml(node.id)}">${escapeHtml(node.label)}</label>` +
    `<input type="text" id="${escapeHtml(node.id)}" name="${escapeHtml(node.id)}"` +
    `${required}${placeholder}${minLength}${maxLength} />` +
    renderErrors(node.errors) +
    `</div>`,
  );
}

export function renderInputNumber(
  node: IRInputNumberNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const required = node.required ? ' required' : '';
  const placeholder = node.placeholder !== undefined
    ? ` placeholder="${escapeHtml(node.placeholder)}"` : '';
  const min = node.min !== undefined ? ` min="${node.min}"` : '';
  const max = node.max !== undefined ? ` max="${node.max}"` : '';
  return ok(
    `<div class="field" id="field-${escapeHtml(node.id)}">` +
    `<label for="${escapeHtml(node.id)}">${escapeHtml(node.label)}</label>` +
    `<input type="number" id="${escapeHtml(node.id)}" name="${escapeHtml(node.id)}"` +
    `${required}${placeholder}${min}${max} />` +
    renderErrors(node.errors) +
    `</div>`,
  );
}

export function renderInputDate(
  node: IRInputDateNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const required = node.required ? ' required' : '';
  const min = node.min !== undefined ? ` min="${escapeHtml(node.min)}"` : '';
  const max = node.max !== undefined ? ` max="${escapeHtml(node.max)}"` : '';
  return ok(
    `<div class="field" id="field-${escapeHtml(node.id)}">` +
    `<label for="${escapeHtml(node.id)}">${escapeHtml(node.label)}</label>` +
    `<input type="date" id="${escapeHtml(node.id)}" name="${escapeHtml(node.id)}"` +
    `${required}${min}${max} />` +
    renderErrors(node.errors) +
    `</div>`,
  );
}

export function renderInputChoice(
  node: IRInputChoiceNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const inputType = node.multiple ? 'checkbox' : 'radio';
  const required = node.required ? ' required' : '';

  const selectedValues: string[] = Array.isArray(node.value)
    ? [...(node.value as readonly string[])]
    : typeof node.value === 'string' ? [node.value] : [];

  const items = node.options.map((o) => {
    const optId = `${escapeHtml(node.id)}-${escapeHtml(o.value)}`;
    const checked = selectedValues.includes(o.value) ? ' checked' : '';
    return (
      `<label class="choice-option">` +
      `<input type="${inputType}" id="${optId}" name="${escapeHtml(node.id)}"` +
      ` value="${escapeHtml(o.value)}"${required}${checked} />` +
      `${escapeHtml(o.label)}` +
      `</label>`
    );
  }).join('');

  return ok(
    `<fieldset class="field choice-group" id="field-${escapeHtml(node.id)}">` +
    `<legend>${escapeHtml(node.label)}${node.required ? ' <span aria-hidden="true">*</span>' : ''}</legend>` +
    items +
    renderErrors(node.errors) +
    `</fieldset>`,
  );
}

export function renderSubmit(
  node: IRSubmitNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  return ok(
    `<button type="submit" id="${escapeHtml(node.id)}" data-route="${escapeHtml(node.route)}">${escapeHtml(node.label)}</button>`,
  );
}

export function renderFormError(
  node: IRFormErrorNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  return ok(`<div role="alert" class="error error--form">${escapeHtml(node.message)}</div>`);
}

export function renderFieldError(
  node: IRFieldErrorNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  return ok(
    `<div role="alert" class="error error--field" data-field-id="${escapeHtml(node.fieldId)}">${escapeHtml(node.message)}</div>`,
  );
}

export function renderRepeat(
  node: IRRepeatNode,
  renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const errorsHtml = renderErrors(node.errors);
  let itemsHtml = '';
  for (const item of node.items) {
    const childrenResult = renderChildren(item.children);
    if (!childrenResult.ok) return childrenResult;
    itemsHtml +=
      `<div class="renderly-repeat__item" data-index="${item.index}">` +
      childrenResult.value +
      `<button type="button" class="renderly-repeat__remove"` +
      ` data-action="repeat-remove" data-target="${escapeHtml(node.id)}"` +
      ` data-index="${item.index}">${escapeHtml(node.removeLabel)}</button>` +
      `</div>`;
  }
  const canAdd = node.maxItems === undefined || node.items.length < node.maxItems;
  const addBtn = canAdd
    ? `<button type="button" class="renderly-repeat__add"` +
      ` data-action="repeat-add" data-target="${escapeHtml(node.id)}">${escapeHtml(node.addLabel)}</button>`
    : '';
  const maxAttr = node.maxItems !== undefined ? ` data-max="${node.maxItems}"` : '';
  return ok(
    `<fieldset class="renderly-repeat" id="field-${escapeHtml(node.id)}"` +
    ` data-min="${node.minItems}"${maxAttr}>` +
    `<legend>${escapeHtml(node.label)}</legend>` +
    errorsHtml +
    itemsHtml +
    addBtn +
    `</fieldset>`,
  );
}

export function renderInputFile(
  node: IRInputFileNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const required = node.required ? ' required' : '';
  const accept = node.accept !== undefined ? ` accept="${escapeHtml(node.accept)}"` : '';
  const multiple = node.multiple ? ' multiple' : '';
  return ok(
    `<div class="field" id="field-${escapeHtml(node.id)}">` +
    `<label for="${escapeHtml(node.id)}">${escapeHtml(node.label)}</label>` +
    `<input type="file" id="${escapeHtml(node.id)}" name="${escapeHtml(node.id)}"` +
    `${required}${accept}${multiple} />` +
    renderErrors(node.errors) +
    `</div>`,
  );
}

export function renderSignature(
  node: IRSignatureNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const required = node.required ? ' required' : '';
  return ok(
    `<div class="field renderly-signature" id="field-${escapeHtml(node.id)}">` +
    `<label for="${escapeHtml(node.id)}">${escapeHtml(node.label)}</label>` +
    `<div class="renderly-signature__pad" data-target="${escapeHtml(node.id)}" role="img" aria-label="Signature pad"></div>` +
    `<input type="hidden" id="${escapeHtml(node.id)}" name="${escapeHtml(node.id)}"${required} />` +
    renderErrors(node.errors) +
    `</div>`,
  );
}

export function renderCustom(
  node: IRCustomNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const label = node.label !== undefined
    ? `<span class="renderly-custom__label">${escapeHtml(node.label)}</span>`
    : '';
  return ok(
    `<div class="renderly-custom" id="field-${escapeHtml(node.id)}" data-kind="${escapeHtml(node.kind)}">` +
    label +
    renderErrors(node.errors) +
    `</div>`,
  );
}
