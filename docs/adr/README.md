# Architecture Decision Records

Decisions that are non-obvious, have lasting consequences, or were made after considering real alternatives are recorded here. Each ADR captures: the context that forced a decision, what was decided, the consequences (positive and negative), and the alternatives that were rejected and why.

| # | Title | Status | Packages |
|---|-------|--------|----------|
| [0001](./0001-ir-text-not-escaped.md) | IR text values are stored unescaped — escaping is an output adapter responsibility | Accepted | core, html, react |
| [0002](./0002-responsive-passthrough.md) | Responsive&lt;T&gt; values pass through the IR unchanged — resolution is deferred to output adapters | Accepted | schema, core, html, react |
| [0003](./0003-example-package-is-integration-layer.md) | @renderly/example is a private integration-test package — it must never be published | Accepted | example |
| [0004](./0004-submit-has-no-adapter-dependencies.md) | @renderly/submit has no output adapter dependencies — it is a pure domain module | Accepted | submit, html, react |
| [0005](./0005-ajv-module-level-compile.md) | Ajv schema is compiled once at module load — validate.errors must be snapshotted before returning | Accepted | input |

## How to add an ADR

1. Copy the format from any existing ADR.
2. Number it sequentially (`0006-...`).
3. Add a row to this table.
4. A new ADR is warranted when: a non-obvious design choice is made, an alternative was seriously considered and rejected, or a known risk is accepted with a mitigation. Routine implementation choices do not need ADRs.
