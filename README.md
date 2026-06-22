# Renderly

A JSON-driven UI rendering engine published as a standalone TypeScript library. Describe a form once in JSON; Renderly handles validation, traversal, and rendering to any output target.

## Features

- **JSON-first** — form structure lives in a validated JSON document, not in framework code
- **Responsive layout** — containers accept breakpoint-keyed values (`{ default: 1, md: 2, lg: 3 }`)
- **Two output adapters** — HTML string (server-side) and React element tree (client-side)
- **XSS-safe by design** — all user-supplied text is escaped at the output boundary
- **No throws** — every public function returns `Result<T, E>`; callers handle errors explicitly
- **Hexagonal architecture** — core is pure; adapters are independent and swappable
- **TypeScript strict mode** throughout

## Packages

| Package | Description |
|---|---|
| `@renderly/shared` | `Result<T,E>`, logger, config, i18n |
| `@renderly/schema` | Element types, IR nodes, JSON Schema, `Responsive<T>` |
| `@renderly/core` | Registry, recursive walker, IR builder |
| `@renderly/input` | Raw JSON → validated `Document` (ingress boundary) |
| `@renderly/html` | IR → escaped HTML string + `renderly.css` |
| `@renderly/react` | IR → React element tree |
| `@renderly/submit` | Field extraction, payload assembly, error application |
| `@renderly/example` | Patient intake form — full pipeline end-to-end |

## Quick Start

```typescript
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { renderDocument } from '@renderly/html';

const json = JSON.stringify({
  version: '1',
  elements: [
    { type: 'input', kind: 'text', id: 'name', label: 'Full Name', required: true },
    { type: 'submit', id: 's1', label: 'Submit', route: '/api/submit' },
  ],
});

// 1. Parse and validate at the ingress boundary
const doc = parseDocument(json);
if (!doc.ok) throw new Error(JSON.stringify(doc.error));

// 2. Walk the document into an IRNode tree
const nodes = walk(doc.value, createDefaultRegistry());
if (!nodes.ok) throw new Error(JSON.stringify(nodes.error));

// 3. Render to HTML
const html = renderDocument(nodes.value);
if (!html.ok) throw new Error(JSON.stringify(html.error));

console.log(html.value);
```

## Responsive Layout

Container elements accept scalar or breakpoint-keyed values for `direction`, `gap`, and `cols`. Breakpoints are mobile-first: `sm` (640px) `md` (768px) `lg` (1024px) `xl` (1280px).

```json
{
  "type": "container",
  "direction": { "default": "column", "md": "row" },
  "gap": "md",
  "cols": { "default": 1, "md": 2, "lg": 3 },
  "children": [...]
}
```

Import the companion stylesheet once in your host application:

```typescript
import '@renderly/html/renderly.css';
```

The stylesheet reads the `data-*` attributes emitted by `renderContainer` and applies CSS `@media` rules — no JavaScript viewport detection required.

## Submit Flow

```typescript
import { extractFields, extractSubmit, buildPayload, applyErrors } from '@renderly/submit';

const doc = parseDocument(json).value!;

// Extract field descriptors and submit target
const fields = extractFields(doc);
const submit = extractSubmit(doc)!;

// Build and validate the payload
const result = buildPayload(fields, formValues, submit.route, submit.context ?? {});

if (!result.ok) {
  // result.error.failures contains all missing required fields
  const updated = applyErrors(doc, {
    fields: Object.fromEntries(
      result.error.failures.map((f) => [f.fieldId, [f.message]]),
    ),
  });
  // Re-walk and re-render updated document to show field errors
} else {
  // POST result.value to submit.route
}
```

## Scope Boundary

Renderly **renders**. It does not govern.

The following are the responsibility of the **host application**:

- Workflow state and form transitions
- Authorization decisions and RBAC
- HIPAA / PHI compliance and data handling
- Encryption at rest or in transit
- Audit trails and access logs
- Session management

Renderly never logs user-supplied field values (at any log level) and never persists data. It accepts a document, produces output, and returns. Everything else is out of scope.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full hexagonal architecture diagram, data flow, security model, and dependency rules.
