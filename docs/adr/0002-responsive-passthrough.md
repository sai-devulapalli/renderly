# ADR-0002: Responsive<T> values pass through the IR unchanged — resolution is deferred to output adapters

**Status:** Accepted  
**Date:** 2026-06-17  
**Packages affected:** `@renderly/schema`, `@renderly/core`, `@renderly/html`, `@renderly/react`

---

## Context

Container elements support responsive layout via the `Responsive<T>` type:

```typescript
type ResponsiveValue<T> = { default?: T; sm?: T; md?: T; lg?: T; xl?: T };
type Responsive<T> = T | ResponsiveValue<T>;
```

A container may carry, for example:

```json
{ "direction": { "default": "column", "md": "row" } }
```

meaning "stack vertically on small screens, arrange horizontally on medium-and-up".

A decision was needed: should the core walker resolve `Responsive<T>` to a single value (the "current" breakpoint) or pass the full responsive object through to the IR and let adapters handle it?

### Forces

- **JavaScript has no viewport.** The core library runs in Node.js during SSR, in a build step, or in a browser — but the core walker has no access to `window.innerWidth`. Resolving `Responsive<T>` at walk time would require either injecting a breakpoint argument into `walk()`, accepting a "current breakpoint" guess at build time, or running JavaScript at page-load to re-walk the document when the screen size changes.
- **SSR compatibility.** A server rendering a form to HTML has no knowledge of the client's viewport. Any approach that resolves breakpoints at walk time produces wrong output for at least some screen sizes.
- **Adapter diversity.** The HTML adapter can emit `data-*` attributes and ship a companion CSS file that applies breakpoint-specific rules via `@media` queries — no JavaScript required. The React adapter can do the same with `data-*` props. A future email adapter might ignore all breakpoints and always use `default`. A native mobile adapter might resolve breakpoints using the device's screen class.
- **Re-walking on resize is expensive.** If breakpoints were resolved in core, a browser host app would need to re-walk the entire document on every resize event to switch from `column` to `row` layout.

---

## Decision

**`@renderly/core` passes `Responsive<T>` values through to IR nodes unchanged. The IRNode tree carries the full responsive object for every breakpoint-aware property.**

Output adapters are responsible for emitting responsive values in a format appropriate to their output:

- **`@renderly/html`** emits one `data-*` attribute per breakpoint key present in the responsive object:
  ```
  direction: { default: 'column', md: 'row' }
  → data-direction="column" data-md-direction="row"
  ```
  `renderly.css` applies these via `@media (min-width: 768px) { [data-md-direction="row"] { flex-direction: row; } }`. No JavaScript, SSR-safe.

- **`@renderly/react`** emits the same `data-*` props. The host app imports `renderly.css` from `@renderly/html`.

- **Future adapters** may read only `default` if responsive layout is irrelevant to their output format.

---

## Consequences

**Positive:**
- SSR-safe: no viewport dependency in the library. A form rendered to HTML on the server displays correctly at all screen sizes without JavaScript.
- Single walk: `walk()` is called once. Layout changes at different breakpoints are handled entirely by CSS.
- Adapter independence: a non-HTML adapter that doesn't care about responsive layout simply reads the `default` value and ignores other keys.
- The IR is a complete, stable record of what the form author specified — all breakpoint intent is preserved.

**Negative / risks:**
- The `IRContainerNode` types carry `Responsive<T>` fields, making them more complex than plain `string | number` fields. Consumers of the IR who want a single resolved value must destructure the responsive object themselves.
- `renderly.css` must be imported by the host app. Forgetting to import it means responsive layout silently breaks — the `data-*` attributes are present but no CSS rule acts on them.
- Adding a new breakpoint (e.g., `2xl`) requires changes in three places: `tokens.ts` (add the breakpoint), `renderly.css` (add the `@media` rule), and adapter `responsiveAttr` helpers. This is low risk but not zero.

**Invariant to preserve:**  
> `@renderly/core` MUST NOT resolve `Responsive<T>` to a single value. It MUST pass the full object through to the IRNode. Any code in core that reads a breakpoint-specific key (e.g., `element.direction.md`) and discards the rest violates this ADR and breaks SSR correctness.

---

## Alternatives considered

**Alternative A — Resolve at walk time with an injected breakpoint.**  
`walk(doc, registry, { breakpoint: 'md' })`. Rejected: requires the caller to know the current breakpoint, which is impossible at SSR time and requires re-walking on resize at the client.

**Alternative B — Resolve at walk time to the `default` value only.**  
Rejected: makes responsive layout impossible without JavaScript-driven re-walks on resize.

**Alternative C — Compile the full responsive object into CSS-in-JS at walk time.**  
Deferred: viable for a React Native or styled-components adapter in the future. Not needed for the current adapter set. Would be implemented as a separate adapter, not a change to core.
