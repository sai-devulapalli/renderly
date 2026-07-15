import type { Document, Element } from '@renderly/schema';

export interface FieldInfo {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly required: boolean;
}

function collectFields(elements: readonly Element[], out: FieldInfo[]): void {
  for (const el of elements) {
    if (el.type === 'input') {
      out.push({
        id: el.id,
        kind: el.kind,
        label: el.label,
        required: el.required ?? false,
      });
    }
    if (el.type === 'container') {
      collectFields(el.children, out);
    }
  }
}

export function extractFields(doc: Document): FieldInfo[] {
  const out: FieldInfo[] = [];
  collectFields(doc.elements, out);
  return out;
}
