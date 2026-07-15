# @renderly/html

Server-side HTML output adapter. Converts an `IRNode[]` tree into an escaped HTML string. All text-like values are escaped before they reach the string — this is the XSS boundary.

## API

```typescript
import { renderDocument, createDefaultHtmlRegistry } from '@renderly/html';

// Use the default registry (all built-in node types)
const result = renderDocument(irNodes);

// Override one built-in renderer — the key must be an existing IRNodeType
const registry = createDefaultHtmlRegistry();
registry.set('heading', myCustomHeadingRenderer);
const result = renderDocument(irNodes, registry);

if (!result.ok) {
  console.error(result.error.code, result.error.nodeType);
} else {
  res.send(`<html><body>${result.value}</body></html>`);
}
```

`registry` is typed `Map<IRNodeType, HtmlNodeRenderer>` — you can only `set()` a key that's already a member of `IRNodeType` (`container`, `heading`, `text`, `input-text`, …, `custom`). This lets you *override* how a built-in node type renders, but it cannot add a brand-new node type: `registry.set('divider', ...)` fails to compile, because `'divider'` isn't part of `IRNodeType`. Adding a genuinely new field type without forking `@renderly/schema` is what the `custom` node exists for — see [Rendering Custom Field Types](#rendering-custom-field-types) below.

## Rendering Custom Field Types

`Element`/`IRNode` are closed unions — adding a real member (like the `divider` walked through in `@renderly/core`'s README) means editing `@renderly/schema`, which means forking or contributing upstream. If you just need one more field type in your own app without forking, use `custom` instead: `CustomElement` carries a free-form `kind: string` and `props: Record<string, unknown>` that Renderly never inspects, and the walker passes it through as an `IRCustomNode` unchanged.

Every adapter registers a default `'custom'` renderer (`renderCustom`) that emits a generic placeholder (so an unhandled `kind` still renders instead of erroring). To render specific `kind`s yourself, override that one registry entry with a renderer that dispatches on `node.kind`, falling back to `renderCustom` for anything you don't handle:

```typescript
import type { IRCustomNode, IRNode } from '@renderly/schema';
import { createDefaultHtmlRegistry, renderCustom, renderDocument } from '@renderly/html';
import type { HtmlNodeRenderer, RenderChildrenFn } from '@renderly/html';
import { ok } from '@renderly/shared';

const renderMyCustomFields: HtmlNodeRenderer = (node: IRNode, renderChildren: RenderChildrenFn) => {
  const custom = node as IRCustomNode; // safe: this renderer is only ever registered under the 'custom' key
  if (custom.kind === 'star-rating') {
    const rating = typeof custom.props['rating'] === 'number' ? custom.props['rating'] : 0;
    return ok(`<div class="star-rating">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>`);
  }
  return renderCustom(custom, renderChildren); // fall back to the built-in placeholder for any other kind
};

const registry = createDefaultHtmlRegistry();
registry.set('custom', renderMyCustomFields);
const result = renderDocument(irNodes, registry);
```

Two things this mechanism does *not* give you: compile-time checking of `props`' shape per `kind` (it's `Record<string, unknown>` — validate it yourself), and per-`kind` type safety across the registry (every adapter still has exactly one `'custom'` slot, so your renderer is responsible for its own `kind` dispatch, same as the built-in one is).

## Responsive Layout

Import the companion stylesheet once in your host application:

```typescript
import '@renderly/html/renderly.css';
```

or in HTML:

```html
<link rel="stylesheet" href="node_modules/@renderly/html/renderly.css" />
```

The stylesheet reads `data-*` attributes emitted by `renderContainer`:

| JSON value | Emitted attributes | CSS selector matched |
|---|---|---|
| `"column"` | `data-direction="column"` | `[data-direction="column"]` |
| `{ default: "column", md: "row" }` | `data-direction="column" data-md-direction="row"` | `@media (min-width: 768px) [data-md-direction="row"]` |
| `{ default: 1, md: 2 }` | `data-cols="1" data-md-cols="2"` | `@media (min-width: 768px) [data-md-cols="2"]` |

Gap token CSS custom properties can be overridden per-host:

```css
:root {
  --rly-gap-sm: 0.75rem;  /* override default 0.5rem */
  --rly-gap-md: 1.25rem;  /* override default 1rem   */
}
```

---

## Adding a New Output Adapter

This section shows how to write a brand-new output adapter from scratch — one that produces plain Markdown from an IR tree. The same pattern applies to PDF, DOCX, email HTML, or any other output format.

### The adapter contract

An output adapter is a function with this signature:

```typescript
(nodes: readonly IRNode[], registry?: YourRegistry) => Result<YourOutput, YourError>
```

Where `YourRegistry` is a `Map<IRNodeType, YourNodeRenderer>` and `YourNodeRenderer` handles one node type and returns `Result<YourOutput, YourError>`.

### Step 1 — Define error and renderer types

```typescript
// packages/markdown/src/types.ts
import type { IRNode, IRNodeType } from '@renderly/schema';
import type { Result } from '@renderly/shared';

export type MarkdownErrorCode = 'UNREGISTERED_NODE_TYPE' | 'RENDER_ERROR';

export interface MarkdownError {
  readonly code: MarkdownErrorCode;
  readonly nodeType: string;
  readonly cause?: unknown;
}

export type RenderChildrenFn = (nodes: readonly IRNode[]) => Result<string, MarkdownError>;
export type MarkdownNodeRenderer = (node: IRNode, renderChildren: RenderChildrenFn) => Result<string, MarkdownError>;
export type MarkdownRegistry = ReadonlyMap<IRNodeType, MarkdownNodeRenderer>;
```

### Step 2 — Write node renderers

Each renderer handles one `IRNodeType`. It receives the strongly-typed node and a `renderChildren` callback for recursive rendering.

```typescript
// packages/markdown/src/renderers.ts
import type { IRHeadingNode, IRTextNode, IRInputTextNode, IRSubmitNode } from '@renderly/schema';
import { ok } from '@renderly/shared';

// Heading → ATX-style markdown (## Title)
export function renderHeading(
  node: IRHeadingNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const hashes = '#'.repeat(node.level);
  // IMPORTANT: escape backticks and other markdown special chars from user content
  return ok(`${hashes} ${node.text.replace(/`/g, '\\`')}\n`);
}

// Plain text paragraph
export function renderText(
  node: IRTextNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  return ok(`${node.content}\n\n`);
}

// Input field → descriptive text (labels only — not interactive)
export function renderInputText(
  node: IRInputTextNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  const required = node.required ? ' *(required)*' : '';
  return ok(`**${node.label}**${required}: ______\n`);
}

// Submit button → horizontal rule
export function renderSubmit(
  node: IRSubmitNode,
  _renderChildren: RenderChildrenFn,
): Result<string, MarkdownError> {
  return ok(`\n---\n*${node.label}*\n`);
}
```

### Step 3 — Implement the render loop

```typescript
// packages/markdown/src/render.ts
import type { IRNode } from '@renderly/schema';
import { ok, err } from '@renderly/shared';
import type { Result } from '@renderly/shared';
import type { MarkdownRegistry, MarkdownError, RenderChildrenFn } from './types.js';

export function renderNodes(
  nodes: readonly IRNode[],
  registry: MarkdownRegistry,
): Result<string, MarkdownError> {
  let md = '';
  for (const node of nodes) {
    const renderer = registry.get(node.type);
    if (renderer === undefined) {
      return err<MarkdownError>({ code: 'UNREGISTERED_NODE_TYPE', nodeType: node.type });
    }
    const renderChildrenFn: RenderChildrenFn = (children) => renderNodes(children, registry);
    let result: Result<string, MarkdownError>;
    try {
      result = renderer(node, renderChildrenFn);
    } catch (cause) {
      return err<MarkdownError>({ code: 'RENDER_ERROR', nodeType: node.type, cause });
    }
    if (!result.ok) return result;
    md += result.value;
  }
  return ok(md);
}
```

### Step 4 — Build the default registry

```typescript
// packages/markdown/src/registry.ts
import type { IRNodeType } from '@renderly/schema';
import type { MarkdownNodeRenderer } from './types.js';
import {
  renderHeading, renderText, renderInputText,
  renderSubmit, /* renderContainer, renderInputNumber, ... */
} from './renderers.js';

export function createDefaultMarkdownRegistry(): Map<IRNodeType, MarkdownNodeRenderer> {
  return new Map([
    ['heading',     (n, rc) => renderHeading(n as IRHeadingNode, rc)],
    ['text',        (n, rc) => renderText(n as IRTextNode, rc)],
    ['input-text',  (n, rc) => renderInputText(n as IRInputTextNode, rc)],
    ['submit',      (n, rc) => renderSubmit(n as IRSubmitNode, rc)],
    // add all IRNodeType values your adapter will encounter
  ]);
}
```

### Step 5 — Write the adapter entry point

```typescript
// packages/markdown/src/adapter.ts
import type { IRNode } from '@renderly/schema';
import type { Result } from '@renderly/shared';
import type { MarkdownRegistry, MarkdownError } from './types.js';
import { renderNodes } from './render.js';
import { createDefaultMarkdownRegistry } from './registry.js';

export function renderDocument(
  nodes: readonly IRNode[],
  registry: MarkdownRegistry = createDefaultMarkdownRegistry(),
): Result<string, MarkdownError> {
  return renderNodes(nodes, registry);
}
```

### Adapter checklist

- [ ] Error type with `code`, `nodeType`, optional `cause`
- [ ] `NodeRenderer` type with `(node, renderChildren) => Result<Output, Error>` signature
- [ ] `Registry` as `ReadonlyMap<IRNodeType, NodeRenderer>`
- [ ] Renderer for every `IRNodeType` in the registry
- [ ] `renderNodes` loop with `UNREGISTERED_NODE_TYPE` and `RENDER_ERROR` guards
- [ ] Default registry factory function
- [ ] `renderDocument` entry point with optional registry override
- [ ] **Escape all user-supplied text** before writing it to the output format
- [ ] Tests with 100% branch coverage (including the error paths)

### The XSS boundary

Every output adapter is independently responsible for escaping user-supplied content before it reaches the output string. The IR stores text unescaped. Never write IR text values directly into HTML attributes or HTML element content — always escape first.

`@renderly/html` exports `escapeHtml` for HTML contexts. For other output formats, use the appropriate escaping function for that format (e.g., XML escaping for SVG, URL encoding for query strings).
