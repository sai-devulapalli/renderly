import type {
  IRNode,
  IRTextNode,
  IRInputTextNode,
  IRInputNumberNode,
  IRInputDateNode,
  IRInputChoiceNode,
  IRInputFileNode,
  IRSignatureNode,
  IRRepeatNode,
} from '@renderly/schema';
import type { FieldValues } from '@renderly/schema';
import type { SnapshotOptions } from './types.js';

function formatValue(
  value: string | number | readonly string[] | undefined,
  placeholder: string,
): string {
  if (value === undefined || value === '') return placeholder;
  if (Array.isArray(value)) {
    return (value as readonly string[]).length === 0 ? placeholder : (value as readonly string[]).join(', ');
  }
  return String(value);
}

function freezeInputText(node: IRInputTextNode, opts: SnapshotOptions): IRNode | null {
  const raw = opts.values[node.id];
  const empty = (raw === undefined || raw === '');
  if (empty && opts.omitEmpty && !node.required) return null;
  const placeholder = opts.emptyPlaceholder ?? '—';
  const textNode: IRTextNode = {
    type: 'text',
    id: node.id,
    content: `${node.label}: ${formatValue(raw, placeholder)}`,
    weight: 'normal',
    intent: 'default',
    children: [],
  };
  return textNode;
}

function freezeInputNumber(node: IRInputNumberNode, opts: SnapshotOptions): IRNode | null {
  const raw = opts.values[node.id];
  const empty = (raw === undefined);
  if (empty && opts.omitEmpty && !node.required) return null;
  const placeholder = opts.emptyPlaceholder ?? '—';
  const textNode: IRTextNode = {
    type: 'text',
    id: node.id,
    content: `${node.label}: ${formatValue(raw, placeholder)}`,
    weight: 'normal',
    intent: 'default',
    children: [],
  };
  return textNode;
}

function freezeInputDate(node: IRInputDateNode, opts: SnapshotOptions): IRNode | null {
  const raw = opts.values[node.id];
  const empty = (raw === undefined || raw === '');
  if (empty && opts.omitEmpty && !node.required) return null;
  const placeholder = opts.emptyPlaceholder ?? '—';
  const textNode: IRTextNode = {
    type: 'text',
    id: node.id,
    content: `${node.label}: ${formatValue(raw, placeholder)}`,
    weight: 'normal',
    intent: 'default',
    children: [],
  };
  return textNode;
}

function freezeInputFile(node: IRInputFileNode, opts: SnapshotOptions): IRNode | null {
  const raw = opts.values[node.id];
  const empty = (raw === undefined || raw === '');
  if (empty && opts.omitEmpty && !node.required) return null;
  const placeholder = opts.emptyPlaceholder ?? '—';
  const textNode: IRTextNode = {
    type: 'text',
    id: node.id,
    content: `${node.label}: ${formatValue(raw, placeholder)}`,
    weight: 'normal',
    intent: 'default',
    children: [],
  };
  return textNode;
}

function freezeSignature(node: IRSignatureNode, opts: SnapshotOptions): IRNode | null {
  const raw = opts.values[node.id];
  const signed = raw !== undefined && raw !== '';
  if (!signed && opts.omitEmpty && !node.required) return null;
  const placeholder = opts.emptyPlaceholder ?? '—';
  const textNode: IRTextNode = {
    type: 'text',
    id: node.id,
    content: `${node.label}: ${signed ? 'Signed' : placeholder}`,
    weight: 'normal',
    intent: 'default',
    children: [],
  };
  return textNode;
}

function freezeInputChoice(node: IRInputChoiceNode, opts: SnapshotOptions): IRNode | null {
  const raw = opts.values[node.id];
  const empty = (raw === undefined || (Array.isArray(raw) && (raw as readonly string[]).length === 0));
  if (empty && opts.omitEmpty && !node.required) return null;
  const placeholder = opts.emptyPlaceholder ?? '—';

  // Resolve values to labels
  let display: string;
  if (Array.isArray(raw)) {
    const selected = (raw as readonly string[])
      .map((v) => node.options.find((o) => o.value === v)?.label ?? v)
      .join(', ');
    display = selected || placeholder;
  } else if (typeof raw === 'string') {
    display = (node.options.find((o) => o.value === raw)?.label ?? raw) || placeholder;
  } else {
    display = placeholder;
  }

  const textNode: IRTextNode = {
    type: 'text',
    id: node.id,
    content: `${node.label}: ${display}`,
    weight: 'normal',
    intent: 'default',
    children: [],
  };
  return textNode;
}

/**
 * Transform IR nodes into a frozen read-only snapshot.
 *
 * All input nodes are replaced by text nodes showing their submitted values.
 * Submit buttons are removed (they serve no purpose in a receipt view).
 * Container structure and headings are preserved.
 * Error nodes are preserved as-is (they represent submission errors).
 */
export function freezeSnapshot(nodes: readonly IRNode[], opts: SnapshotOptions): readonly IRNode[] {
  const result: IRNode[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case 'input-text': {
        const frozen = freezeInputText(node, opts);
        if (frozen !== null) result.push(frozen);
        break;
      }
      case 'input-number': {
        const frozen = freezeInputNumber(node, opts);
        if (frozen !== null) result.push(frozen);
        break;
      }
      case 'input-date': {
        const frozen = freezeInputDate(node, opts);
        if (frozen !== null) result.push(frozen);
        break;
      }
      case 'input-choice': {
        const frozen = freezeInputChoice(node, opts);
        if (frozen !== null) result.push(frozen);
        break;
      }
      case 'input-file': {
        const frozen = freezeInputFile(node, opts);
        if (frozen !== null) result.push(frozen);
        break;
      }
      case 'signature': {
        const frozen = freezeSignature(node, opts);
        if (frozen !== null) result.push(frozen);
        break;
      }
      case 'repeat': {
        const r = node;
        for (const item of r.items) {
          // Mirror the walker's extractItemValues: strip the prefix so child IDs
          // like "name" resolve against scoped values instead of flat-keyed ones.
          const prefix = `${r.id}[${item.index}].`;
          const scopedValues: Record<string, FieldValues[string]> = {};
          for (const [key, val] of Object.entries(opts.values)) {
            if (key.startsWith(prefix) && val !== undefined) {
              scopedValues[key.slice(prefix.length)] = val as FieldValues[string];
            }
          }
          const itemOpts: SnapshotOptions = { ...opts, values: scopedValues };
          const itemLabel: IRTextNode = {
            type: 'text',
            id: undefined,
            content: `${r.label} — Item ${item.index + 1}`,
            weight: 'medium',
            intent: 'default',
            children: [],
          };
          const frozenChildren = freezeSnapshot(item.children, itemOpts);
          if (frozenChildren.length > 0) {
            result.push(itemLabel, ...frozenChildren);
          } else if (!opts.omitEmpty) {
            result.push(itemLabel);
          }
        }
        break;
      }
      case 'container': {
        const frozenChildren = freezeSnapshot(node.children, opts);
        if (frozenChildren.length > 0) {
          result.push({ ...node, children: frozenChildren });
        }
        break;
      }
      case 'submit':
      case 'repeat-item':
        // Submit buttons and raw repeat-item nodes are removed from snapshot views.
        // repeat-item nodes are consumed by the 'repeat' case above.
        break;
      default:
        // heading, text, error-form, error-field, custom — pass through unchanged
        result.push(node);
    }
  }

  return result;
}
