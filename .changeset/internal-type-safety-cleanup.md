---
"@renderly/a11y": patch
"@renderly/cli": patch
"@renderly/submit": patch
"@renderly/i18n": patch
---

No behavior change — removes unsafe or unnecessary type casts that were leaking past the type checker instead of relying on discriminated-union narrowing that already worked:

- `@renderly/a11y`: `auditNode`'s `switch (node.type)` already narrows `node` in each case; drops the redundant `as IRHeadingNode`/`as IRInputChoiceNode`/`as IRSubmitNode` casts and the anonymous `(node as { label: string })`/`(node as { id: string })` casts.
- `@renderly/cli`: `lintDocument`'s rule-checking helper cast `rule.when` and `.field` through `{ when?: { field?: string } }`, treating both as optional when `RuleCondition.field` is actually required on every `Rule` — the cast was silently discarding that guarantee, not just adding noise. `extractFields` had the same redundant-cast pattern for `required`.
- `@renderly/submit`: `extractFields` cast to `ChoiceInputElement` inside a branch already narrowed by `el.kind === 'choice'`.
- `@renderly/i18n`: `localizeElement` cast three object-spread results `as Element`; TypeScript's own narrowing and union-spread inference already produce the correct type.

`@renderly/cli` also fixes its build: the binary entry point (`src/cli.ts`) now builds as a separate `tsup` invocation without `--dts`, avoiding a `@types/node` resolution failure in the DTS worker that previously affected only this package's build.
