# @renderly/core

The pure domain core: a component registry and recursive walker that converts a validated `Document` into an `IRNode[]` tree. No I/O, no adapters, no throws.

## API

```typescript
import { walk, createDefaultRegistry, createRegistry } from '@renderly/core';

const registry = createDefaultRegistry();          // all built-in element handlers
const result   = walk(document, registry);         // Result<IRNode[], WalkError>

if (!result.ok) {
  console.error(result.error.code, result.error.elementType);
} else {
  // result.value: IRNode[] — pass to an output adapter
}
```

## How It Works

1. **Registry** — a `Map<string, ElementHandler>` that maps element keys to walker functions. The key is `element.type` for most elements and `element.type:element.kind` for multi-kind elements (e.g., `"input:text"`, `"input:choice"`).
2. **Walker** — iterates over `doc.elements`, resolves each element's handler from the registry, invokes it, and collects the resulting `IRNode[]`. Container children are walked recursively.
3. **IR builder** — each handler calls a `build*Node()` function that resolves defaults and produces a fully-specified `IRNode`. Text is NOT escaped here — that is the output adapter's responsibility.

---

## Registering a New Element Type

This section walks through adding a `divider` element — a horizontal rule — as a complete worked example. The same pattern applies to any new element type.

### Step 1 — Define the schema types (`@renderly/schema`)

Add the element type and its IR node to the schema package:

```typescript
// packages/schema/src/elements.ts
export interface DividerElement {
  readonly type: 'divider';
  readonly id?: string;
}

// Add DividerElement to the Element union:
export type Element =
  | ContainerElement
  | HeadingElement
  | TextElement
  | InputElement
  | SubmitElement
  | DividerElement;   // ← new
```

```typescript
// packages/schema/src/ir.ts
export interface IRDividerNode {
  readonly type: 'divider';
  readonly id: string | undefined;
  readonly children: readonly IRNode[];
}

// Add to IRNode union:
export type IRNode = /* ... existing ... */ | IRDividerNode;
export type IRNodeType = IRNode['type'];
```

### Step 2 — Update the JSON Schema (`@renderly/schema`)

Add a `DividerElement` definition to `document.schema.json` and reference it from the `Element.oneOf` array:

```json
"DividerElement": {
  "type": "object",
  "required": ["type"],
  "additionalProperties": false,
  "properties": {
    "type": { "const": "divider" },
    "id":   { "type": "string", "minLength": 1 }
  }
}
```

### Step 3 — Write the builder (`@renderly/core`)

```typescript
// packages/core/src/builders.ts
import type { DividerElement, IRDividerNode } from '@renderly/schema';

export function buildDividerNode(el: DividerElement): IRDividerNode {
  return { type: 'divider', id: el.id, children: [] };
}
```

### Step 4 — Write the handler (`@renderly/core`)

```typescript
// packages/core/src/handlers.ts
import type { DividerElement } from '@renderly/schema';
import { ok } from '@renderly/shared';
import type { ElementHandler } from './types.js';
import { buildDividerNode } from './builders.js';

export const dividerHandler: ElementHandler = (element, _context) => {
  return ok(buildDividerNode(element as DividerElement));
};
```

### Step 5 — Register the handler

If you want the divider in the default registry, add it to `ALL_HANDLERS`:

```typescript
// packages/core/src/handlers.ts
export const ALL_HANDLERS: ReadonlyMap<string, ElementHandler> = new Map([
  // ... existing handlers ...
  ['divider', dividerHandler],
]);
```

To add it to a custom registry without modifying core:

```typescript
import { createDefaultRegistry } from '@renderly/core';
import { dividerHandler } from './divider-handler.js';

const registry = createDefaultRegistry();
registry.register('divider', dividerHandler);
```

### Step 6 — Add a renderer in each output adapter

**HTML** (`@renderly/html`):

```typescript
import type { IRDividerNode } from '@renderly/schema';
import { ok } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import { escapeHtml } from './escape.js';
import type { HtmlError, RenderChildrenFn } from './types.js';

export function renderDivider(
  node: IRDividerNode,
  _renderChildren: RenderChildrenFn,
): Result<string, HtmlError> {
  const id = node.id !== undefined ? ` id="${escapeHtml(node.id)}"` : '';
  return ok(`<hr${id} />`);
}
```

**React** (`@renderly/react`):

```tsx
import type { IRDividerNode } from '@renderly/schema';
import { ok } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import type { ReactElement } from 'react';
import type { ReactError, ReactRendererContext } from './types.js';

export function renderDivider(
  node: IRDividerNode,
  _ctx: ReactRendererContext,
): Result<ReactElement, ReactError> {
  return ok(<hr id={node.id} />);
}
```

Register in each adapter's registry:

```typescript
// HTML
htmlRegistry.set('divider', (n, rc) => renderDivider(n as IRDividerNode, rc));

// React
reactRegistry.set('divider', (n, ctx) => renderDivider(n as IRDividerNode, ctx));
```

### The registration checklist

- [ ] TypeScript type in `@renderly/schema/src/elements.ts`
- [ ] IR node type in `@renderly/schema/src/ir.ts`
- [ ] Updated `Element` and `IRNode` union types
- [ ] JSON Schema definition + added to `Element.oneOf`
- [ ] Builder function in `@renderly/core/src/builders.ts`
- [ ] Handler function in `@renderly/core/src/handlers.ts`
- [ ] Handler registered in `ALL_HANDLERS` (or in the custom registry)
- [ ] HTML renderer + registered in HTML adapter registry
- [ ] React renderer + registered in React adapter registry
- [ ] Tests for builder, handler, and both renderers (100% branch coverage)
