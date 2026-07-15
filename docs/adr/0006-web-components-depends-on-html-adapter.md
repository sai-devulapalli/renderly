# ADR-0006: @renderly/web-components depends on @renderly/html — it is a DOM composition layer, not a peer rendering adapter

**Status:** Accepted
**Date:** 2026-07-14
**Packages affected:** `@renderly/web-components`, `@renderly/html`

---

## Context

`@renderly/web-components` exports `<renderly-form>`, a Custom Element that wraps a Renderly document as an interactive, framework-free form: parse → walk → render into the element's shadow-less DOM, then wire native `submit` and `click` listeners for form submission and repeat add/remove.

To do this it must produce real DOM the browser can attach event listeners to. Its `package.json` lists `@renderly/html` as a production dependency, and `src/element.ts` calls `renderDocument()` from it directly to obtain markup for `innerHTML`.

Every other adapter (`html`, `react`, `markdown`, `email`, `pdf`) depends only on `@renderly/schema` + `@renderly/shared` and never on each other — each independently decides how to encode the same `IRNode[]` in its own target format. `@renderly/web-components` breaks that pattern on its face: it is the one package that imports another adapter's public API.

### Forces

- **`web-components` isn't a sixth independent encoding of the IR — it's a browser-native wrapper *around* an existing encoding.** Its entire value proposition is "give me a live, interactive element," and the only sane way to get one is to render real markup and attach it to the DOM. There is no meaningful "web-components' own opinion" about how a submit button or a repeat-add button should be marked up that would differ from the HTML adapter's.
- **Reimplementing HTML generation inside `web-components` to avoid the dependency would be strictly worse.** It would duplicate every renderer in `@renderly/html` (escaping, all 14 node types, `renderly.css` conventions) a second time, with no compiler-enforced guarantee the two stay in sync — the exact kind of drift a 6-target IR is most exposed to.
- **The coupling goes deeper than the import.** `web-components`'s click handler (`#onRepeatClick` in `element.ts`) dispatches on the literal `data-action="repeat-add"` / `data-action="repeat-remove"` / `data-target` / `data-index` attributes that `@renderly/html`'s repeat renderer emits (`packages/html/src/renderers.ts`, repeat block). This is an implicit markup contract, not just a function call — even a "clean" abstraction (e.g. re-exporting `renderDocument` from a neutral package) wouldn't remove it.
- **Promoting HTML-string rendering into `@renderly/core` or `@renderly/shared` to "fix" the layering was considered and rejected** — that's not extracting a shared capability, it's just relocating the entire `@renderly/html` adapter one layer down the stack, which would demote a peer-adapter to a core dependency for every consumer, not just `web-components`.

---

## Decision

**`@renderly/web-components` is classified as a DOM composition package, not a rendering adapter, and is explicitly permitted to depend on `@renderly/html`.**

The dependency-graph rule in ARCHITECTURE.md is amended from "adapters never depend on each other" to: *rendering adapters (`html`, `react`, `markdown`, `email`, `pdf`) never depend on each other; `@renderly/web-components` is a sanctioned exception because it composes the HTML adapter's output into a live Custom Element rather than producing an independent target format.*

The implicit markup contract (`data-action`, `data-target`, `data-index`) between `@renderly/html`'s repeat renderer and `@renderly/web-components`'s event wiring is treated as part of `@renderly/html`'s public surface, not an internal implementation detail — a breaking change to that markup in `@renderly/html` is a breaking change for `@renderly/web-components` and must be called out in that package's own changelog.

---

## Consequences

**Positive:**
- No duplicated HTML-generation logic; `@renderly/web-components` gets escaping, new node types, and markup fixes in `@renderly/html` for free.
- The coupling is now documented and named instead of being a silent crack in the stated architecture — a future reviewer (or this same audit, next time) doesn't need to rediscover it.
- `@renderly/web-components`'s existing tests (`tests/unit/element.test.ts`) exercise the real `@renderly/html` package end-to-end (not a mock), so a breaking markup change in `@renderly/html` (e.g. renaming `data-action`) fails `web-components`'s own test suite immediately rather than surfacing later as a silent runtime bug.

**Negative / risks:**
- `@renderly/html` cannot freely rename or restructure its repeat/submit markup without checking `@renderly/web-components` first — its DOM output is now a de facto public contract with a second consumer, not something it can change unilaterally as an "adapter implementation detail."
- Any future adapter that wants the same "give me a live interactive element" capability (e.g. a hypothetical web-components-over-react) would face the same choice and the same trade-off — this ADR does not generalize into a rule for other cases without re-evaluating them individually.

**Invariant to preserve:**
> A change to `@renderly/html`'s rendered markup for repeat/submit controls (element structure, `data-*` attribute names or values) MUST run `@renderly/web-components`'s test suite before merging, since that suite is the only thing that would catch the break. No other adapter package may add a production dependency on another adapter without a new ADR making the same case this one does.

---

## Alternatives considered

**Alternative A — Reimplement minimal HTML generation inside `@renderly/web-components`, avoiding the dependency entirely.**
Rejected: duplicates `@renderly/html`'s renderers with no shared source of truth; every new IR node type or escaping fix would need to land in two places, and nothing would force the second update.

**Alternative B — Extract a neutral "render IR to HTML string" package that both `@renderly/html` and `@renderly/web-components` depend on.**
Rejected: `@renderly/html` *is* that package. Splitting it into "the real adapter" plus "the extracted string-rendering core" is a distinction without a difference — it only moves the same code one directory over while adding an extra package to maintain.

**Alternative C — Have `@renderly/web-components` accept a `render: (nodes) => string` function injected by the consumer instead of importing `@renderly/html` directly.**
Deferred: would decouple the package at the type level, but every real consumer would inject `@renderly/html`'s `renderDocument` anyway, and the `data-action`/`data-target` markup coupling (Forces, above) would remain regardless of who wires the dependency together. Worth revisiting only if a second DOM-composition adapter (e.g. over a different HTML-string renderer) is ever built.
