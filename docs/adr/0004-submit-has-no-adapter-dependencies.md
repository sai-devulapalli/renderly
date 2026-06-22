# ADR-0004: @renderly/submit has no output adapter dependencies — it is a pure domain module

**Status:** Accepted  
**Date:** 2026-06-17  
**Packages affected:** `@renderly/submit`, `@renderly/html`, `@renderly/react`

---

## Context

The submit package handles the "after render" half of the form lifecycle: extracting field descriptors from a document, packaging user-supplied values into a typed payload, and merging server error responses back into the document for re-rendering.

Its dependency options were:
1. Depend on `@renderly/html` and/or `@renderly/react` to know how to render error states.
2. Depend only on `@renderly/schema` and `@renderly/shared` — operate purely on document data structures and let the existing output adapters handle rendering.

### Forces

- **Rendering belongs to adapters.** The submit module's job is to transform data structures: `Document → FieldDescriptor[]`, `(fields, values) → SubmitPayload`, `(Document, FormErrors) → Document`. None of these transformations require knowledge of HTML or React.
- **`applyErrors` produces a modified Document, not rendered output.** Merging errors into a document is a pure structural operation — the host app then calls `walk()` and the appropriate adapter to re-render. If `@renderly/submit` imported `@renderly/html`, it would produce rendered HTML directly, coupling the submit flow to a specific output format.
- **Adapter independence.** A host app using a custom adapter (not html, not react) must still be able to use `@renderly/submit`. If submit imported html or react, custom adapter users would carry adapter dead weight in their bundle.
- **Dependency direction.** Adapters depend on schema and shared. If submit depended on adapters, adapters could not depend on submit without creating a cycle. The direction `schema ← core ← adapters` and `schema ← submit` is acyclic. `schema ← submit ← adapters` would require adapters to not import submit, which would leave re-render-after-error impossible without the submit package.

---

## Decision

**`@renderly/submit` depends only on `@renderly/schema` and `@renderly/shared`. It has zero dependencies on `@renderly/html`, `@renderly/react`, or `@renderly/core`.**

The submit/render integration contract is:
1. `applyErrors(doc, errors)` returns a modified `Document` (same type as `parseDocument` returns).
2. The host app calls `walk(updatedDoc, registry)` (from `@renderly/core`) and then the adapter's `renderDocument` to re-render.
3. The adapters render error fields the same way they render any other field — the `errors` property on InputIRNode is just another field they read.

This means the host app is the integration point, not the submit package.

---

## Consequences

**Positive:**
- `@renderly/submit` is usable with any output adapter, including custom ones.
- Bundle size: a host app that uses only the HTML adapter does not pull in any React code through the submit package.
- The dependency graph remains acyclic: `@renderly/submit` is a sibling to the adapters, not above them.
- `applyErrors` can be tested entirely with plain JavaScript objects — no DOM, no jsdom, no React renderer needed.

**Negative / risks:**
- The host app must wire together `applyErrors → walk → renderDocument` explicitly after receiving server errors. There is no single `renderWithErrors(doc, errors, adapter)` convenience function. This is intentional — it preserves adapter independence — but is a common source of confusion for first-time integrators.
- Error rendering styles (e.g., border color on an errored field) are defined in `renderly.css`, not in the submit package. A developer who calls `applyErrors` and re-renders but forgets to include `renderly.css` will have errors in the data structure but no visual indication on screen.

**Invariant to preserve:**  
> `@renderly/submit/package.json` MUST NOT list `@renderly/html`, `@renderly/react`, or `@renderly/core` as **production** `dependencies`. They may appear as `devDependencies` because the submit package's e2e tests exercise the full `applyErrors → walk → renderDocument` pipeline. If a feature in submit's source code (`src/`) requires an import from any adapter, that feature belongs in the adapter or in the host app — not in submit.

---

## Alternatives considered

**Alternative A — Submit depends on core to perform the re-walk internally.**  
Rejected: would require submit to own the registry, meaning it would also need to know about all element types. The registry belongs to the adapter layer, not submit.

**Alternative B — A `@renderly/submit-html` adapter package that wraps submit + html.**  
Deferred: a reasonable convenience wrapper for the most common case. Should be built on top of the existing packages, not by changing their dependencies. Not needed for the current scope.

**Alternative C — `applyErrors` takes a render function and returns rendered output directly.**  
Rejected: couples the submit API to a specific adapter signature. As new adapters are added, the submit API would need new overloads.
