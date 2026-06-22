# @renderly/input

The ingress boundary. Accepts raw JSON (string or unknown object), validates it against the Renderly JSON Schema, and returns a typed `Document` or a path-located error. Nothing downstream ever sees invalid data.

## API

```typescript
import { parseDocument, parseDocumentObject } from '@renderly/input';

// From a raw JSON string (e.g., fetched from an API)
const result = parseDocument(rawJsonString);

// From an already-parsed object (e.g., from a database)
const result = parseDocumentObject(unknownObject);

if (!result.ok) {
  if (result.error.code === 'PARSE_ERROR') {
    // result.error.message — JSON syntax error message
  } else {
    // result.error.code === 'VALIDATION_ERROR'
    // result.error.failures — array of { path, message }
    for (const f of result.error.failures) {
      console.error(f.path, f.message);  // e.g. '/elements/2/kind', 'must be equal to one of ...'
    }
  }
}
```

## Pipeline

```
Raw string / object
      │
      ▼
 JSON.parse()                ← PARSE_ERROR if invalid JSON syntax
      │
      ▼
 Ajv schema validation       ← VALIDATION_ERROR with all failures (allErrors: true)
      │
      ▼
 Document (trusted, typed)   ← guaranteed to match the schema
```

## Security

- Validation happens **once** — here. Downstream (core, adapters) trusts the `Document` fully.
- Unknown properties are rejected (`additionalProperties: false` on every schema node).
- Field values are validated for type and range; they are NOT sanitised — that is the output adapter's job.
- **Never log** the raw input or any field value. The logger is intentionally withheld from this package.
