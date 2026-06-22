# ADR-0001: IR text values are stored unescaped — escaping is an output adapter responsibility

**Status:** Accepted  
**Date:** 2026-06-17  
**Packages affected:** `@renderly/core`, `@renderly/html`, `@renderly/react`

---

## Context

Renderly processes a JSON document through a pipeline:

```
Input (raw JSON) → validate → walk → IRNode tree → output adapter → rendered output
```

At the walk step, `@renderly/core` builds an `IRNode` tree from the validated `Document`. Each node carries string values that originated from the document definition — element labels, placeholder text, option labels, error messages, and so on.

A decision was needed: should the walker escape these strings (so the IRNode tree is "safe to emit") or should it store them as-is and delegate escaping to output adapters?

### Forces

- Different output formats have incompatible escaping rules. HTML requires `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#x27;`. JSX in React does not require manual escaping — JSX expressions escape text children automatically. A future Markdown adapter would not escape angle brackets at all. A PDF adapter would have no concept of HTML entities.
- If core escapes for HTML, then the React adapter receives double-escaped strings (`&amp;` in JSX text renders as the literal text `&amp;` on screen).
- If core performs no escaping, each adapter escapes in its own format exactly once — no over-escaping, no format conflicts.
- The IRNode tree is a data structure, not a rendering artifact. It represents what the form means, not how it is displayed.

---

## Decision

**`@renderly/core` stores all string values in IRNodes unescaped, exactly as received from the validated document.**

Each output adapter is solely responsible for escaping every user-supplied string before emission:

- `@renderly/html` — calls `escapeHtml(s)` on every string value before inserting it into the HTML output.
- `@renderly/react` — relies on JSX expression escaping (`{value}`). JSX always escapes text children and attribute values; no manual calls are needed.
- Any future adapter (Markdown, PDF, plain text) must define and apply its own escaping strategy appropriate to its output format.

---

## Consequences

**Positive:**
- The HTML adapter's XSS boundary is localised and auditable in one file (`renderers.ts`). Every `escapeHtml` call can be grep'd and reviewed without touching core.
- React's escaping is guaranteed by the JSX transform — there is no way for a React adapter renderer to accidentally emit unescaped HTML in a `{value}` expression.
- Adding a new output adapter (e.g., Markdown) requires only that the adapter author define its own escape rules — core is untouched.
- IRNode types can be used as pure data (serialised, logged, debugged) without carrying HTML entities.

**Negative / risks:**
- A developer writing a new output adapter **must** know this invariant. Forgetting to escape is a silent XSS vulnerability. There is no type-level enforcement (IRNode strings are `string`, not a `RawString` branded type).
- Any code path that takes an IRNode string value and emits it into HTML without going through an adapter (e.g., a test that does `expect(node.label).toBe(...)` and then injects into a DOM) bypasses the XSS boundary.

**Invariant to preserve:**  
> Every output adapter MUST call its format-appropriate escape function on every user-supplied string before emission. No adapter may trust that an IRNode string value is already escaped. This invariant must be tested explicitly — the e2e tests in `@renderly/example` assert that XSS payloads in field labels render as text, not markup.

---

## Alternatives considered

**Alternative A — Core escapes for HTML; adapters for other formats.**  
Rejected: creates double-escaping in the React adapter and in any non-HTML adapter. The core would need to know which adapter will consume the tree, violating the hexagonal architecture.

**Alternative B — Branded type `UnsafeString` forces adapter authors to call an escape function.**  
Deferred: would provide compile-time enforcement. The cost is wrapping every string in the IR types and unwrapping in adapters. Acceptable future enhancement if an adapter XSS bug is discovered in the wild.
