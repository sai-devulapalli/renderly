# @renderly/example

A fully-worked end-to-end example: a Patient Intake Form that exercises every feature of the Renderly pipeline.

## The Form

The example form (`src/form.ts`) demonstrates:

| Feature | How it's used |
|---|---|
| Responsive container (`direction`) | Name row: `{ default: 'column', md: 'row' }` — stacked on mobile, side-by-side on tablet+ |
| Responsive container (`cols`) | Measurements: `{ default: 1, md: 2 }` — single column on mobile, grid on tablet+ |
| Text inputs | First name, last name, email |
| Date input | Date of birth |
| Single-select choice | Insurance provider (required) |
| Multi-select choice | Reason for visit (optional) |
| Number inputs | Height and weight |
| Submit with context | Route `/api/intake`, context `{ form_version, clinic }` |

## Exports

```typescript
import { EXAMPLE_FORM_JSON, loadExampleForm } from '@renderly/example';

// Raw JSON string (as an API would serve it)
const raw: string = EXAMPLE_FORM_JSON;

// Parsed through the full @renderly/input ingress pipeline
const result = loadExampleForm();  // Result<Document, InputError>
```

## Running the Tests

```sh
pnpm --filter @renderly/example test:coverage
```

The e2e test suite (`tests/e2e/example.e2e.test.tsx`) covers 33 scenarios — no mocks:

1. **Parse** — JSON string through `@renderly/input`
2. **Walk** — document through `@renderly/core`
3. **HTML render** — field labels, submit button, no errors initially, responsive data attributes
4. **React render** — same assertions in jsdom
5. **Field extraction** — all 8 fields in document order, required/optional, multi-choice
6. **Payload build (success)** — required fields provided, optional fields included
7. **Payload build (failures)** — missing required fields, partially filled form
8. **Error application + HTML re-render** — form-level and field-level errors, XSS escaping
9. **Error application + React re-render** — DOM assertions, XSS safety

## Using as a Reference

The Patient Intake Form is a realistic starting point for building your own form documents. Copy and modify `EXAMPLE_FORM_JSON` from `src/form.ts` — the TypeScript type annotation ensures the form structure is validated at compile time before the JSON string is generated.
