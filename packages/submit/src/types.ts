import type { InputKind, FieldValue } from '@renderly/schema';

export type { FieldValue };

/** Metadata describing one input field extracted from a Document. */
export interface FieldDescriptor {
  readonly id: string;
  readonly kind: InputKind;
  readonly label: string;
  readonly required: boolean;
  /** True only for multi-select choice inputs. */
  readonly multiple: boolean;
}

/** The payload sent to the server when the form is submitted. */
export interface SubmitPayload {
  /** The route from the submit element — where the payload goes. */
  readonly route: string;
  /** Opaque pass-through context from the submit element (version tokens, etc.). */
  readonly context: Readonly<Record<string, unknown>>;
  /** All field values keyed by field id. */
  readonly fields: Readonly<Record<string, FieldValue>>;
}
