import type { Document, Element, SubmitElement } from '@renderly/schema';
import type { FieldDescriptor } from './types.js';

function walkElements(elements: readonly Element[]): FieldDescriptor[] {
  const fields: FieldDescriptor[] = [];
  for (const el of elements) {
    if (el.type === 'container') {
      fields.push(...walkElements(el.children));
    } else if (el.type === 'input') {
      fields.push({
        id: el.id,
        kind: el.kind,
        label: el.label,
        required: el.required ?? false,
        multiple: el.kind === 'choice' ? (el.multiple ?? false) : false,
      });
    }
  }
  return fields;
}

/** Returns all input fields in document order, including those nested inside containers. */
export function extractFields(doc: Document): readonly FieldDescriptor[] {
  return walkElements(doc.elements);
}

function findSubmit(elements: readonly Element[]): SubmitElement | undefined {
  for (const el of elements) {
    if (el.type === 'submit') return el;
    if (el.type === 'container') {
      const found = findSubmit(el.children);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** Returns the first submit element in the document, or undefined if none. */
export function extractSubmit(doc: Document): SubmitElement | undefined {
  return findSubmit(doc.elements);
}
