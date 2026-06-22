# @renderly/schema

The shared vocabulary of the Renderly library. All packages import from here — nothing else imports from them. This package has no runtime dependencies beyond `@renderly/shared`.

## Element Types

A `Document` is a JSON object with a `version`, optional `title`, a flat `elements` array, and optional server-side `errors`.

```typescript
interface Document {
  version: string;
  title?: string;
  elements: readonly Element[];
  errors?: FormErrors;
}
```

### Layout

| Type | Required fields | Optional fields |
|---|---|---|
| `container` | `type`, `children` | `id`, `direction`, `gap`, `cols` |
| `heading` | `type`, `level`, `text` | `id`, `size` |
| `text` | `type`, `content` | `id`, `weight`, `intent` |

### Input

All input elements share `type: "input"` and are distinguished by `kind`:

| Kind | Required | Optional |
|---|---|---|
| `text` | `id`, `label` | `placeholder`, `required`, `minLength`, `maxLength` |
| `number` | `id`, `label` | `placeholder`, `required`, `min`, `max` |
| `date` | `id`, `label` | `required`, `min`, `max` |
| `choice` | `id`, `label`, `options` | `required`, `multiple` |

### Action

| Type | Required fields | Optional fields |
|---|---|---|
| `submit` | `type`, `id`, `label`, `route` | `context` |

## Responsive Values

Container props `direction`, `gap`, and `cols` accept either a plain scalar or a breakpoint-keyed object:

```typescript
type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';  // 640 / 768 / 1024 / 1280 px

type Responsive<T> = T | {
  default?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};
```

All keys in the breakpoint object are optional. Omitting `default` means the base CSS rule (from `renderly.css`) determines the initial value.

```json
{ "type": "container", "cols": { "default": 1, "md": 2, "lg": 3 }, "children": [...] }
{ "type": "container", "direction": { "default": "column", "md": "row" }, "children": [...] }
```

## IR Nodes

The Intermediate Representation (IR) is the contract between the core walker and output adapters. Each `IRNode` has all defaults resolved and carries field-level errors from the server response.

The core principle: **IR text is not escaped**. Escaping happens in each output adapter independently, at the last moment before the text enters the output format.

## JSON Schema Validation

The `DOCUMENT_SCHEMA` export is an Ajv-compatible JSON Schema. It validates the entire document structure at ingress — unknown element types, wrong field types, and missing required fields all produce path-located errors.

```typescript
import { DOCUMENT_SCHEMA } from '@renderly/schema';
import Ajv from 'ajv';

const ajv = new Ajv({ strict: true, allErrors: true });
const validate = ajv.compile(DOCUMENT_SCHEMA);
```
