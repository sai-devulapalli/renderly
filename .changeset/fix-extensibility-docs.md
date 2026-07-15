---
"@renderly/core": patch
"@renderly/html": patch
---

Fixes two misleading examples in the extensibility documentation:

- `@renderly/html`'s README showed `registry.set('divider', myDividerRenderer)` as a "use a custom registry" example — this doesn't compile, since `'divider'` was never a real `IRNodeType`. Replaced with a verified-working override example, and added a "Rendering Custom Field Types" section documenting the actual no-fork extension mechanism (the `custom` node's `kind`/`props` escape hatch).
- `@renderly/core`'s "Registering a New Element Type" guide claimed a handler could be added "without modifying core," which is true but implied a lighter-weight path than exists: the handler is unreachable dead code unless the schema and JSON Schema changes from the earlier steps already exist, since the input validator rejects the element before the walker ever sees it. The guide now says so explicitly, and links to the `custom`-node path for consumers who don't want to fork `@renderly/schema` at all.
