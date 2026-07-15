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
} from '@renderly/schema';
import { ok, sanitizeUrl } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import { escapeMd } from './escape.js';
import type { MarkdownError } from './errors.js';
import type { RenderChildrenFn } from './types.js';

export function renderContainer(
  node: IRContainerNode,
  renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const result = renderChildren(node.children);
  if (!result.ok) return result;
  return ok(result.value + '\n');
}

export function renderHeading(
  node: IRHeadingNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const hashes = '#'.repeat(node.level);
  return ok(`${hashes} ${escapeMd(node.text)}\n\n`);
}

export function renderText(
  node: IRTextNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const content = node.weight === 'bold'
    ? `**${escapeMd(node.content)}**`
    : escapeMd(node.content);
  return ok(`${content}\n\n`);
}

function requiredBadge(required: boolean): string {
  return required ? ' *(required)*' : '';
}

export function renderInputText(
  node: IRInputTextNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const errors = node.errors.map((e) => `  > ⚠ ${escapeMd(e)}`).join('\n');
  const placeholder = node.placeholder ? ` — _${escapeMd(node.placeholder)}_` : '';
  let out = `**${escapeMd(node.label)}**${requiredBadge(node.required)}${placeholder}\n`;
  if (errors) out += errors + '\n';
  return ok(out + '\n');
}

export function renderInputNumber(
  node: IRInputNumberNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const errors = node.errors.map((e) => `  > ⚠ ${escapeMd(e)}`).join('\n');
  const placeholder = node.placeholder ? ` — _${escapeMd(node.placeholder)}_` : '';
  let out = `**${escapeMd(node.label)}**${requiredBadge(node.required)}${placeholder}\n`;
  if (errors) out += errors + '\n';
  return ok(out + '\n');
}

export function renderInputDate(
  node: IRInputDateNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const errors = node.errors.map((e) => `  > ⚠ ${escapeMd(e)}`).join('\n');
  let out = `**${escapeMd(node.label)}**${requiredBadge(node.required)} — _MM/DD/YYYY_\n`;
  if (errors) out += errors + '\n';
  return ok(out + '\n');
}

export function renderInputChoice(
  node: IRInputChoiceNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const hint = node.multiple ? '_(select all that apply)_' : '_(select one)_';
  const options = node.options
    .map((o) => `- ${escapeMd(o.label)}`)
    .join('\n');
  const errors = node.errors.map((e) => `  > ⚠ ${escapeMd(e)}`).join('\n');
  let out = `**${escapeMd(node.label)}**${requiredBadge(node.required)} ${hint}\n\n${options}\n`;
  if (errors) out += errors + '\n';
  return ok(out + '\n');
}

export function renderSubmit(
  node: IRSubmitNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  return ok(`---\n\n→ **[${escapeMd(node.label)}](${escapeMd(sanitizeUrl(node.route))})**\n\n`);
}

export function renderFormError(
  node: IRFormErrorNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  return ok(`> ⚠ **Form error:** ${escapeMd(node.message)}\n\n`);
}

export function renderFieldError(
  node: IRFieldErrorNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  return ok(`> ⚠ **${escapeMd(node.fieldId)}:** ${escapeMd(node.message)}\n\n`);
}

export function renderRepeat(
  node: IRRepeatNode,
  renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  let out = `**${escapeMd(node.label)}**\n\n`;
  for (const item of node.items) {
    const result = renderChildren(item.children);
    if (!result.ok) return result;
    out += `### Item ${item.index + 1}\n\n${result.value}`;
  }
  const errors = node.errors.map((e) => `  > ⚠ ${escapeMd(e)}`).join('\n');
  if (errors) out += errors + '\n\n';
  return ok(out);
}

export function renderInputFile(
  node: IRInputFileNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const hint = node.multiple ? ' _(multiple files)_' : '';
  const accept = node.accept ? ` — accepts: ${escapeMd(node.accept)}` : '';
  const errors = node.errors.map((e) => `  > ⚠ ${escapeMd(e)}`).join('\n');
  let out = `**${escapeMd(node.label)}**${requiredBadge(node.required)}${hint}${accept}\n`;
  if (errors) out += errors + '\n';
  return ok(out + '\n');
}

export function renderSignature(
  node: IRSignatureNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const errors = node.errors.map((e) => `  > ⚠ ${escapeMd(e)}`).join('\n');
  let out = `**${escapeMd(node.label)}**${requiredBadge(node.required)} — _[signature field]_\n`;
  if (errors) out += errors + '\n';
  return ok(out + '\n');
}

export function renderCustom(
  node: IRCustomNode,
  renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const result = renderChildren(node.children);
  if (!result.ok) return result;
  const label = node.label !== undefined ? `**${escapeMd(node.label)}** — ` : '';
  return ok(`${label}_[${escapeMd(node.kind)}]_\n\n${result.value}`);
}
