# ADR-0005: Ajv schema is compiled once at module load — validate.errors must be snapshotted before returning

**Status:** Accepted (with required mitigation — see §Consequences)  
**Date:** 2026-06-17  
**Packages affected:** `@renderly/input`

---

## Context

`@renderly/input` uses Ajv v8 to validate incoming JSON documents against `document.schema.json`. Ajv's `compile()` step parses the JSON Schema and produces a `ValidateFunction` — a compiled validator that can be called with any value and returns `true` (valid) or `false` (invalid, errors in `validate.errors`).

The `compile()` step is expensive relative to individual `validate()` calls — it constructs the internal validator graph, resolves `$ref`s, and JIT-compiles the check logic. For a schema the size of `document.schema.json`, compilation takes ~10–50 ms depending on runtime.

A decision was needed: compile the validator once at module load, or compile a fresh validator per `parseDocument()` call?

### Forces

- **Performance.** If `parseDocument` is called once on page load (typical browser use), the per-call vs. module-level distinction is irrelevant. If it is called many times in rapid succession (a server validating many form submissions, or a test suite with 100+ calls), per-call compilation multiplies cost by the call count.
- **Simplicity.** Module-level compilation means a single `const compiledValidate = ajv.compile(schema)` at the top of the file. Per-call compilation requires either a call-site `ajv.compile()` or a lazy singleton with initialisation logic.
- **Shared mutable state in `validate.errors`.** This is the critical risk. Ajv's `ValidateFunction` is not a pure function — after a call that returns `false`, the error details are stored in `validate.errors` (a mutable property on the function object itself). If two concurrent calls share the same `ValidateFunction`, the second call overwrites `validate.errors` before the first call has read them.
  - **Browser:** JavaScript is single-threaded. Two `parseDocument` calls cannot interleave. No race condition.
  - **Node.js / Edge SSR (Remix, Next.js App Router, Cloudflare Workers):** Requests are processed concurrently via the event loop. Two async request handlers calling `parseDocument` concurrently share the same module-scope `compiledValidate`. The race is real.

---

## Decision

**The Ajv schema is compiled once at module load time** (`const compiledValidate = ajv.compile(DOCUMENT_SCHEMA)` at module scope). This preserves the performance benefit of a single compilation.

**The mitigation for the shared-state race is mandatory:** `validateDocument` must snapshot `validate.errors` into a new array before any `await` or any code path that could yield. The snapshot must use a spread or `Array.from` to copy the error objects out of the shared property:

```typescript
// packages/input/src/validate.ts

const isValid = compiledValidate(value);

if (!isValid) {
  // Snapshot immediately — before any async boundary or further calls
  const failures = [...(compiledValidate.errors ?? [])];
  return err(toInputError(failures));
}
```

This ensures that even if another call invokes `compiledValidate` concurrently and overwrites `compiledValidate.errors`, the first call has already copied the errors into a local array.

The injectable `ValidateFunction` parameter on `validateDocument` is preserved to keep the function testable without Ajv.

---

## Consequences

**Positive:**
- One compilation per module lifetime. Cost is paid once regardless of how many documents are validated.
- Consistent with Ajv's own documentation: "Compile schemas as few times as possible."
- The injectable `ValidateFunction` parameter decouples the validation logic from Ajv for unit tests — tests can pass a mock validator without importing Ajv.

**Negative / risks:**
- **The snapshot mitigation is a convention, not a type-level guarantee.** A future contributor who reads `validate.errors` without snapshotting first re-introduces the race. The mitigation must be documented in a code comment at the point where `validate.errors` is read — this is one of the rare cases where a comment is justified.
- If the schema `compile()` call itself throws (malformed JSON Schema), the module fails to load entirely. Since the schema is a static file bundled with the library, this should only occur during development (e.g., editing `document.schema.json`). The failure mode is explicit and immediate, not silent.

**Required code comment (do not remove):**

```typescript
// Snapshot errors before returning — validate.errors is a mutable property shared
// across concurrent calls in SSR environments. The spread copies the array out of
// the shared object before any other call can overwrite it.
const failures = [...(compiledValidate.errors ?? [])];
```

**Invariant to preserve:**  
> `compiledValidate.errors` MUST be spread into a new array before it is read for any purpose. Never store a reference to `compiledValidate.errors` directly. Never read it after an `await` boundary.

---

## Alternatives considered

**Alternative A — Compile a fresh validator per `parseDocument()` call.**  
Rejected for production use: multiplication of 10–50 ms compilation cost per call is prohibitive in SSR scenarios. Acceptable in test environments only.

**Alternative B — Use `ajv.validate(schema, data)` (the convenience method that compiles and validates in one call).**  
Rejected: `ajv.validate` either compiles a new schema each time or uses Ajv's internal cache keyed by schema object identity. The behaviour is less predictable than explicit `compile` + reuse, and the error snapshot issue is the same.

**Alternative C — Use a mutex or AsyncLocalStorage to isolate validate.errors per request.**  
Deferred: solves the problem at the cost of a Node.js-specific dependency and non-trivial complexity. Not needed if the snapshot approach is followed consistently. Revisit if a future profiling session shows the snapshot is insufficient.

**Alternative D — Switch to a schema validator with a purely functional API (e.g., Zod).**  
Deferred: Zod's validation is pure (returns a `SafeParseResult` with no shared mutable state) and tree-shakes better. The migration cost is moderate — `document.schema.json` would be rewritten as a Zod schema, and the `@renderly/input` API would remain unchanged to callers. Valid future direction, especially if the Ajv bundle size becomes a concern.
