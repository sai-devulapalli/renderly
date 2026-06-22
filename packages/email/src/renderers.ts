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
  IRInputFileNode,
  IRSignatureNode,
  IRCustomNode,
  IRRepeatNode,
  ColorIntent,
  FontWeight,
} from '@renderly/schema';
import { ok } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import { escapeHtml } from './escape.js';
import type { EmailError } from './errors.js';
import type { RenderChildrenFn } from './types.js';

// ── style constants ───────────────────────────────────────────────────────────

const FONT_FAMILY = 'Arial,Helvetica,sans-serif';
const BASE_COLOR = '#222222';

const INTENT_COLOR: Record<ColorIntent, string> = {
  default: '#222222',
  accent:  '#0055cc',
  good:    '#1a7a1a',
  danger:  '#cc2200',
  muted:   '#888888',
};

const WEIGHT_VALUE: Record<FontWeight, string> = {
  normal: '400',
  medium: '500',
  bold:   '700',
};

const HEADING_SIZE: Record<number, string> = {
  1: '28px', 2: '24px', 3: '20px', 4: '18px', 5: '16px', 6: '14px',
};

function labelStyle(required: boolean): string {
  const base = `display:block;font-family:${FONT_FAMILY};font-size:12px;color:#555555;margin-bottom:4px;`;
  return required ? base + 'font-weight:600;' : base;
}

function fieldBoxStyle(): string {
  return `display:block;font-family:${FONT_FAMILY};font-size:14px;color:#aaaaaa;`
    + `border:1px solid #cccccc;border-radius:3px;padding:8px 10px;`
    + `background-color:#f9f9f9;`;
}

function fieldWrapStyle(): string {
  return 'margin-bottom:14px;';
}

function renderFieldErrors(errors: readonly string[]): string {
  if (errors.length === 0) return '';
  const items = errors
    .map((e) => `<div style="font-family:${FONT_FAMILY};font-size:12px;color:#cc2200;margin-top:3px;">${escapeHtml(e)}</div>`)
    .join('');
  return items;
}

// ── element renderers ─────────────────────────────────────────────────────────

export function renderContainer(
  node: IRContainerNode,
  renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const childrenResult = renderChildren(node.children);
  if (!childrenResult.ok) return childrenResult;
  const id = node.id !== undefined ? ` id="${escapeHtml(node.id)}"` : '';
  return ok(
    `<div${id} style="margin-bottom:16px;">${childrenResult.value}</div>`,
  );
}

export function renderHeading(
  node: IRHeadingNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const id = node.id !== undefined ? ` id="${escapeHtml(node.id)}"` : '';
  const size = HEADING_SIZE[node.level] ?? '16px';
  const style = `font-family:${FONT_FAMILY};font-size:${size};`
    + `color:${BASE_COLOR};font-weight:700;margin:0 0 12px 0;padding:0;line-height:1.3;`;
  return ok(`<h${node.level}${id} style="${style}">${escapeHtml(node.text)}</h${node.level}>`);
}

export function renderText(
  node: IRTextNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const id = node.id !== undefined ? ` id="${escapeHtml(node.id)}"` : '';
  const color = INTENT_COLOR[node.intent];
  const weight = WEIGHT_VALUE[node.weight];
  const style = `font-family:${FONT_FAMILY};font-size:14px;`
    + `color:${color};font-weight:${weight};margin:0 0 10px 0;padding:0;line-height:1.5;`;
  return ok(`<p${id} style="${style}">${escapeHtml(node.content)}</p>`);
}

export function renderInputText(
  node: IRInputTextNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const requiredMark = node.required ? ' <span style="color:#cc2200;">*</span>' : '';
  const placeholder = node.placeholder ?? 'Enter text…';
  return ok(
    `<div style="${fieldWrapStyle()}">` +
    `<span style="${labelStyle(node.required)}">${escapeHtml(node.label)}${requiredMark}</span>` +
    `<span style="${fieldBoxStyle()}">${escapeHtml(placeholder)}</span>` +
    renderFieldErrors(node.errors) +
    `</div>`,
  );
}

export function renderInputNumber(
  node: IRInputNumberNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const requiredMark = node.required ? ' <span style="color:#cc2200;">*</span>' : '';
  const placeholder = node.placeholder ?? 'Enter number…';
  return ok(
    `<div style="${fieldWrapStyle()}">` +
    `<span style="${labelStyle(node.required)}">${escapeHtml(node.label)}${requiredMark}</span>` +
    `<span style="${fieldBoxStyle()}">${escapeHtml(placeholder)}</span>` +
    renderFieldErrors(node.errors) +
    `</div>`,
  );
}

export function renderInputDate(
  node: IRInputDateNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const requiredMark = node.required ? ' <span style="color:#cc2200;">*</span>' : '';
  return ok(
    `<div style="${fieldWrapStyle()}">` +
    `<span style="${labelStyle(node.required)}">${escapeHtml(node.label)}${requiredMark}</span>` +
    `<span style="${fieldBoxStyle()}">MM / DD / YYYY</span>` +
    renderFieldErrors(node.errors) +
    `</div>`,
  );
}

export function renderInputChoice(
  node: IRInputChoiceNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const requiredMark = node.required ? ' <span style="color:#cc2200;">*</span>' : '';
  const optionStyle = `display:inline-block;font-family:${FONT_FAMILY};font-size:13px;`
    + `color:#444444;background-color:#eeeeee;border-radius:3px;`
    + `padding:3px 8px;margin:2px 4px 2px 0;`;
  const options = node.options
    .map((o) => `<span style="${optionStyle}">${escapeHtml(o.label)}</span>`)
    .join('');
  const hint = node.multiple ? 'Select all that apply' : 'Select one';
  const hintStyle = `font-family:${FONT_FAMILY};font-size:11px;color:#888888;margin-bottom:6px;display:block;`;
  return ok(
    `<div style="${fieldWrapStyle()}">` +
    `<span style="${labelStyle(node.required)}">${escapeHtml(node.label)}${requiredMark}</span>` +
    `<span style="${hintStyle}">${hint}</span>` +
    `<div>${options}</div>` +
    renderFieldErrors(node.errors) +
    `</div>`,
  );
}

export function renderSubmit(
  node: IRSubmitNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const btnStyle = `display:inline-block;font-family:${FONT_FAMILY};font-size:14px;`
    + `color:#ffffff;background-color:#0055cc;font-weight:600;`
    + `text-decoration:none;padding:10px 20px;border-radius:4px;`
    + `mso-padding-alt:0;text-align:center;`;
  return ok(
    `<div style="margin-top:20px;text-align:left;">` +
    `<a href="${escapeHtml(node.route)}" id="${escapeHtml(node.id)}" ` +
    `style="${btnStyle}">${escapeHtml(node.label)}</a>` +
    `</div>`,
  );
}

export function renderFormError(
  node: IRFormErrorNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const style = `font-family:${FONT_FAMILY};font-size:14px;color:#cc2200;`
    + `background-color:#fff0ee;border:1px solid #ffb3aa;border-radius:4px;`
    + `padding:10px 14px;margin-bottom:14px;`;
  return ok(`<div role="alert" style="${style}">${escapeHtml(node.message)}</div>`);
}

export function renderFieldError(
  node: IRFieldErrorNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const style = `font-family:${FONT_FAMILY};font-size:13px;color:#cc2200;`
    + `background-color:#fff0ee;border-left:3px solid #cc2200;`
    + `padding:6px 10px;margin-bottom:8px;`;
  return ok(
    `<div role="alert" style="${style}" data-field-id="${escapeHtml(node.fieldId)}">${escapeHtml(node.message)}</div>`,
  );
}

// Email is a static read-only format — repeat renders items as bordered sections,
// with no add/remove controls.
export function renderRepeat(
  node: IRRepeatNode,
  renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const id = node.id !== undefined ? ` id="${escapeHtml(node.id)}"` : '';
  const labelStyle = `font-family:${FONT_FAMILY};font-size:13px;color:#555555;`
    + `font-weight:600;margin:0 0 8px 0;display:block;`;
  let out = `<div${id} style="${fieldWrapStyle()}">`;
  out += `<span style="${labelStyle}">${escapeHtml(node.label)}</span>`;
  for (const item of node.items) {
    const childResult = renderChildren(item.children);
    if (!childResult.ok) return childResult;
    const itemStyle = `border:1px solid #dddddd;border-radius:4px;`
      + `padding:10px 14px;margin-bottom:8px;`;
    out += `<div style="${itemStyle}">${childResult.value}</div>`;
  }
  out += renderFieldErrors(node.errors);
  out += `</div>`;
  return ok(out);
}

export function renderInputFile(
  node: IRInputFileNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const requiredMark = node.required ? ' <span style="color:#cc2200;">*</span>' : '';
  const hint = node.multiple ? 'Attach files' : 'Attach a file';
  return ok(
    `<div style="${fieldWrapStyle()}">` +
    `<span style="${labelStyle(node.required)}">${escapeHtml(node.label)}${requiredMark}</span>` +
    `<span style="${fieldBoxStyle()}">${escapeHtml(hint)}</span>` +
    renderFieldErrors(node.errors) +
    `</div>`,
  );
}

export function renderSignature(
  node: IRSignatureNode,
  _renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const requiredMark = node.required ? ' <span style="color:#cc2200;">*</span>' : '';
  const boxStyle = `display:block;width:200px;height:60px;`
    + `border:1px dashed #aaaaaa;border-radius:4px;background-color:#f9f9f9;`;
  return ok(
    `<div style="${fieldWrapStyle()}">` +
    `<span style="${labelStyle(node.required)}">${escapeHtml(node.label)}${requiredMark}</span>` +
    `<div style="${boxStyle}"></div>` +
    renderFieldErrors(node.errors) +
    `</div>`,
  );
}

export function renderCustom(
  node: IRCustomNode,
  renderChildren: RenderChildrenFn,
): Result<string, EmailError> {
  const childResult = renderChildren(node.children);
  if (!childResult.ok) return childResult;
  const id = node.id ? ` id="${escapeHtml(node.id)}"` : '';
  return ok(
    `<div${id} data-custom-kind="${escapeHtml(node.kind)}">${childResult.value}</div>`,
  );
}
