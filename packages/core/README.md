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

**This is a guide for maintaining a fork or contributing upstream, not for consumer-side extension.** `Element` and `IRNode` are closed unions defined in `@renderly/schema` — Steps 1–2 below edit that package's source directly, and there is no way to add a real new element type without doing so. If you just need one more field type in your own application without forking, you want the `custom` element instead — see [`@renderly/html`'s "Rendering Custom Field Types"](../html/README.md#rendering-custom-field-types) for that path, which requires no schema changes at all.

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

If you want the divider in the default registry, add it to `ALL_HANDLERS_BY_KEY` in `packages/core/src/handlers.ts` — this object is checked against `satisfies Record<ElementRegistryKey, ElementHandler>`, so it will only compile once `'divider'` is a real member of `ElementRegistryKey`, which happens automatically once `DividerElement` is added to the `Element` union in Step 1:

```typescript
// packages/core/src/handlers.ts
const ALL_HANDLERS_BY_KEY = {
  // ... existing handlers ...
  divider: dividerHandler,
} satisfies Record<ElementRegistryKey, ElementHandler>;
```

Alternatively, register it onto a registry instance at runtime instead of editing `ALL_HANDLERS_BY_KEY`:

```typescript
import { createDefaultRegistry } from '@renderly/core';
import { dividerHandler } from './divider-handler.js';

const registry = createDefaultRegistry();
registry.register('divider', dividerHandler);
```

This second form doesn't touch `@renderly/core`'s source, but it is **not** a way to skip Steps 1–2: `registry.register()`'s key parameter is a plain `string`, so this line type-checks regardless of whether `'divider'` exists in the schema — but the walker will never actually call this handler unless `element.type === 'divider'` reaches it, which requires both the `Element` union (Step 1) and the JSON Schema (Step 2) to already accept that element. Skip those and this registration is silently dead code — the input validator rejects the element before the walker ever sees it.

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

Register on a registry instance at runtime (works once `'divider'` is in `IRNodeType`, i.e. after Step 1):

```typescript
// HTML
htmlRegistry.set('divider', (n, rc) => renderDivider(n as IRDividerNode, rc));

// React
reactRegistry.set('divider', (n, ctx) => renderDivider(n as IRDividerNode, ctx));
```

To make it part of the *default* registry every consumer gets from `createDefaultHtmlRegistry()`/`createDefaultReactRegistry()`, add the entry to that adapter's `DEFAULT_HTML_RENDERERS`/`DEFAULT_REACT_RENDERERS` object in its `src/registry.ts` instead — each is checked with `satisfies Record<RenderableIRNodeType, ...>`, so, same as core's `ALL_HANDLERS_BY_KEY`, it won't compile until `'divider'` is a real `IRNodeType` member.

### The registration checklist

- [ ] TypeScript type in `@renderly/schema/src/elements.ts`
- [ ] IR node type in `@renderly/schema/src/ir.ts`
- [ ] Updated `Element` and `IRNode` union types
- [ ] JSON Schema definition + added to `Element.oneOf`
- [ ] Builder function in `@renderly/core/src/builders.ts`
- [ ] Handler function in `@renderly/core/src/handlers.ts`
- [ ] Handler added to `ALL_HANDLERS_BY_KEY` (or registered on a registry instance at runtime)
- [ ] HTML renderer + registered in HTML adapter's default registry (or on an instance)
- [ ] React renderer + registered in React adapter's default registry (or on an instance)
- [ ] Tests for builder, handler, and both renderers (100% branch coverage)
