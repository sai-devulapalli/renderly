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
        required: (el as { required?: boolean }).required ?? false,
      });
    }
    if (el.type === 'container' && Array.isArray(el.children)) {
      collectFields(el.children as readonly Element[], out);
    }
  }
}

export function extractFields(doc: Document): FieldInfo[] {
  const out: FieldInfo[] = [];
  collectFields(doc.elements, out);
  return out;
}
