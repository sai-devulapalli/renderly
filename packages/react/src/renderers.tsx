import type { ReactElement } from 'react';
import { ok } from '@renderly/shared';
import type { Result } from '@renderly/shared';
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
  Responsive,
  ResponsiveValue,
  HeadingLevel,
} from '@renderly/schema';
import { BREAKPOINTS } from '@renderly/schema';
import type { ReactError } from './errors.js';
import type { ReactRendererContext } from './types.js';

// React automatically escapes all text content — no manual escapeHtml needed.

type DataAttrProps = { [K: `data-${string}`]: string | number };

function responsiveDataProp<T extends string | number>(
  name: string,
  value: Responsive<T>,
): DataAttrProps {
  if (typeof value !== 'object' || value === null) {
    return { [`data-${name}`]: value as string | number };
  }
  const obj = value as ResponsiveValue<T>;
  const result: DataAttrProps = {};
  if (obj.default !== undefined) result[`data-${name}`] = obj.default;
  for (const bp of BREAKPOINTS) {
    const v = obj[bp];
    if (v !== undefined) result[`data-${bp}-${name}` as `data-${string}`] = v;
  }
  return result;
}

const HEADING_TAGS: Record<HeadingLevel, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
  1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6',
};

function renderErrors(errors: readonly string[]): ReactElement | null {
  if (errors.length === 0) return null;
  return (
    <ul className="field-errors" aria-live="polite">
      {errors.map((e, i) => <li key={i} className="field-error">{e}</li>)}
    </ul>
  );
}

export function renderContainer(
  node: IRContainerNode,
  { renderChildren }: ReactRendererContext,
): Result<ReactElement, ReactError> {
  const childrenResult = renderChildren(node.children);
  if (!childrenResult.ok) return childrenResult;
  const directionProps = responsiveDataProp('direction', node.direction);
  const gapProps = responsiveDataProp('gap', node.gap);
  const colsProps = node.cols !== undefined ? responsiveDataProp('cols', node.cols) : {};
  return ok(
    <div id={node.id} {...directionProps} {...gapProps} {...colsProps}>
      {childrenResult.value}
    </div>,
  );
}

export function renderHeading(
  node: IRHeadingNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  const Tag = HEADING_TAGS[node.level];
  return ok(<Tag id={node.id} data-size={node.size}>{node.text}</Tag>);
}

export function renderText(
  node: IRTextNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <p id={node.id} data-weight={node.weight} data-intent={node.intent}>
      {node.content}
    </p>,
  );
}

export function renderInputText(
  node: IRInputTextNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <div className="field" id={`field-${node.id}`}>
      <label htmlFor={node.id}>{node.label}</label>
      <input
        type="text"
        id={node.id}
        name={node.id}
        required={node.required}
        placeholder={node.placeholder}
        minLength={node.minLength}
        maxLength={node.maxLength}
      />
      {renderErrors(node.errors)}
    </div>,
  );
}

export function renderInputNumber(
  node: IRInputNumberNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <div className="field" id={`field-${node.id}`}>
      <label htmlFor={node.id}>{node.label}</label>
      <input
        type="number"
        id={node.id}
        name={node.id}
        required={node.required}
        placeholder={node.placeholder}
        min={node.min}
        max={node.max}
      />
      {renderErrors(node.errors)}
    </div>,
  );
}

export function renderInputDate(
  node: IRInputDateNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <div className="field" id={`field-${node.id}`}>
      <label htmlFor={node.id}>{node.label}</label>
      <input
        type="date"
        id={node.id}
        name={node.id}
        required={node.required}
        min={node.min}
        max={node.max}
      />
      {renderErrors(node.errors)}
    </div>,
  );
}

export function renderInputChoice(
  node: IRInputChoiceNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <div className="field" id={`field-${node.id}`}>
      <label htmlFor={node.id}>{node.label}</label>
      <select id={node.id} name={node.id} required={node.required} multiple={node.multiple}>
        {node.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {renderErrors(node.errors)}
    </div>,
  );
}

export function renderSubmit(
  node: IRSubmitNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <button type="submit" id={node.id} data-route={node.route}>
      {node.label}
    </button>,
  );
}

export function renderFormError(
  node: IRFormErrorNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <div role="alert" className="error error--form">
      {node.message}
    </div>,
  );
}

export function renderFieldError(
  node: IRFieldErrorNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <div role="alert" className="error error--field" data-field-id={node.fieldId}>
      {node.message}
    </div>,
  );
}

export function renderRepeat(
  node: IRRepeatNode,
  { renderChildren }: ReactRendererContext,
): Result<ReactElement, ReactError> {
  const items: ReactElement[] = [];
  for (const item of node.items) {
    const childResult = renderChildren(item.children);
    if (!childResult.ok) return childResult;
    const canRemove = node.items.length > node.minItems;
    items.push(
      <fieldset key={item.index} data-repeat-item={item.index}>
        {childResult.value}
        {canRemove && (
          <button
            type="button"
            data-action="repeat-remove"
            data-repeat-id={node.id}
            data-repeat-index={item.index}
          >
            {node.removeLabel}
          </button>
        )}
      </fieldset>,
    );
  }
  const canAdd = node.maxItems === undefined || node.items.length < node.maxItems;
  return ok(
    <div id={node.id} data-repeat>
      <legend>{node.label}</legend>
      {items}
      {canAdd && (
        <button type="button" data-action="repeat-add" data-repeat-id={node.id}>
          {node.addLabel}
        </button>
      )}
      {renderErrors(node.errors)}
    </div>,
  );
}

export function renderInputFile(
  node: IRInputFileNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <div className="field" id={`field-${node.id}`}>
      <label htmlFor={node.id}>{node.label}</label>
      <input
        type="file"
        id={node.id}
        name={node.id}
        required={node.required}
        accept={node.accept}
        multiple={node.multiple}
      />
      {renderErrors(node.errors)}
    </div>,
  );
}

export function renderSignature(
  node: IRSignatureNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(
    <div className="field" id={`field-${node.id}`}>
      <label htmlFor={node.id}>{node.label}</label>
      <canvas id={node.id} data-signature aria-label={node.label} role="img" />
      {renderErrors(node.errors)}
    </div>,
  );
}

export function renderCustom(
  node: IRCustomNode,
  { renderChildren }: ReactRendererContext,
): Result<ReactElement, ReactError> {
  const childResult = renderChildren(node.children);
  if (!childResult.ok) return childResult;
  return ok(
    <div
      id={node.id}
      data-custom-kind={node.kind}
      {...(node.label !== undefined ? { 'aria-label': node.label } : {})}
    >
      {childResult.value}
      {renderErrors(node.errors)}
    </div>,
  );
}
