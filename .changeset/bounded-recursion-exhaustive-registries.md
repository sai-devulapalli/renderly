---
"@renderly/schema": minor
"@renderly/core": minor
"@renderly/html": patch
"@renderly/react": patch
"@renderly/markdown": patch
"@renderly/email": patch
"@renderly/pdf": patch
---

`@renderly/core`: `walk()` no longer recurses without limit into nested `container`/`repeat` children. A new `maxDepth` option on `WalkOptions` (default `DEFAULT_MAX_DEPTH = 200`, both now exported) bounds the descent; exceeding it returns `err({ code: 'MAX_DEPTH_EXCEEDED', elementType })` instead of overflowing the call stack on a deeply-nested or maliciously-crafted document.

`@renderly/schema`: adds `RenderableIRNodeType` (`IRNodeType` minus `'repeat-item'`, which is never dispatched through a registry directly — every adapter unwraps a repeat item to its `children` first). Also gives `IRRepeatItemNode` an explicit `id?: undefined` field for consistency with the rest of the `IRNode` union.

Every adapter's default renderer/handler table (`@renderly/core`'s `ALL_HANDLERS`, and the default registries in `html`/`react`/`markdown`/`email`/`pdf`) is now built from an object literal checked with `satisfies Record<RenderableIRNodeType, ...>` (or the equivalent `ElementRegistryKey` in core), instead of an unchecked `Map` built from an array of tuples. Forgetting to wire up a renderer for a new node type is now a compile error in every adapter simultaneously, instead of a runtime `UNREGISTERED_NODE_TYPE`/`UNREGISTERED_ELEMENT_TYPE` gap discovered later. This changes internal construction only — the public `*Registry` type (`ReadonlyMap<IRNodeType, Renderer>`) and the `createDefault*Registry()`/`create*Registry()` APIs are unchanged.
