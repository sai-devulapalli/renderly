# @renderly/react

Client-side React output adapter. Converts an `IRNode[]` tree into a React element tree. XSS safety comes from React's JSX escaping — no manual `escapeHtml` call is needed.

## API

```typescript
import { renderDocument, createDefaultReactRegistry } from '@renderly/react';
import { Fragment } from 'react';

// Default registry — all built-in node types
const result = renderDocument(irNodes);

// Custom registry — override or extend individual renderers
const registry = createDefaultReactRegistry();
registry.set('submit', myCustomSubmitRenderer);
const result = renderDocument(irNodes, registry);

if (!result.ok) {
  console.error(result.error);
} else {
  return result.value;  // ReactElement wrapping a <Fragment>
}
```

## XSS Safety

React automatically escapes all string values rendered through JSX. This means:
- Text content: `{node.text}` → rendered as text node, never HTML
- Attribute values: `id={node.id}` → escaped by React
- `dangerouslySetInnerHTML` is **never used** in this adapter

If you write a custom renderer, follow the same rule: pass user-supplied values as JSX children or props — never concatenate them into raw HTML strings.

## Responsive Layout

The React adapter emits the same `data-*` attributes as the HTML adapter:

```tsx
// Scalar direction
<div data-direction="column" data-gap="md">

// Responsive direction: { default: 'column', md: 'row' }
<div data-direction="column" data-md-direction="row" data-gap="md">

// Responsive cols: { default: 1, md: 2 }
<div data-cols="1" data-md-cols="2" data-direction="column" data-gap="md">
```

Import `renderly.css` from `@renderly/html` to apply the responsive CSS rules — the stylesheet is shared between both adapters.

## Keys

Individual renderers don't know their position in the output array. The `renderNodes` function assigns keys using `cloneElement(el, { key: node.id ?? index })` after each renderer returns. Custom renderers do not need to set keys.

## Peer Dependencies

```
react@^18.0.0
react-dom@^18.0.0
```
