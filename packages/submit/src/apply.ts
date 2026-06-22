import type { Document, FormErrors } from '@renderly/schema';

/**
 * Returns a new Document with the server error response merged in.
 * Pass the result to the core walker and output adapter to re-render with errors shown.
 */
export function applyErrors(doc: Document, errors: FormErrors): Document {
  return { ...doc, errors };
}
