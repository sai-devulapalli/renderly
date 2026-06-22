# @renderly/submit

The submit contract. Extracts field descriptors and the submit target from a document, builds a typed payload, and merges server error responses back into the document for re-rendering.

## API

```typescript
import {
  extractFields,   // Document → FieldDescriptor[]
  extractSubmit,   // Document → SubmitElement | undefined
  buildPayload,    // (fields, values, route, context?) → Result<SubmitPayload, PayloadError>
  applyErrors,     // (document, FormErrors) → Document
} from '@renderly/submit';
```

## Full Submit Flow

```typescript
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument as renderHtml } from '@renderly/html';
import { extractFields, extractSubmit, buildPayload, applyErrors } from '@renderly/submit';

const doc = parseDocument(rawJson).value!;

// 1. Extract what the form needs from the host application
const fields = extractFields(doc);   // all inputs, document order, nested containers flattened
const submit = extractSubmit(doc)!;  // first submit element (route + context)

// 2. On form submit, build and validate the payload
const result = buildPayload(fields, hostFormValues, submit.route, submit.context ?? {});

if (!result.ok) {
  // Client-side validation failed — map failures to FormErrors for re-render
  const serverErrors = {
    fields: Object.fromEntries(
      result.error.failures.map((f) => [f.fieldId, [f.message]]),
    ),
  };
  const updated = applyErrors(doc, serverErrors);
  // re-walk + re-render updated (now carries errors)
} else {
  // POST result.value to result.value.route, await server response
  const serverResponse = await fetch(result.value.route, {
    method: 'POST',
    body: JSON.stringify(result.value),
  });
  const serverErrors = await serverResponse.json();  // { form?: string[], fields?: Record<string, string[]> }
  if (serverErrors) {
    const updated = applyErrors(doc, serverErrors);
    // re-walk + re-render
  }
}
```

## Types

```typescript
type FieldValue = string | number | readonly string[];

interface FieldDescriptor {
  id:       string;
  kind:     InputKind;      // 'text' | 'number' | 'date' | 'choice'
  label:    string;
  required: boolean;
  multiple: boolean;        // true only for multi-select choice inputs
}

interface SubmitPayload {
  route:   string;                          // from the submit element
  context: Readonly<Record<string, unknown>>; // opaque pass-through (CSRF tokens, versions, etc.)
  fields:  Readonly<Record<string, FieldValue>>;
}
```

## Security

- `buildPayload` validates that required fields are non-empty. It **never** validates content (email format, phone format, etc.) — content validation is the server's responsibility.
- `applyErrors` performs a shallow document merge (`{ ...doc, errors }`). It is a pure function — the original document is not mutated.
- Server error messages are treated as user-facing strings by output adapters. The HTML adapter escapes them; React's JSX escaping makes them safe automatically.
